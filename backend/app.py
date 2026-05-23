from flask import Flask, request, jsonify
from flask_cors import CORS
import tempfile
import os
from rag_engine import upload_pdf, ask_question, get_stats, clear_database

app = Flask(__name__)
CORS(app)


@app.route('/upload', methods=['POST'])
def upload():
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp:
        file.save(tmp.name)
        tmp_path = tmp.name

    try:
        result = upload_pdf(tmp_path, original_filename=file.filename)
        return jsonify(result)
    finally:
        os.unlink(tmp_path)


@app.route('/ask', methods=['POST'])
def ask():
    data = request.get_json()
    if not data or 'question' not in data:
        return jsonify({'error': 'No question provided'}), 400

    result = ask_question(data['question'])
    return jsonify(result)


@app.route('/stats', methods=['GET'])
def stats():
    result = get_stats()
    return jsonify(result)


@app.route('/clear', methods=['POST'])
def clear():
    result = clear_database()
    return jsonify(result)


if __name__ == '__main__':
    app.run(port=5000, debug=True)
