#!/usr/bin/env python3
"""
Build the Atlas vector knowledge base from:
  1. the curated documents.json (117 medical topics)
  2. QuyenAnhDE/Diseases_Symptoms  — 400 diseases with symptoms + treatments
  3. keivalya/MedQuad-MedicalQnADataset — medical Q&A (sliced)

Datasets are pulled from HuggingFace's public datasets-server (no auth needed),
normalized to {title, content, source}, embedded with Gemini, and stored in the
Atlas `kb_vectors` collection with a vectorSearch index.

Usage:
  python3 ingest_dataset.py                # default sizes
  MEDQUAD_LIMIT=800 python3 ingest_dataset.py
"""

import os
import json
import requests
from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

import db as dbmod
import vector_db

DISEASES_LIMIT = int(os.getenv('DISEASES_LIMIT', '400'))
MEDQUAD_LIMIT = int(os.getenv('MEDQUAD_LIMIT', '400'))


def hf_rows(dataset, limit, split='train'):
    rows, offset = [], 0
    while len(rows) < limit:
        n = min(100, limit - len(rows))
        r = requests.get('https://datasets-server.huggingface.co/rows',
                         params={'dataset': dataset, 'config': 'default', 'split': split,
                                 'offset': offset, 'length': n}, timeout=40)
        r.raise_for_status()
        batch = r.json().get('rows', [])
        if not batch:
            break
        rows.extend([x['row'] for x in batch])
        offset += n
    return rows[:limit]


def build_documents():
    docs = []

    # 1) curated KB
    kb_path = os.path.join(os.path.dirname(__file__), 'knowledge_base', 'documents.json')
    if os.path.exists(kb_path):
        with open(kb_path) as f:
            kb = json.load(f)
        for v in kb.values():
            if v.get('content'):
                docs.append({'title': v.get('title', 'Untitled'),
                             'content': v['content'], 'source': 'curated'})
        print(f'[ingest] curated KB: {len(docs)} docs')

    # 2) diseases + symptoms + treatments
    try:
        ds = hf_rows('QuyenAnhDE/Diseases_Symptoms', DISEASES_LIMIT)
        added = 0
        for row in ds:
            name = (row.get('Name') or '').strip()
            if not name:
                continue
            content = (f"{name}. Common symptoms include: {row.get('Symptoms', 'n/a')}. "
                       f"Typical treatments include: {row.get('Treatments', 'n/a')}.")
            docs.append({'title': name, 'content': content, 'source': 'dataset:diseases_symptoms'})
            added += 1
        print(f'[ingest] Diseases_Symptoms: +{added}')
    except Exception as e:
        print(f'[ingest] Diseases_Symptoms failed: {e}')

    # 3) medical Q&A
    try:
        mq = hf_rows('keivalya/MedQuad-MedicalQnADataset', MEDQUAD_LIMIT)
        added = 0
        for row in mq:
            q = (row.get('Question') or '').strip().rstrip('?').strip()
            a = (row.get('Answer') or '').strip()
            if not q or not a or len(a) < 20:
                continue
            docs.append({'title': q[:140], 'content': a, 'source': 'dataset:medquad'})
            added += 1
        print(f'[ingest] MedQuAD: +{added}')
    except Exception as e:
        print(f'[ingest] MedQuAD failed: {e}')

    return docs


def main():
    if not dbmod.connect_mongodb():
        print('[ingest] MongoDB not connected — aborting')
        return
    docs = build_documents()
    print(f'[ingest] total documents: {len(docs)} — embedding (throttled for free tier)…')
    n = vector_db.ingest(docs, reset=True)
    print(f'[ingest] DONE — stored {n} docs in Atlas "{vector_db.COLL_NAME}"')
    print(f'[ingest] vector index "{vector_db.INDEX_NAME}" creation requested (async build).')


if __name__ == '__main__':
    main()
