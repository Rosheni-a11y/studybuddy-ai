"""
MCP Tool Server for StudyBuddy AI.

Exposes RAG functions as MCP tools so an LLM agent can
decide which tool to call based on the user's request.
"""

import json
import random
from fastmcp import FastMCP
from rag_engine import ask_question, get_stats, clear_database, _get_vectorstore

mcp = FastMCP("StudyBuddy AI", description="Study assistant with RAG-powered Q&A and quiz generation")


@mcp.tool()
def ask(question: str) -> str:
    """Answer a question using the uploaded lecture notes.
    Use this when the student asks a factual question about their study material."""
    result = ask_question(question)
    return json.dumps(result)


@mcp.tool()
def quiz(topic: str, num_questions: int = 3) -> str:
    """Generate a multiple-choice quiz from the uploaded notes on a given topic.
    Use this when the student wants to test themselves or says 'quiz me'."""
    docs = _get_vectorstore().similarity_search(topic, k=6)

    if not docs:
        return json.dumps({"error": "No notes found on this topic. Upload a PDF first."})

    context = "\n\n".join(doc.page_content for doc in docs)

    from rag_engine import _get_client
    response = _get_client().chat.completions.create(
        model="qwen/qwen3.8-27b",
        messages=[{"role": "user", "content": f"""Create {num_questions} multiple-choice questions based on these notes.

NOTES:
{context}

Format each question as:
Q1: [question]
A) [option]
B) [option]
C) [option]
D) [option]
Answer: [letter]

Make questions test understanding, not just memorization."""}],
        temperature=0.7,
    )

    return json.dumps({
        "topic": topic,
        "quiz": response.choices[0].message.content,
        "sources": [{"page": doc.metadata.get("page", 0)} for doc in docs[:3]],
    })


@mcp.tool()
def stats() -> str:
    """Get statistics about the uploaded notes (how many chunks are stored).
    Use this when the student asks how much content is in their database."""
    return json.dumps(get_stats())


@mcp.tool()
def clear() -> str:
    """Clear all uploaded notes from the database.
    Use this only when the student explicitly asks to delete their notes."""
    return json.dumps(clear_database())


if __name__ == "__main__":
    mcp.run()
