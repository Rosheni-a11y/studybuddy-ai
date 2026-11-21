# StudyBuddy AI 📚

An agentic RAG-powered study assistant. Upload your lecture PDFs, ask questions, get quizzed, generate flashcards, or get summaries. All grounded in YOUR notes, not general knowledge.

🔗 **Live Demo:** [huggingface.co/spaces/Rosheni123/studybuddy-ai](https://huggingface.co/spaces/Rosheni123/studybuddy-ai)

## Features

- **Ask Questions** get answers sourced only from your uploaded notes
- **Quiz Generation** MCQs (theory, practical scenarios, or mixed) from your notes
- **Summarize** get organized revision notes from any chapter or topic
- **Flashcards** term and definition pairs for quick revision
- **Explain Like a Kid** adapts explanation style to how you ask
- **Chat History** agent remembers context within a conversation
- **Multi-PDF Support** upload multiple PDFs, agent knows which files are loaded

## How It Works

1. Upload a lecture PDF, it gets split into ~500 character chunks
2. Each chunk is embedded using all-MiniLM-L6-v2 (runs on CPU)
3. Vectors stored in ChromaDB
4. When you ask something, your question becomes a vector
5. ChromaDB finds the most similar chunks (semantic search)
6. An **agentic layer** decides which tool to call (ask, quiz, summarize, flashcards, stats, clear)
7. The LLM generates a response using ONLY your notes

## Architecture

```
User Message
      |
Agent (LLM with tool calling)
      | decides tool
      |
 ask | quiz | summarize | flashcards | stats | clear
      |
ChromaDB (RAG retrieval)
      |
Groq LLM (answer generation)
      |
Response to user
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend/UI** | Gradio (deployed on HF Spaces) |
| **Agentic Layer** | LLM tool calling with keyword fallback |
| **RAG Pipeline** | LangChain, ChromaDB |
| **Embeddings** | all-MiniLM-L6-v2 (ONNX, CPU) |
| **LLM** | Qwen 3.8 27B via Groq API |
| **Deployment** | Hugging Face Spaces (ZeroGPU) |

## Evaluation

Retrieval evaluation on 20 Q&A pairs from a Flutter lecture PDF:

| Metric | Score |
|--------|-------|
| **Average Recall** | 97.8% |
| **Perfect Recall (100%)** | 18/20 |
| **Partial Recall** | 2/20 |
| **Failures** | 0/20 |

## Project Structure

```
studybuddy-ai/
├── hf-space/                # Deployed on HF Spaces
│   ├── app.py               # Gradio UI
│   ├── agent.py             # Agentic layer (6 tools)
│   ├── rag_engine.py        # RAG pipeline
│   └── requirements.txt
├── backend/                 # Local development
│   ├── app.py               # Flask API server
│   ├── agent.py             # Agent (local version)
│   ├── rag_engine.py        # RAG pipeline
│   ├── mcp_tools.py         # FastMCP server
│   └── eval/
│       ├── run_eval.py      # Retrieval evaluation script
│       ├── eval_data.json   # 20 Q&A test pairs
│       └── eval_results.json
├── frontend/                # React UI (local dev)
│   └── src/
│       ├── App.jsx
│       └── App.css
└── README.md
```

## Local Development

### 1. Get a free Groq API key

Sign up at [console.groq.com](https://console.groq.com) and create an API key.

### 2. Backend setup

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

### 3. Run evaluation

```bash
cd backend/eval
python run_eval.py
```

## What I Learned

- RAG (Retrieval Augmented Generation) end to end pipeline
- Document chunking strategies and why chunk size/overlap matters
- Vector embeddings and similarity search
- Building an agentic layer with LLM tool calling
- MCP (Model Context Protocol) tool design with FastMCP
- Deploying ML apps on Hugging Face Spaces with ZeroGPU
- Retrieval evaluation methodology (recall measurement)
- Prompt engineering to ground LLM responses in source documents
