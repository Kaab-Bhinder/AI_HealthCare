"""
Semantic RAG (Retrieval-Augmented Generation) engine for the Medical Assistant.

Upgrades the old keyword matcher (rag_simple.py) to true semantic search:
  * Embeds every knowledge-base document with Google's text-embedding-004 model.
  * Caches the embedding matrix to disk and rebuilds it only when the
    knowledge base actually changes (tracked with a content hash), so startup
    is instant after the first build.
  * Ranks documents by cosine similarity (numpy, no FAISS/torch needed).
  * Applies a relevance threshold so off-topic questions retrieve nothing
    instead of injecting irrelevant medical text.
  * Returns structured sources (title + score) so the UI can show provenance.

If embeddings are unavailable (no API key / offline), it transparently falls
back to the keyword search in rag_simple.py so the app never breaks.
"""

import os
import json
import pickle
import hashlib
from pathlib import Path

import numpy as np

# Keyword fallback (always importable, no heavy deps)
from rag_simple import get_rag as _get_keyword_rag

# Embedding model + tuning knobs
EMBED_MODEL = "models/text-embedding-004"
# Cosine similarity below this is treated as "not relevant" -> no context injected.
RELEVANCE_THRESHOLD = float(os.getenv("RAG_RELEVANCE_THRESHOLD", "0.62"))
DEBUG_AI = os.getenv("DEBUG_AI", "false").lower() == "true"


class SemanticRAG:
    """Vector-based retrieval over the medical knowledge base."""

    def __init__(self, kb_dir="knowledge_base", cache_dir="rag_cache"):
        self.kb_dir = kb_dir
        self.cache_dir = cache_dir
        self.kb_file = os.path.join(kb_dir, "documents.json")
        self.cache_file = os.path.join(cache_dir, "kb_vectors.pkl")

        self.doc_ids = []          # list[str]
        self.doc_meta = []         # list[dict] aligned with matrix rows
        self.matrix = None         # np.ndarray (n_docs, dim), L2-normalized
        self._embeddings = None    # lazily created embedding client
        self.ready = False         # True once semantic search is usable

        Path(self.cache_dir).mkdir(exist_ok=True)
        self._initialize()

    # ---- embedding client -------------------------------------------------
    def _get_embeddings(self):
        if self._embeddings is None:
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                raise RuntimeError("GEMINI_API_KEY not set; cannot embed")
            from langchain_google_genai import GoogleGenerativeAIEmbeddings
            self._embeddings = GoogleGenerativeAIEmbeddings(
                model=EMBED_MODEL, google_api_key=api_key
            )
        return self._embeddings

    # ---- knowledge base loading ------------------------------------------
    def _load_documents(self):
        if not os.path.exists(self.kb_file):
            return {}
        try:
            with open(self.kb_file, "r") as f:
                return json.load(f)
        except Exception as e:
            print(f"[WARNING] RAG: failed to load documents: {e}")
            return {}

    def _kb_hash(self, docs):
        """Stable hash of the KB content so we can detect changes."""
        blob = json.dumps(docs, sort_keys=True).encode("utf-8")
        return hashlib.sha256(blob).hexdigest()

    @staticmethod
    def _doc_text(doc):
        """Text we embed: title carries strong signal, so include it."""
        title = doc.get("title", "")
        content = doc.get("content", "")
        return f"{title}\n{content}".strip()

    # ---- index build / cache ---------------------------------------------
    def _initialize(self):
        docs = self._load_documents()
        if not docs:
            print("[WARNING] RAG: knowledge base is empty")
            return

        kb_hash = self._kb_hash(docs)

        # Try cached vectors first.
        if os.path.exists(self.cache_file):
            try:
                with open(self.cache_file, "rb") as f:
                    cache = pickle.load(f)
                if cache.get("hash") == kb_hash and cache.get("model") == EMBED_MODEL:
                    self.doc_ids = cache["doc_ids"]
                    self.doc_meta = cache["doc_meta"]
                    self.matrix = cache["matrix"]
                    self.ready = True
                    if DEBUG_AI:
                        print(f"[DEBUG] RAG: loaded cached index ({len(self.doc_ids)} docs)")
                    return
                elif DEBUG_AI:
                    print("[DEBUG] RAG: cache stale, rebuilding index")
            except Exception as e:
                print(f"[WARNING] RAG: cache load failed ({e}), rebuilding")

        self._build_index(docs, kb_hash)

    def _build_index(self, docs, kb_hash):
        try:
            embeddings = self._get_embeddings()
        except Exception as e:
            print(f"[WARNING] RAG: embeddings unavailable ({e}); "
                  f"falling back to keyword search")
            self.ready = False
            return

        doc_ids, doc_meta, texts = [], [], []
        for doc_id, doc in docs.items():
            doc_ids.append(doc_id)
            doc_meta.append({
                "doc_id": doc_id,
                "title": doc.get("title", "Untitled"),
                "content": doc.get("content", ""),
            })
            texts.append(self._doc_text(doc))

        try:
            print(f"[DEBUG] RAG: embedding {len(texts)} documents "
                  f"(one-time, cached afterwards)...")
            vectors = embeddings.embed_documents(texts)
        except Exception as e:
            print(f"[ERROR] RAG: embedding failed ({e}); falling back to keyword search")
            self.ready = False
            return

        matrix = np.array(vectors, dtype=np.float32)
        matrix = self._normalize(matrix)

        self.doc_ids = doc_ids
        self.doc_meta = doc_meta
        self.matrix = matrix
        self.ready = True

        try:
            with open(self.cache_file, "wb") as f:
                pickle.dump({
                    "hash": kb_hash,
                    "model": EMBED_MODEL,
                    "doc_ids": doc_ids,
                    "doc_meta": doc_meta,
                    "matrix": matrix,
                }, f)
            if DEBUG_AI:
                print(f"[DEBUG] RAG: cached index to {self.cache_file}")
        except Exception as e:
            print(f"[WARNING] RAG: could not write cache ({e})")

    # ---- math helpers -----------------------------------------------------
    @staticmethod
    def _normalize(mat):
        norms = np.linalg.norm(mat, axis=1, keepdims=True)
        norms[norms == 0] = 1e-9
        return mat / norms

    # ---- retrieval --------------------------------------------------------
    def search(self, query, limit=3):
        """Return list of {doc_id, title, content, score} ranked by relevance."""
        if not self.ready or self.matrix is None:
            return self._keyword_fallback(query, limit)

        try:
            qvec = self._get_embeddings().embed_query(query)
        except Exception as e:
            if DEBUG_AI:
                print(f"[DEBUG] RAG: query embed failed ({e}); keyword fallback")
            return self._keyword_fallback(query, limit)

        q = self._normalize(np.array([qvec], dtype=np.float32))[0]
        scores = self.matrix @ q  # cosine similarity (both normalized)

        top_idx = np.argsort(scores)[::-1][:limit]
        results = []
        for idx in top_idx:
            score = float(scores[idx])
            if score < RELEVANCE_THRESHOLD:
                continue
            meta = self.doc_meta[idx]
            results.append({
                "doc_id": meta["doc_id"],
                "title": meta["title"],
                "content": meta["content"],
                "score": round(score, 4),
            })
        return results

    def _keyword_fallback(self, query, limit):
        results = _get_keyword_rag().simple_search(query, limit)
        for r in results:
            r.setdefault("score", None)
        return results

    def retrieve_context(self, query, limit=3):
        """
        Return (context_str, found, sources).
          context_str : formatted knowledge block for the LLM prompt
          found       : True if any relevant document cleared the threshold
          sources     : list of {title, score} for UI provenance
        """
        results = self.search(query, limit)
        if not results:
            return "", False, []

        context = "RELEVANT MEDICAL KNOWLEDGE:\n\n"
        for i, r in enumerate(results, 1):
            context += f"{'='*70}\n"
            context += f"TOPIC {i}: {r['title']}\n"
            context += f"{'='*70}\n"
            context += f"{r['content']}\n\n"

        sources = [{"title": r["title"], "score": r.get("score")} for r in results]
        return context, True, sources


# ---- module-level singleton + helpers (drop-in for rag_simple) -----------
_engine = None


def get_engine():
    global _engine
    if _engine is None:
        _engine = SemanticRAG()
    return _engine


def retrieve_context(query, limit=3):
    """Returns (context, found, sources)."""
    return get_engine().retrieve_context(query, limit)


def search_knowledge_base(query, limit=3):
    return get_engine().search(query, limit)
