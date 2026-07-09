"""
RAG (Retrieval-Augmented Generation) System for Medical Assistant
Uses FAISS for vector similarity search and sentence-transformers for embeddings
"""

import os
import json
import pickle
from pathlib import Path
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

class MedicalKnowledgeBase:
    """Manages medical knowledge base with RAG capabilities"""
    
    def __init__(self, knowledge_dir="knowledge_base", db_path="faiss_db"):
        self.knowledge_dir = knowledge_dir
        self.db_path = db_path
        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2",
            model_kwargs={"device": "cpu"}
        )
        self.vector_store = None
        self.documents = []
        self._initialize()
    
    def _initialize(self):
        """Initialize knowledge base from files or load existing FAISS index"""
        # Try to load existing FAISS index
        if os.path.exists(self.db_path):
            try:
                self.vector_store = FAISS.load_local(
                    self.db_path, 
                    self.embeddings,
                    allow_dangerous_deserialization=True
                )
                print("[DEBUG] Loaded existing FAISS index")
                return
            except Exception as e:
                print(f"[WARNING] Could not load FAISS index: {e}")
        
        # Create knowledge base from markdown files
        self._build_knowledge_base()
    
    def _build_knowledge_base(self):
        """Build knowledge base from markdown files in knowledge_dir"""
        os.makedirs(self.knowledge_dir, exist_ok=True)
        
        # Create default medical knowledge if directory is empty
        if not any(Path(self.knowledge_dir).glob("*.md")):
            self._create_default_knowledge()
        
        # Load documents from markdown files
        documents = []
        for md_file in Path(self.knowledge_dir).glob("*.md"):
            try:
                with open(md_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                    documents.append(Document(
                        page_content=content,
                        metadata={"source": md_file.name}
                    ))
            except Exception as e:
                print(f"[ERROR] Reading {md_file}: {e}")
        
        if documents:
            # Split documents into chunks
            splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200,
                separators=["\n\n", "\n", ". ", " ", ""]
            )
            split_docs = splitter.split_documents(documents)
            
            # Create FAISS vector store
            self.vector_store = FAISS.from_documents(split_docs, self.embeddings)
            self.vector_store.save_local(self.db_path)
            print(f"[DEBUG] Created FAISS index with {len(split_docs)} chunks")
        else:
            print("[WARNING] No documents found in knowledge base")
    
    def _create_default_knowledge(self):
        """Create default medical knowledge base"""
        default_knowledge = {
            "common_symptoms.md": """# Common Symptoms and General Guidance

## Back Pain
Back pain is very common and can have many causes including muscle strain, poor posture, or disc issues.

### Self-Care Measures:
- Rest briefly, but stay gently active
- Apply ice for first 24-48 hours to reduce inflammation
- Use heat therapy after 48 hours to relax muscles
- Do gentle stretching exercises
- Maintain proper posture
- Use supportive pillows

### When to See a Doctor:
- Pain lasts more than 2 weeks
- Pain is severe or worsening
- Pain radiates down the leg
- Accompanied by numbness or tingling
- After an injury or fall

## Headaches
Headaches can be tension-related, migraines, or caused by dehydration, stress, or other factors.

### Self-Care:
- Rest in a quiet, dark room
- Stay hydrated with water
- Apply cold or warm compress
- Take over-the-counter pain relievers (follow package directions)
- Practice relaxation techniques
- Avoid triggers (caffeine, stress, certain foods)

### See a Doctor If:
- Sudden severe headache (worst pain ever)
- Accompanied by fever, stiff neck, or confusion
- Vision changes
- Numbness or weakness
- Lasts more than a few days

## Stomach Ache
Stomach issues can be caused by indigestion, food, stress, or other digestive issues.

### Home Care:
- Rest and relax
- Sip clear fluids (water, broth, electrolytes)
- Eat bland foods (toast, rice, bananas)
- Avoid spicy, fatty, or acidic foods
- Try ginger or peppermint tea
- Apply warm compress to abdomen

### See a Doctor For:
- Severe or sudden pain
- Persistent vomiting
- Blood in vomit or stool
- Abdominal rigidity or severe tenderness
- Pain lasting more than a day
- Fever above 100.4°F (38°C)

## General Health Tips

### Preventive Care:
1. Maintain regular exercise and stretching
2. Eat balanced, nutritious meals
3. Stay hydrated (8 glasses water daily)
4. Get adequate sleep (7-9 hours)
5. Manage stress through relaxation techniques
6. Wash hands regularly
7. Keep vaccinations current

### When to Seek Medical Attention:
- Severe or persistent pain
- High fever (above 101°F or 38.3°C)
- Difficulty breathing
- Chest pain
- Severe bleeding
- Loss of consciousness
- Signs of stroke (face drooping, arm weakness, speech difficulty)
""",
            "medical_disclaimer.md": """# Important Medical Disclaimer

This AI assistant provides general health information and guidance only. It is NOT a substitute for professional medical advice, diagnosis, or treatment.

## Always Remember:
- Consult a qualified healthcare professional for medical concerns
- Do not rely solely on this AI for health decisions
- Emergency symptoms require immediate medical attention
- Individual health conditions vary greatly
- Professional doctors can examine you in person

## When to Seek Immediate Care:
- Chest pain or pressure
- Difficulty breathing
- Severe allergic reactions
- Sudden severe pain
- Loss of consciousness
- Signs of stroke or heart attack
- Severe bleeding
- Suspected poisoning

For emergencies, call emergency services (911 in US) immediately.
"""
        }
        
        os.makedirs(self.knowledge_dir, exist_ok=True)
        for filename, content in default_knowledge.items():
            filepath = os.path.join(self.knowledge_dir, filename)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"[DEBUG] Created {filename}")
    
    def retrieve_context(self, query, k=3):
        """Retrieve relevant documents from knowledge base"""
        if not self.vector_store:
            print("[WARNING] Vector store not initialized")
            return []
        
        try:
            results = self.vector_store.similarity_search(query, k=k)
            context = "\n\n".join([doc.page_content for doc in results])
            return context
        except Exception as e:
            print(f"[ERROR] Retrieval failed: {e}")
            return ""
    
    def add_document(self, content, metadata=None):
        """Add new document to knowledge base"""
        try:
            doc = Document(page_content=content, metadata=metadata or {})
            splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000,
                chunk_overlap=200
            )
            split_docs = splitter.split_documents([doc])
            
            if self.vector_store:
                self.vector_store.add_documents(split_docs)
            else:
                self.vector_store = FAISS.from_documents(split_docs, self.embeddings)
            
            self.vector_store.save_local(self.db_path)
            print(f"[DEBUG] Added document with {len(split_docs)} chunks")
        except Exception as e:
            print(f"[ERROR] Adding document: {e}")

# Global knowledge base instance
_kb = None

def get_knowledge_base():
    """Get or create knowledge base instance"""
    global _kb
    if _kb is None:
        _kb = MedicalKnowledgeBase()
    return _kb

def retrieve_context(query):
    """Retrieve context for a query"""
    kb = get_knowledge_base()
    return kb.retrieve_context(query, k=3)
