# StudyBuddy AI 🎓

A RAG-powered study assistant that lets you upload lecture notes (PDFs) and ask questions about them. Instead of answering from general knowledge, it searches through YOUR notes and answers only from what it finds — so every answer matches your actual syllabus.

## How it works

1. You upload a lecture PDF
2. The app splits it into small chunks (~500 characters each)
3. Each chunk gets converted into a vector (a list of numbers that captures its meaning)
4. Vectors are stored in ChromaDB (a local vector database)
5. When you ask a question, your question also becomes a vector
6. ChromaDB finds the 4 chunks most similar to your question
7. Those chunks + your question get sent to an LLM (via Groq API)
8. The LLM answers using ONLY the provided chunks — no hallucination

## Tech stack

- **Frontend:** React (Vite)
- **Backend:** Flask, Python
- **RAG pipeline:** LangChain, ChromaDB, HuggingFace Embeddings (all-MiniLM-L6-v2)
- **LLM:** Llama 3.1 via Groq API (free tier)
- **Embedding:** Runs locally on CPU — no GPU needed

## Getting started

### 1. Get a free Groq API key

Sign up at [console.groq.com](https://console.groq.com) (no credit card needed) and create an API key.

### 2. Backend setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux
pip install -r requirements.txt
```

Create a `.env` file inside `backend/`: GROQ_API_KEY=your_key_here

Start the server:

```bash
python app.py
```

The API runs at `http://localhost:5000`.

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## API endpoints

- `POST /upload` — upload a PDF file to be chunked and embedded
- `POST /ask` — send a question and get an answer from your notes
- `GET /stats` — see how many chunks are stored
- `POST /clear` — delete all stored chunks

## Project structure

studybuddy-ai/
├── backend/
│   ├── app.py              # Flask API server
│   ├── rag_engine.py        # RAG pipeline (chunking, embedding, querying)
│   ├── .env                 # Groq API key (not committed)
│   └── chroma_db/           # Vector database (auto-created)
├── frontend/
│   └── src/
│       ├── App.jsx          # Chat UI
│       └── App.css          # Styling
└── README.md

## What I learned building this

- How RAG (Retrieval Augmented Generation) works end to end
- Document chunking strategies and why chunk size/overlap matters
- Vector embeddings and similarity search using cosine distance
- Prompt engineering to ground LLM responses in source documents
- Connecting a Python ML backend to a React frontend

## Future improvements

- Chat history so follow-up questions have context
- Support for .docx and .txt files
- "Quiz me" mode that generates questions from your notes
- Page number tracking in source attribution
- Deployment on Render + Vercel