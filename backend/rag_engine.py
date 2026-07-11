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
import re
import json
import time
import pickle
import hashlib
from pathlib import Path

import numpy as np

# Keyword fallback (always importable, no heavy deps)
from rag_simple import get_rag as _get_keyword_rag

# Embedding model + tuning knobs
EMBED_MODEL = os.getenv("RAG_EMBED_MODEL", "models/gemini-embedding-001")
# Cosine similarity below this is treated as "not relevant" -> no context injected.
RELEVANCE_THRESHOLD = float(os.getenv("RAG_RELEVANCE_THRESHOLD", "0.78"))
# Free-tier embedding quota is ~100 requests/minute. We embed in batches and
# pause between them so the one-time index build never trips the rate limit.
EMBED_BATCH_SIZE = int(os.getenv("RAG_EMBED_BATCH_SIZE", "80"))
EMBED_BATCH_PAUSE = float(os.getenv("RAG_EMBED_BATCH_PAUSE", "61"))
DEBUG_AI = os.getenv("DEBUG_AI", "false").lower() == "true"


class SemanticRAG:
    """Vector-based retrieval over the medical knowledge base."""

    def __init__(self, kb_dir="knowledge_base", cache_dir=None):
        if cache_dir is None:
            cache_dir = '/tmp/rag_cache' if os.getenv('VERCEL') else 'rag_cache' 
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

    def _embed_documents_throttled(self, embeddings, texts):
        """
        Embed all documents in rate-limit-friendly batches. Returns a list of
        vectors, or None if a batch permanently fails. On a 429 (quota) it waits
        the delay the API suggests and retries that batch.
        """
        all_vecs = []
        n = len(texts)
        batches = [texts[i:i + EMBED_BATCH_SIZE] for i in range(0, n, EMBED_BATCH_SIZE)]
        print(f"[DEBUG] RAG: embedding {n} documents in {len(batches)} batch(es) "
              f"(one-time, cached afterwards)...")

        for bi, batch in enumerate(batches):
            attempts = 0
            while True:
                attempts += 1
                try:
                    all_vecs.extend(embeddings.embed_documents(batch))
                    if DEBUG_AI:
                        print(f"[DEBUG] RAG: embedded batch {bi + 1}/{len(batches)} "
                              f"({len(batch)} docs)")
                    break
                except Exception as e:
                    msg = str(e)
                    is_rate = "429" in msg or "quota" in msg.lower() or "rate" in msg.lower()
                    if is_rate and attempts <= 5:
                        wait = self._parse_retry_delay(msg) or EMBED_BATCH_PAUSE
                        print(f"[WARNING] RAG: rate limited on batch {bi + 1}, "
                              f"waiting {wait:.0f}s then retrying...")
                        time.sleep(wait + 1)
                        continue
                    print(f"[ERROR] RAG: batch {bi + 1} failed: {e}")
                    return None

            # Pause between batches (not after the last) to respect the quota.
            if bi < len(batches) - 1:
                if DEBUG_AI:
                    print(f"[DEBUG] RAG: pausing {EMBED_BATCH_PAUSE:.0f}s to respect quota...")
                time.sleep(EMBED_BATCH_PAUSE)

        return all_vecs

    @staticmethod
    def _parse_retry_delay(msg):
        """Pull the suggested retry delay (seconds) out of a Gemini 429 message."""
        m = re.search(r"retry in ([0-9.]+)s", msg) or re.search(r"seconds: ([0-9]+)", msg)
        return float(m.group(1)) if m else None

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

        vectors = self._embed_documents_throttled(embeddings, texts)
        if vectors is None:
            print("[ERROR] RAG: embedding failed; falling back to keyword search")
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

        # Over-fetch, then dedupe by title (the KB contains some duplicate docs)
        # keeping the highest-scoring copy, before trimming to `limit`.
        order = np.argsort(scores)[::-1][: max(limit * 4, limit)]
        results = []
        seen_titles = set()
        for idx in order:
            score = float(scores[idx])
            if score < RELEVANCE_THRESHOLD:
                continue
            meta = self.doc_meta[idx]
            title_key = meta["title"].strip().lower()
            if title_key in seen_titles:
                continue
            seen_titles.add(title_key)
            results.append({
                "doc_id": meta["doc_id"],
                "title": meta["title"],
                "content": meta["content"],
                "score": round(score, 4),
            })
            if len(results) >= limit:
                break
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
