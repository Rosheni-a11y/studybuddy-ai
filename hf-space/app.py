import spaces
import gradio as gr
import os
import json

from rag_engine import upload_pdf, get_stats, clear_database
from agent import agent_respond


@spaces.GPU(duration=0)
def _dummy_gpu():
    pass


theme = gr.themes.Soft(
    primary_hue="indigo",
    secondary_hue="slate",
    neutral_hue="slate",
    radius_size="lg",
    spacing_size="md",
    font=[gr.themes.GoogleFont("Inter"), "ui-sans-serif", "sans-serif"],
).set(
    body_background_fill="#0f1117",
    body_background_fill_dark="#0f1117",
    block_background_fill="#1a1b26",
    block_background_fill_dark="#1a1b26",
    block_border_width="1px",
    block_border_color="#2a2b3d",
    block_border_color_dark="#2a2b3d",
    block_shadow="0 4px 16px rgba(0,0,0,0.3)",
    block_shadow_dark="0 4px 16px rgba(0,0,0,0.3)",
    block_title_text_weight="600",
    input_background_fill="#1e1f2e",
    input_background_fill_dark="#1e1f2e",
    input_border_color="#2a2b3d",
    input_border_color_dark="#2a2b3d",
    button_primary_background_fill="linear-gradient(135deg, #6366f1, #8b5cf6)",
    button_primary_background_fill_dark="linear-gradient(135deg, #6366f1, #8b5cf6)",
    button_primary_background_fill_hover="linear-gradient(135deg, #818cf8, #a78bfa)",
    button_primary_background_fill_hover_dark="linear-gradient(135deg, #818cf8, #a78bfa)",
    button_primary_text_color="white",
    button_primary_shadow="0 2px 8px rgba(99,102,241,0.3)",
    button_secondary_background_fill="#1e1f2e",
    button_secondary_background_fill_dark="#1e1f2e",
    button_secondary_text_color="#a5b4fc",
    button_secondary_text_color_dark="#a5b4fc",
    button_secondary_border_color="#2a2b3d",
    button_secondary_border_color_dark="#2a2b3d",
    body_text_color="#e2e8f0",
    body_text_color_dark="#e2e8f0",
    body_text_color_subdued="#94a3b8",
    body_text_color_subdued_dark="#94a3b8",
    color_accent_soft="#1e1b4b",
    color_accent_soft_dark="#1e1b4b",
)

custom_css = """
.gradio-container { max-width: 100% !important; padding: 0 24px !important; }

.header-bar {
    text-align: center;
    padding: 32px 20px 24px;
    background: linear-gradient(135deg, #312e81 0%, #4f46e5 40%, #7c3aed 70%, #a78bfa 100%);
    border-radius: 20px;
    margin-bottom: 20px;
    box-shadow: 0 8px 32px rgba(79, 70, 229, 0.3);
}
.header-bar h1 {
    font-size: 2rem;
    font-weight: 800;
    color: white;
    margin: 0 0 6px 0;
    letter-spacing: -0.5px;
}
.header-bar p {
    color: rgba(255,255,255,0.85);
    font-size: 0.92rem;
    margin: 0;
    font-weight: 400;
}

.gradio-container .row { flex-wrap: nowrap !important; gap: 20px !important; }
.gradio-container .row > .column:first-child { max-width: 340px !important; min-width: 300px !important; }

h4, .markdown h4 { color: #c7d2fe !important; font-weight: 600 !important; }

button.secondary {
    transition: all 0.2s ease !important;
}
button.secondary:hover {
    background: #252640 !important;
    border-color: #6366f1 !important;
}
button.stop {
    background: #2a1215 !important;
    border-color: #7f1d1d !important;
    color: #fca5a5 !important;
}
button.stop:hover {
    background: #3b1419 !important;
    border-color: #991b1b !important;
}

footer { display: none !important; }
"""


def chat_fn(message, history):
    result = agent_respond(message, history)
    answer = result.get("answer", "")
    tool = result.get("tool_used")
    if tool:
        answer += f"\n\n🔧 *Tool used: {tool}*"
    return answer


def ask_json(message: str, history_json: str = "[]") -> dict:
    """Used by the React website: returns the answer AND the sources as JSON."""
    try:
        history = json.loads(history_json or "[]")
    except Exception:
        history = []
    result = agent_respond(message, history)
    return {
        "answer": result.get("answer") or "",
        "sources": result.get("sources", []),
        "tool_used": result.get("tool_used"),
    }


def upload_fn(file):
    if file is None:
        return gr.update(), "No file uploaded"
    result = upload_pdf(file.name, original_filename=os.path.basename(file.name))
    msg = result.get("message", str(result))
    return gr.update(), f"✅ {msg}"


def stats_fn():
    result = get_stats()
    return result.get("message", str(result))


def clear_fn():
    result = clear_database()
    msg = result.get("message", str(result))
    return None, f"🗑️ {msg}"


with gr.Blocks(title="StudyBuddy AI") as demo:

    gr.HTML("""
        <div class="header-bar">
            <h1>📚 StudyBuddy AI</h1>
            <p>Upload your lecture PDFs, ask questions, or get quizzed. Powered by RAG + AI Agents</p>
        </div>
    """)

    with gr.Row():
        with gr.Column(scale=1):
            gr.Markdown("#### 📄 Upload Notes")
            file_input = gr.File(file_types=[".pdf"], file_count="single", height=120, show_label=False)
            upload_status = gr.Textbox(interactive=False, lines=1, show_label=False)
            file_input.change(upload_fn, inputs=file_input, outputs=[file_input, upload_status])

            gr.Markdown("#### 📊 Database")
            stats_output = gr.Textbox(interactive=False, lines=1, show_label=False, placeholder="Click Stats to check")
            with gr.Row():
                stats_btn = gr.Button("📊 Stats", variant="secondary", size="sm")
                clear_btn = gr.Button("🗑️ Clear", variant="stop", size="sm")
            stats_btn.click(stats_fn, outputs=stats_output)
            clear_btn.click(clear_fn, outputs=[file_input, stats_output])

        with gr.Column(scale=3):
            gr.Markdown("#### 💬 Chat with your Notes")
            chatbot = gr.ChatInterface(chat_fn)

    gr.api(ask_json, api_name="ask_json")

demo.launch(theme=theme, css=custom_css)
