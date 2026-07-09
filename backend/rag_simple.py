"""
Simple RAG (Retrieval-Augmented Generation) System for Medical Assistant
Uses existing langchain tools without extra dependencies
"""

import os
import json
from pathlib import Path
from datetime import datetime

class SimpleRAG:
    """Simple RAG system that uses a local knowledge base"""
    
    def __init__(self, kb_dir="knowledge_base"):
        self.kb_dir = kb_dir
        self._ensure_kb_dir()
        self.documents = self._load_documents()
    
    def _ensure_kb_dir(self):
        """Create knowledge base directory if it doesn't exist"""
        Path(self.kb_dir).mkdir(exist_ok=True)
    
    def _load_documents(self):
        """Load all documents from the knowledge base"""
        docs = {}
        kb_file = os.path.join(self.kb_dir, "documents.json")
        if os.path.exists(kb_file):
            try:
                with open(kb_file, 'r') as f:
                    docs = json.load(f)
            except Exception as e:
                print(f"[WARNING] Failed to load documents: {e}")
        return docs
    
    def _save_documents(self):
        """Save documents to disk"""
        kb_file = os.path.join(self.kb_dir, "documents.json")
        try:
            with open(kb_file, 'w') as f:
                json.dump(self.documents, f, indent=2)
        except Exception as e:
            print(f"[ERROR] Failed to save documents: {e}")
    
    def add_document(self, content, title="Untitled", source="user"):
        """Add a document to the knowledge base"""
        doc_id = f"{source}_{datetime.now().timestamp()}"
        self.documents[doc_id] = {
            "title": title,
            "content": content,
            "source": source,
            "timestamp": datetime.utcnow().isoformat()
        }
        self._save_documents()
        return doc_id
    
    def simple_search(self, query, limit=3):
        """Simple keyword-based search with better matching"""
        query_words = query.lower().split()
        results = []
        
        for doc_id, doc in self.documents.items():
            title = doc.get('title', '').lower()
            content = doc.get('content', '').lower()
            combined = title + ' ' + content
            
            # Score matches - prioritize title matches
            title_matches = sum(1 for word in query_words if word in title)
            content_matches = sum(1 for word in query_words if word in content)
            
            # Weight title matches higher
            score = (title_matches * 3) + content_matches
            
            if score > 0:
                results.append({
                    'doc_id': doc_id,
                    'title': doc['title'],
                    'content': doc['content'],  # Return full content for detailed answers
                    'score': score
                })
        
        # Sort by score and return top results
        results.sort(key=lambda x: x['score'], reverse=True)
        return results[:limit]
    
    def retrieve_context(self, query, limit=3):
        """Retrieve relevant context for a query with confidence indicator"""
        results = self.simple_search(query, limit)
        
        if not results:
            return "", False  # Return empty context and False for "not found"
        
        context = "📚 RELEVANT MEDICAL KNOWLEDGE:\n\n"
        for i, result in enumerate(results, 1):
            context += f"{'='*80}\n"
            context += f"TOPIC {i}: {result['title']}\n"
            context += f"{'='*80}\n"
            context += f"{result['content']}\n\n"
        
        return context, True  # Return context and True for "found"

# Global RAG instance
_rag_instance = None

def get_rag():
    """Get or create the global RAG instance"""
    global _rag_instance
    if _rag_instance is None:
        _rag_instance = SimpleRAG()
    return _rag_instance

def retrieve_context(query, limit=3):
    """Retrieve context for a query - returns (context, found) tuple"""
    rag = get_rag()
    return rag.retrieve_context(query, limit)

def add_to_knowledge_base(content, title="Untitled", source="user"):
    """Add content to the knowledge base"""
    rag = get_rag()
    return rag.add_document(content, title, source)

def search_knowledge_base(query, limit=3):
    """Search the knowledge base"""
    rag = get_rag()
    return rag.simple_search(query, limit)
