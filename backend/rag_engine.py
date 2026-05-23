import os
from dotenv import load_dotenv

load_dotenv()

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from groq import Groq

# Embedding Model
# Locally runs on the computer, converts text into vectors (list of 384 numbers)
embeddings = HuggingFaceEmbeddings(
    model_name="all-MiniLM-L6-v2",
    model_kwargs={"device": "cpu"},
)

# Vector Database
# ChromaDB stores all the note chunks as vectors locally
CHROMA_PATH = "./chroma_db"
vectorstore = Chroma(
    collection_name="study_notes",
    embedding_function=embeddings,
    persist_directory=CHROMA_PATH,
)

# The Groq LLM Client
# Sends questions to Groq's free API
client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def upload_pdf(file_path: str, original_filename: str | None = None) -> dict:
    # Step 1: Read the PDF
    loader = PyPDFLoader(file_path)
    pages = loader.load()

    if not pages:
        return {"error": "Couldn't read any text from this PDF"}

    # Step 2: Split into chunks
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=500,
        chunk_overlap=50,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    chunks = splitter.split_documents(pages)

    # Step 3: Add metadata so we know which file each chunk came from
    filename = original_filename or os.path.basename(file_path)
    for chunk in chunks:
        chunk.metadata["source_file"] = filename

    # Step 4: Embed and store in ChromaDB
    vectorstore.add_documents(chunks)

    return {
        "filename": filename,
        "pages": len(pages),
        "chunks": len(chunks),
        "message": f"Successfully processed {filename}: {len(pages)} pages -> {len(chunks)} chunks",
    }


def ask_question(question: str) -> dict:
    # Step 1: Search ChromaDB for the 4 chunks most similar to the question
    results = vectorstore.similarity_search_with_score(question, k=4)

    # Step 2: Handle case where nothing relevant is found
    if not results:
        return {
            "answer": "I couldn't find anything relevant in your notes. Try uploading more documents!",
            "sources": [],
        }

    # Step 3: Pull the text out of each result and build a sources list
    context_parts = []
    sources = []

    for doc, score in results:
        context_parts.append(doc.page_content)
        sources.append({
            "text": doc.page_content[:200],  # short preview of the chunk
            "source_file": doc.metadata.get("source_file", "unknown"),
            "page": doc.metadata.get("page", 0),
            "relevance": round(1 / (1 + score), 2),
           
        })

    # Join all chunks into one big context block
    context = "\n\n---\n\n".join(context_parts)

    # Step 4: Build the prompt — tell the LLM to only use the notes, not general knowledge
    prompt = f"""You are a helpful study assistant. Answer the student's question using ONLY the notes provided below.
If the answer is not in the notes, say "I don't see that in your notes."

NOTES:
{context}
 
QUESTION: {question}

ANSWER:"""

    # Step 5: Send the prompt to Groq and get the answer back
    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,  # lower temperature = more factual, less creative
    )

    answer = response.choices[0].message.content

    return {
        "answer": answer,
        "sources": sources,
    }


def get_stats() -> dict:
    # Ask ChromaDB how many chunks are currently stored
    total_chunks = vectorstore._collection.count()

    return {
        "total_chunks": total_chunks,
        "message": f"You have {total_chunks} note chunks stored in the database.",
    }


def clear_database() -> dict:
    # Get the IDs of every stored chunk
    all_ids = vectorstore._collection.get()["ids"]

    if not all_ids:
        return {"message": "Database is already empty."}

    # Delete all chunks by their IDs
    vectorstore._collection.delete(ids=all_ids)

    return {
        "deleted": len(all_ids),
        "message": f"Cleared {len(all_ids)} chunks from the database.",
    }
