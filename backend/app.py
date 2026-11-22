from flask import Flask, request, jsonify
from flask_cors import CORS
import tempfile
import os
from rag_engine import upload_pdf, get_stats, clear_database
from agent import agent_respond

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*", "methods": ["GET", "POST", "OPTIONS"], "allow_headers": ["Content-Type"]}})



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
        user_id = request.form.get('user_id', 'anonymous')
        result = upload_pdf(tmp_path, original_filename=file.filename, user_id=user_id)
        return jsonify(result)
    finally:
        os.unlink(tmp_path)


@app.route('/ask', methods=['POST'])
def ask():
    data = request.get_json()
    if not data or 'question' not in data:
        return jsonify({'error': 'No question provided'}), 400


    try:
        result = agent_respond(data['question'], user_id=data.get('user_id', 'anonymous'))
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)}), 500



@app.route('/stats', methods=['GET'])
def stats():
    user_id = request.args.get('user_id', 'anonymous')
    result = get_stats(user_id=user_id)
    return jsonify(result)


@app.route('/clear', methods=['POST'])
def clear():
    data = request.get_json(silent=True) or {}
    user_id = data.get('user_id', 'anonymous')
    result = clear_database(user_id=user_id)
    return jsonify(result)


if __name__ == '__main__':
    app.run(port=5000, debug=True)
