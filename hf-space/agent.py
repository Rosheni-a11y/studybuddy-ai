"""
Agentic layer for StudyBuddy AI.

The LLM decides which tool to call based on the user's message.
Tools: ask (Q&A), quiz (generate MCQ), stats (database info), clear (delete notes).
"""

import json
import os
from rag_engine import ask_question, get_stats, clear_database, _get_vectorstore, _get_client

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "ask",
            "description": "Answer a question using the uploaded lecture notes. Use when the student asks a factual question.",
            "parameters": {
                "type": "object",
                "properties": {
                    "question": {"type": "string", "description": "The student's question"}
                },
                "required": ["question"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "quiz",
            "description": "Generate a multiple-choice quiz from uploaded notes. Use whenever the student says 'quiz me', 'test me', 'MCQ', or wants practice questions. If no specific topic is given, use 'general'. NEVER ask the student to clarify the topic.",
            "parameters": {
                "type": "object",
                "properties": {
                    "topic": {"type": "string", "description": "The topic to quiz on"},
                    "num_questions": {"type": "integer", "description": "Number of questions (default 3)", "default": 3},
                },
                "required": ["topic"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "summarize",
            "description": "Summarize the uploaded notes. Use when the student asks for a summary, overview, revision notes, or 'what is this chapter about'.",
            "parameters": {
                "type": "object",
                "properties": {
                    "topic": {"type": "string", "description": "Topic to summarize, or 'general' for whole chapter"}
                },
                "required": ["topic"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "flashcards",
            "description": "Generate flashcards (term and definition pairs) from uploaded notes for revision. Use when the student asks for flashcards, key terms, or revision cards.",
            "parameters": {
                "type": "object",
                "properties": {
                    "topic": {"type": "string", "description": "Topic for flashcards, or 'general'"},
                    "num_cards": {"type": "integer", "description": "Number of flashcards (default 5)", "default": 5},
                },
                "required": ["topic"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "stats",
            "description": "Get statistics about uploaded notes. Use when the student asks how much content is stored.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
    {
        "type": "function",
        "function": {
            "name": "clear",
            "description": "Delete all uploaded notes. Use ONLY when the student explicitly asks to clear or delete their notes.",
            "parameters": {"type": "object", "properties": {}},
        },
    },
]


def _run_tool(name: str, args: dict, user_id: str = "anonymous") -> str:
    if name == "ask":
        return json.dumps(ask_question(args["question"], user_id=user_id))
    elif name == "quiz":
        return _run_quiz(args.get("topic", "general"), args.get("num_questions", 5), user_id=user_id)
    elif name == "summarize":
        return _run_summarize(args.get("topic", "general"), user_id=user_id)
    elif name == "flashcards":
        return _run_flashcards(args.get("topic", "general"), args.get("num_cards", 5), user_id=user_id)
    elif name == "stats":
        return json.dumps(get_stats(user_id=user_id))
    elif name == "clear":
        return json.dumps(clear_database(user_id=user_id))
    else:
        return json.dumps({"error": f"Unknown tool: {name}"})


def _run_quiz(topic: str, num_questions: int = 3, user_id: str = "anonymous") -> str:
    search_kwargs = {"k": 6}
    if user_id != "anonymous":
        search_kwargs["filter"] = {"user_id": user_id}
    docs = _get_vectorstore().similarity_search(topic, **search_kwargs)
    if not docs:
        return json.dumps({"error": "No notes found on this topic."})

    context = "\n\n".join(doc.page_content for doc in docs)

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
        max_tokens=800,
    )

    return json.dumps({
        "topic": topic,
        "quiz": response.choices[0].message.content,
    })


def _run_summarize(topic: str, user_id: str = "anonymous") -> str:
    search_kwargs = {"k": 8}
    if user_id != "anonymous":
        search_kwargs["filter"] = {"user_id": user_id}
    docs = _get_vectorstore().similarity_search(topic, **search_kwargs)
    if not docs:
        return json.dumps({"error": "No notes found to summarize."})

    context = "\n\n".join(doc.page_content for doc in docs)

    response = _get_client().chat.completions.create(
        model="qwen/qwen3.8-27b",
        messages=[{"role": "user", "content": f"""Summarize the following lecture notes into clear, organized revision notes.
Use headings, bullet points, and highlight key concepts.

NOTES:
{context}

SUMMARY:"""}],
        temperature=0.3,
        max_tokens=800,
    )

    return json.dumps({
        "answer": response.choices[0].message.content,
        "topic": topic,
    })


def _run_flashcards(topic: str, num_cards: int = 5, user_id: str = "anonymous") -> str:
    search_kwargs = {"k": 6}
    if user_id != "anonymous":
        search_kwargs["filter"] = {"user_id": user_id}
    docs = _get_vectorstore().similarity_search(topic, **search_kwargs)
    if not docs:
        return json.dumps({"error": "No notes found for flashcards."})

    context = "\n\n".join(doc.page_content for doc in docs)

    response = _get_client().chat.completions.create(
        model="qwen/qwen3.8-27b",
        messages=[{"role": "user", "content": f"""Create {num_cards} flashcards from these lecture notes.

NOTES:
{context}

Format each flashcard as:
📌 Term: [term or concept]
💡 Definition: [clear, concise definition]

Make them useful for quick revision."""}],
        temperature=0.4,
        max_tokens=800,
    )

    return json.dumps({
        "answer": response.choices[0].message.content,
        "topic": topic,
    })


def _detect_intent(message: str) -> tuple[str, dict]:
    """Keyword fallback when LLM tool calling fails."""
    lower = message.lower()
    if any(w in lower for w in ["summarize", "summary", "overview", "revision notes", "revise"]):
        return "summarize", {"topic": "general"}
    if any(w in lower for w in ["flashcard", "flash card", "key terms", "definitions"]):
        return "flashcards", {"topic": "general", "num_cards": 5}
    if any(w in lower for w in ["quiz", "test me", "practice"]):
        topic = message.replace("quiz me on", "").replace("quiz me", "").strip() or "general"
        return "quiz", {"topic": topic, "num_questions": 3}
    if any(w in lower for w in ["how many", "stats", "count", "database"]):
        return "stats", {}
    if any(w in lower for w in ["clear", "delete", "remove all"]):
        return "clear", {}
    return "ask", {"question": message}


def agent_respond(user_message: str, history: list = None, user_id: str = "anonymous") -> dict:
    client = _get_client()

    uploaded_files = _get_uploaded_sources(user_id=user_id)
    files_info = f"Uploaded notes: {', '.join(uploaded_files)}" if uploaded_files else "No notes uploaded yet."

    messages = [
        {
            "role": "system",
            "content": f"You are StudyBuddy AI, a helpful study assistant. {files_info}. Use the available tools to help students. For factual questions, use 'ask'. When students want a quiz, use 'quiz'. For database info, use 'stats'. Only use 'clear' if explicitly requested. If the student asks for a quiz without specifying a topic, you may ask which topic. But if they reply with 'whole chapter', 'full', 'all', 'everything', or similar — use 'general' as the topic and generate the quiz immediately. Short replies like '1', 'yes', 'first one' after you offered options should be interpreted based on what you offered. When generating quizzes, match the style the student asked for: if they say 'theory' give definition/concept questions from the notes, if they say 'practical' or 'scenarios' give applied/real-world scenario questions, if they say 'both' or don't specify give a mix.",
        },
    ]

    if history:
        for h in history[-6:]:
            if isinstance(h, (list, tuple)) and len(h) == 2:
                messages.append({"role": "user", "content": str(h[0])})
                messages.append({"role": "assistant", "content": str(h[1])})

    messages.append({"role": "user", "content": user_message})

    try:
        response = client.chat.completions.create(
            model="qwen/qwen3.8-27b",
            messages=messages,
            tools=TOOLS,
            tool_choice="auto",
            temperature=0.3,
        )

        msg = response.choices[0].message

        if msg.tool_calls:
            tool_call = msg.tool_calls[0]
            tool_name = tool_call.function.name
            tool_args = json.loads(tool_call.function.arguments)

            tool_result = _run_tool(tool_name, tool_args, user_id=user_id)
            tool_data = json.loads(tool_result)

            return {
                "answer": tool_data.get("answer") or tool_data.get("quiz") or tool_data.get("message") or str(tool_data),
                "sources": tool_data.get("sources", []),
                "tool_used": tool_name,
            }

        return {
            "answer": msg.content,
            "sources": [],
            "tool_used": None,
        }

    except Exception:
        tool_name, tool_args = _detect_intent(user_message)
        tool_result = _run_tool(tool_name, tool_args, user_id=user_id)
        tool_data = json.loads(tool_result)

        return {
            "answer": tool_data.get("answer") or tool_data.get("quiz") or tool_data.get("message") or str(tool_data),
            "sources": tool_data.get("sources", []),
            "tool_used": tool_name,
        }

def _get_uploaded_sources(user_id: str = "anonymous"):
    collection = _get_vectorstore()._collection
    if user_id != "anonymous":
        result = collection.get(where={"user_id": user_id}, include=["metadatas"])
    else:
        result = collection.get(include=["metadatas"])
    sources = set()
    for meta in result.get("metadatas", []):
        if meta and "source_file" in meta:
            sources.add(meta["source_file"])
    return list(sources)

