# StudyBuddy AI

An agentic RAG-powered study assistant. Upload your lecture PDFs, ask questions, get quizzed, generate flashcards, or get summaries — all grounded in YOUR notes, not general knowledge.

**Live Demo:** [studybuddy-ai.vercel.app](https://studybuddy-ai.vercel.app)

**HF Space:** [huggingface.co/spaces/Rosheni123/studybuddy-ai](https://huggingface.co/spaces/Rosheni123/studybuddy-ai)

---

## Screenshots

### Landing Page

<img width="1907" height="874" alt="image" src="https://github.com/user-attachments/assets/6dcb8d99-282d-4c70-b427-ab0bfabde5eb" />



<img width="1902" height="879" alt="image" src="https://github.com/user-attachments/assets/78ad5d18-07e5-4265-bcb2-d69575b16fdc" />



### Study App

<img width="1903" height="869" alt="image" src="https://github.com/user-attachments/assets/feeca2fc-8d03-46b9-bd4c-9235508385ae" />



### Chat with Notes


<img width="1899" height="865" alt="image" src="https://github.com/user-attachments/assets/737c24d1-03fd-4a51-9508-c2c93b48dbf5" />


### Upload & Database


<img width="1912" height="863" alt="image" src="https://github.com/user-attachments/assets/25579bdd-168b-4559-a068-74f05e49fb2b" />


---

## Features

- **Ask Questions** — answers sourced only from your uploaded notes
- **Quiz Generation** — MCQs (theory, practical, or mixed) from your notes
- **Summarize** — organized revision notes from any chapter or topic
- **Flashcards** — term and definition pairs for quick revision
- **Explain Like a Kid** — adapts explanation style to how you ask
- **Google Sign-In** — Firebase Authentication with Google provider
- **Chat History** — save, load, rename and delete past chats via Firestore
- **Per-User Notes** — each user's PDFs are private (ChromaDB metadata filtering)
- **Multi-PDF Support** — upload multiple PDFs, agent knows which files are loaded
- **Source Citations** — every answer shows which parts of your notes it came from
- **PDF Persistence** — ChromaDB backed up to a private HF dataset repo (survives Space restarts)

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
| **Auth & Database** | Firebase Authentication (Google), Cloud Firestore |
| **Backend API** | Flask (local dev), Gradio (HF Space) |
| **Agentic Layer** | LLM tool calling with keyword fallback |
| **RAG Pipeline** | LangChain, ChromaDB (per-user metadata filtering) |
| **Embeddings** | all-MiniLM-L6-v2 (ONNX, CPU) |
| **LLM** | Qwen 3.8 27B via Groq API |
| **Data Persistence** | HF Dataset repo backup (ChromaDB) |
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
│       ├── firebase.js        # Firebase init (auth + Firestore)
│       ├── history.js         # Firestore chat CRUD + real-time listener
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

### Firebase Setup (optional, for auth & chat history)

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** → Google provider
3. Create a **Firestore Database** (test mode or with security rules)
4. Register a web app and copy the config values

Create `.env` inside `frontend/`:
```
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_APP_ID=your_app_id
```

The app works without Firebase — sign-in and chat history are disabled gracefully.

### HF Dataset Backup (optional, for PDF persistence)

1. Create a **private** dataset repo on HuggingFace (e.g. `your-username/studybuddy-data`)
2. Generate an **Access Token** with write permission (Settings → Access Tokens)
3. Add `HF_TOKEN` to your HF Space's Secrets

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
- Firebase Authentication and Firestore for user management and chat persistence
- Per-user metadata filtering in ChromaDB for data isolation
- Backing up vector databases to HuggingFace dataset repos

---

Built by **Rosheni** · 
