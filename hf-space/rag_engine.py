import os
from dotenv import load_dotenv

load_dotenv()

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from chromadb.utils.embedding_functions import DefaultEmbeddingFunction
from langchain_core.embeddings import Embeddings
from groq import Groq

CHROMA_PATH = "./chroma_db"


class ChromaDefaultEmbeddings(Embeddings):
    def __init__(self):
        self._ef = DefaultEmbeddingFunction()

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        return self._ef(texts)

    def embed_query(self, text: str) -> list[float]:
        return self._ef([text])[0]


_embeddings = None
_vectorstore = None
_client = None


def _get_embeddings():
    global _embeddings
    if _embeddings is None:
        _embeddings = ChromaDefaultEmbeddings()
    return _embeddings


def _get_vectorstore():
    global _vectorstore
    if _vectorstore is None:
        _vectorstore = Chroma(
            collection_name="study_notes",
            embedding_function=_get_embeddings(),
            persist_directory=CHROMA_PATH,
        )
    return _vectorstore


def _get_client():
    global _client
    if _client is None:
        _client = Groq(api_key=os.getenv("GROQ_API_KEY"))
    return _client


def upload_pdf(file_path: str, original_filename: str | None = None, user_id: str = "anonymous") -> dict:
    loader = PyPDFLoader(file_path)
    pages = loader.load()

    if not pages:
        return {"error": "Couldn't read any text from this PDF"}

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    chunks = splitter.split_documents(pages)

    filename = original_filename or os.path.basename(file_path)
    for chunk in chunks:
        chunk.metadata["source_file"] = filename
        chunk.metadata["user_id"] = user_id

    _get_vectorstore().add_documents(chunks)

    return {
        "filename": filename,
        "pages": len(pages),
        "chunks": len(chunks),
        "message": f"Successfully processed {filename}: {len(pages)} pages -> {len(chunks)} chunks",
    }


def ask_question(question: str, user_id: str = "anonymous") -> dict:
    search_kwargs = {"k": 4}
    if user_id != "anonymous":
        search_kwargs["filter"] = {"user_id": user_id}
    results = _get_vectorstore().similarity_search_with_score(question, **search_kwargs)

    if not results:
        return {
            "answer": "I couldn't find anything relevant in your notes. Try uploading more documents!",
            "sources": [],
        }

    context_parts = []
    sources = []

    for doc, score in results:
        context_parts.append(doc.page_content)
        sources.append({
            "text": doc.page_content[:200],
            "source_file": doc.metadata.get("source_file", "unknown"),
            "page": doc.metadata.get("page", 0),
            "relevance": round(1 / (1 + score), 2),
        })

    context = "\n\n---\n\n".join(context_parts)

    prompt = f"""You are a helpful study assistant. Match your explanation style to how the student asks — if they say 'explain simply' or 'like a kid', use very simple language; if they say 'in detail', give thorough explanations. Answer the student's question using ONLY the notes provided below.
If the answer is not in the notes, say "I don't see that in your notes."

NOTES:
{context}

QUESTION: {question}

ANSWER:"""

    response = _get_client().chat.completions.create(
        model="qwen/qwen3.8-27b",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        max_tokens=800,
    )

    answer = response.choices[0].message.content

    return {
        "answer": answer,
        "sources": sources,
    }


def get_stats(user_id: str = "anonymous") -> dict:
    if user_id != "anonymous":
        result = _get_vectorstore()._collection.get(where={"user_id": user_id})
        total_chunks = len(result["ids"])
    else:
        total_chunks = _get_vectorstore()._collection.count()

    return {
        "total_chunks": total_chunks,
        "message": f"You have {total_chunks} note chunks stored in the database.",
    }


def clear_database(user_id: str = "anonymous") -> dict:
    if user_id != "anonymous":
        result = _get_vectorstore()._collection.get(where={"user_id": user_id})
        all_ids = result["ids"]
    else:
        all_ids = _get_vectorstore()._collection.get()["ids"]

    if not all_ids:
        return {"message": "Database is already empty."}

    _get_vectorstore()._collection.delete(ids=all_ids)

    return {
        "deleted": len(all_ids),
        "message": f"Cleared {len(all_ids)} chunks from the database.",
    }
