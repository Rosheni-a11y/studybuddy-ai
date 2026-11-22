# StudyBuddy AI

An agentic RAG-powered study assistant. Upload your lecture PDFs, ask questions, get quizzed, generate flashcards, or get summaries — all grounded in YOUR notes, not general knowledge.

**Live Demo:** [studybuddy-ai.vercel.app](https://studybuddy-ai.vercel.app)
**HF Space:** [huggingface.co/spaces/Rosheni123/studybuddy-ai](https://huggingface.co/spaces/Rosheni123/studybuddy-ai)

---

## Screenshots

### Landing Page

<!-- ![Landing Page](screenshots/landing.png) -->

### Study App

<!-- ![Study App](screenshots/app.png) -->

### Chat with Notes

<!-- ![Chat](screenshots/chat.png) -->

### Upload & Database

<!-- ![Upload](screenshots/upload.png) -->

---

## Features

- **Ask Questions** — answers sourced only from your uploaded notes
- **Quiz Generation** — MCQs (theory, practical, or mixed) from your notes
- **Summarize** — organized revision notes from any chapter or topic
- **Flashcards** — term and definition pairs for quick revision
- **Explain Like a Kid** — adapts explanation style to how you ask
- **Chat History** — agent remembers context within a conversation
- **Multi-PDF Support** — upload multiple PDFs, agent knows which files are loaded
- **Source Citations** — every answer shows which parts of your notes it came from

---

## How It Works

```
1. Upload PDF  →  Split into ~500 char chunks
2. Embed chunks  →  all-MiniLM-L6-v2 (CPU)
3. Store vectors  →  ChromaDB
4. Ask a question  →  Question becomes a vector
5. Semantic search  →  Find most similar chunks
6. Agent decides  →  Which tool to call (ask, quiz, summarize, flashcards)
7. LLM generates  →  Response using ONLY your notes
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React + Vite, Three.js (3D landing page) |
| **Backend API** | Flask (local dev), Gradio (HF Space) |
| **Agentic Layer** | LLM tool calling with keyword fallback |
| **RAG Pipeline** | LangChain, ChromaDB |
| **Embeddings** | all-MiniLM-L6-v2 (ONNX, CPU) |
| **LLM** | Qwen 3.8 27B via Groq API |
| **Deployment** | Vercel (frontend), HF Spaces (backend, ZeroGPU) |

---

## Evaluation

Retrieval evaluation on 20 Q&A pairs from a Flutter lecture PDF:

| Metric | Score |
|--------|-------|
| **Average Recall** | 97.8% |
| **Perfect Recall (100%)** | 18/20 |
| **Partial Recall** | 2/20 |
| **Failures** | 0/20 |

---

## Project Structure

```
studybuddy-ai/
├── frontend/                  # React + Vite (deployed on Vercel)
│   └── src/
│       ├── App.jsx            # Study app with chat, upload, stats
│       ├── App.css            # Paper/ink design system
│       ├── Landing.jsx        # Landing page with 3D mascot
│       ├── Landing.css
│       ├── landing3d.js       # Three.js animated book character
│       ├── Mascot.jsx         # SVG fallback mascot
│       ├── api.js             # Gradio client + Flask API calls
│       └── index.css
├── hf-space/                  # Deployed on HF Spaces
│   ├── app.py                 # Gradio UI + API endpoints
│   ├── agent.py               # Agentic layer (6 tools)
│   ├── rag_engine.py          # RAG pipeline
│   └── requirements.txt
├── backend/                   # Local development
│   ├── app.py                 # Flask API server
│   ├── agent.py               # Agent (local version)
│   ├── rag_engine.py          # RAG pipeline
│   ├── mcp_tools.py           # FastMCP server
│   └── eval/
│       ├── run_eval.py        # Retrieval evaluation script
│       ├── eval_data.json     # 20 Q&A test pairs
│       └── eval_results.json
└── README.md
```

---

## Local Development

### 1. Get a free Groq API key

Sign up at [console.groq.com](https://console.groq.com) and create an API key.

### 2. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux
pip install -r requirements.txt
```

Create `.env` inside `backend/`:
```
GROQ_API_KEY=your_key_here
```

Start the server:
```bash
python app.py
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Run evaluation

```bash
cd backend/eval
python run_eval.py
```

---

## What I Learned

- RAG (Retrieval Augmented Generation) end-to-end pipeline
- Document chunking strategies and why chunk size/overlap matters
- Vector embeddings and similarity search with ChromaDB
- Building an agentic layer with LLM tool calling
- MCP (Model Context Protocol) tool design with FastMCP
- React frontend with Three.js 3D graphics
- Deploying across Vercel (frontend) and HF Spaces (backend)
- Retrieval evaluation methodology (recall measurement)
- Prompt engineering to ground LLM responses in source documents

---

Built by **Rosheni** · [Portfolio](https://roshenios95.vercel.app) · [GitHub](https://github.com/Rosheni-a11y/studybuddy-ai)
