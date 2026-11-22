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
    )

    return json.dumps({
        "topic": topic,
        "quiz": response.choices[0].message.content,
    })


def _detect_intent(message: str) -> tuple[str, dict]:
    """Keyword fallback when LLM tool calling fails."""
    lower = message.lower()
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

    try:
        response = client.chat.completions.create(
            model="qwen/qwen3.8-27b",
    if history:
              for msg in history[-6:]:
              
                messages=[
                    {
                        "role": "system",
                        "content": "You are StudyBuddy AI, a helpful study assistant. Use the available tools to help students. For factual questions, use 'ask'. When students want a quiz, use 'quiz'. For database info, use 'stats'. Only use 'clear' if explicitly requested.",
                    },
                    {"role": "user", "content": user_message},
                ],
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
