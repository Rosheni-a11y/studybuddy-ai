import spaces
import gradio as gr
import os

from rag_engine import upload_pdf, get_stats, clear_database
from agent import agent_respond


@spaces.GPU(duration=0)
def _dummy_gpu():
    pass


theme = gr.themes.Soft(
    primary_hue="violet",
    secondary_hue="gray",
    neutral_hue="gray",
    font=gr.themes.GoogleFont("Inter"),
).set(
    body_background_fill="*neutral_50",
    block_background_fill="white",
    block_border_width="1px",
    block_border_color="*neutral_200",
    block_shadow="0 1px 3px rgba(0,0,0,0.08)",
    block_title_text_weight="600",
    input_background_fill="white",
    button_primary_background_fill="*primary_500",
    button_primary_text_color="white",
)

custom_css = """
.gradio-container { max-width: 1400px !important; margin: 0 auto !important; padding: 0 20px !important; }

.header-bar {
    text-align: center;
    padding: 24px 16px 16px;
    background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 60%, #c4b5fd 100%);
    border-radius: 16px;
    margin-bottom: 16px;
}
.header-bar h1 { font-size: 1.7rem; font-weight: 700; color: white; margin: 0 0 4px 0; }
.header-bar p { color: rgba(255,255,255,0.9); font-size: 0.88rem; margin: 0; }

.gradio-container .row { flex-wrap: nowrap !important; }
.gradio-container .row > .column:first-child { max-width: 350px !important; min-width: 300px !important; }
.gradio-container .row { gap: 24px !important; }
footer { display: none !important; }
"""


def chat_fn(message, history):
    result = agent_respond(message, history)
    answer = result.get("answer", "")
    tool = result.get("tool_used")
    if tool:
        answer += f"\n\n🔧 *Tool used: {tool}*"
    return answer


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
            file_input = gr.File(label="Drop your PDF here", file_types=[".pdf"], file_count="single", height=120)
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

demo.launch(theme=theme, css=custom_css)
