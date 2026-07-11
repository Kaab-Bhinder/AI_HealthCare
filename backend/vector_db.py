"""
MongoDB Atlas Vector Search for the medical knowledge base.

Embeddings live in the same Atlas cluster as the app data (collection
`kb_vectors`), queried with `$vectorSearch`. This replaces the small local
keyword/numpy RAG with a real vector database that scales to thousands of docs.

- embed_texts(): Gemini `gemini-embedding-001`, batched + throttled for the
  free-tier quota (~100 embeddings/min), reduced to 768 dims for compact storage.
- ingest(): embed a list of {title, content, source} docs and store them.
- ensure_index(): create the Atlas vectorSearch index (idempotent).
- retrieve_context(): embed the query, run $vectorSearch, return (context, found,
  sources). Falls back to an in-memory cosine scan if the index isn't ready, and
  to the local rag_engine if the vector collection is empty.
"""

import os
import time
import requests
import numpy as np

import db as dbmod

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
EMBED_MODEL = 'gemini-embedding-001'
EMBED_DIM = int(os.getenv('RAG_EMBED_DIM', '768'))
COLL_NAME = 'kb_vectors'
INDEX_NAME = 'kb_vector_index'
# Atlas cosine vectorSearchScore = (1 + cosine)/2, so ~0.72 ≈ raw cosine 0.44.
SCORE_THRESHOLD = float(os.getenv('RAG_VECTOR_THRESHOLD', '0.72'))
BATCH = int(os.getenv('RAG_EMBED_BATCH_SIZE', '80'))
PAUSE = float(os.getenv('RAG_EMBED_BATCH_PAUSE', '61'))


def _coll():
    return None if dbmod.db is None else dbmod.db[COLL_NAME]


# ---- embeddings ----------------------------------------------------------
def embed_texts(texts, task='RETRIEVAL_DOCUMENT', log=print):
    """Batch-embed texts with throttling. Returns list[list[float]]."""
    if not GEMINI_API_KEY:
        raise RuntimeError('GEMINI_API_KEY not set')
    url = (f'https://generativelanguage.googleapis.com/v1beta/models/'
           f'{EMBED_MODEL}:batchEmbedContents?key={GEMINI_API_KEY}')
    out = []
    n = len(texts)
    batches = [texts[i:i + BATCH] for i in range(0, n, BATCH)]
    for bi, chunk in enumerate(batches):
        body = {'requests': [{
            'model': f'models/{EMBED_MODEL}',
            'content': {'parts': [{'text': t[:8000]}]},
            'taskType': task,
            'outputDimensionality': EMBED_DIM,
        } for t in chunk]}
        for attempt in range(6):
            r = requests.post(url, json=body, timeout=120)
            if r.status_code == 429:
                if log:
                    log(f'[vector] rate limited on batch {bi + 1}/{len(batches)}, waiting {PAUSE:.0f}s')
                time.sleep(PAUSE + 1)
                continue
            r.raise_for_status()
            out.extend([e['values'] for e in r.json()['embeddings']])
            break
        else:
            raise RuntimeError('embedding failed after retries')
        if log:
            log(f'[vector] embedded batch {bi + 1}/{len(batches)} ({len(chunk)} docs)')
        if bi < len(batches) - 1:
            time.sleep(PAUSE)
    return out


def embed_query(text):
    return embed_texts([text], task='RETRIEVAL_QUERY', log=None)[0]


# ---- ingestion -----------------------------------------------------------
def _doc_text(d):
    return f"{d.get('title', '')}\n{d.get('content', '')}".strip()


def ingest(documents, reset=False, log=print):
    """Embed and store documents. Returns number stored."""
    coll = _coll()
    if coll is None:
        raise RuntimeError('MongoDB not connected')
    texts = [_doc_text(d) for d in documents]
    vecs = embed_texts(texts, log=log)
    if reset:
        coll.delete_many({})
    coll.insert_many([{
        'title': d.get('title', 'Untitled'),
        'content': d.get('content', ''),
        'source': d.get('source', 'kb'),
        'embedding': v,
    } for d, v in zip(documents, vecs)])
    ensure_index(log=log)
    return len(documents)


def ensure_index(log=print):
    """Create the Atlas vectorSearch index if it doesn't exist (idempotent)."""
    coll = _coll()
    if coll is None:
        return
    try:
        from pymongo.operations import SearchIndexModel
        existing = [i['name'] for i in coll.list_search_indexes()]
        if INDEX_NAME in existing:
            return
        model = SearchIndexModel(
            definition={'fields': [{
                'type': 'vector', 'path': 'embedding',
                'numDimensions': EMBED_DIM, 'similarity': 'cosine',
            }]},
            name=INDEX_NAME, type='vectorSearch',
        )
        coll.create_search_index(model=model)
        if log:
            log(f'[vector] created Atlas vector index "{INDEX_NAME}" (build is async)')
    except Exception as e:
        if log:
            log(f'[vector] could not create vector index: {e}')


def count():
    coll = _coll()
    return 0 if coll is None else coll.estimated_document_count()


# ---- retrieval -----------------------------------------------------------
def _vector_search(qvec, k):
    coll = _coll()
    pipeline = [
        {'$vectorSearch': {
            'index': INDEX_NAME, 'path': 'embedding',
            'queryVector': qvec, 'numCandidates': 150, 'limit': k,
        }},
        {'$project': {'title': 1, 'content': 1, 'source': 1,
                      'score': {'$meta': 'vectorSearchScore'}}},
    ]
    return list(coll.aggregate(pipeline))


def _cosine_fallback(qvec, k):
    """Used before the Atlas index finishes building: scan + cosine in numpy."""
    coll = _coll()
    docs = list(coll.find({}, {'title': 1, 'content': 1, 'source': 1, 'embedding': 1}))
    if not docs:
        return []
    mat = np.array([d['embedding'] for d in docs], dtype=np.float32)
    mat /= (np.linalg.norm(mat, axis=1, keepdims=True) + 1e-9)
    q = np.array(qvec, dtype=np.float32)
    q /= (np.linalg.norm(q) + 1e-9)
    sims = mat @ q
    order = np.argsort(sims)[::-1][:k]
    out = []
    for i in order:
        d = docs[i]
        out.append({'title': d['title'], 'content': d['content'],
                    'source': d.get('source'), 'score': (float(sims[i]) + 1) / 2})
    return out


def search(query, k=4):
    """Return ranked docs, or None if the vector collection is empty."""
    coll = _coll()
    if coll is None or count() == 0:
        return None
    qvec = embed_query(query)
    try:
        results = _vector_search(qvec, k)
        if results:
            return results
    except Exception as e:
        print(f'[vector] $vectorSearch unavailable ({str(e)[:80]}); cosine fallback')
    return _cosine_fallback(qvec, k)


def retrieve_context(query, limit=4):
    """(context, found, sources) — same contract as rag_engine."""
    try:
        results = search(query, limit)
    except Exception as e:
        print(f'[vector] search failed ({e}); using local rag_engine')
        results = None

    if results is None:
        import rag_engine
        return rag_engine.retrieve_context(query, limit)

    results = [r for r in results if r.get('score', 0) >= SCORE_THRESHOLD]
    if not results:
        return '', False, []

    context = 'RELEVANT MEDICAL KNOWLEDGE:\n\n'
    for i, r in enumerate(results, 1):
        context += f"{'=' * 70}\nTOPIC {i}: {r['title']}\n{'=' * 70}\n{r['content']}\n\n"
    sources = [{'title': r['title'], 'score': round(r.get('score', 0), 4)} for r in results]
    return context, True, sources
