"""
model_server.py — Dedicated ML Inference Server
Runs locally on MacBook Air M1, exposing both XGBoost and FLAN-T5.
"""
from flask import Flask, request, jsonify
from flask_cors import CORS

# Import the ML functions (models are loaded globally inside these files upon import)
from question_generator import generate_questions
from evaluator import evaluate_answer

app = Flask(__name__)
CORS(app)  # Allow cross-origin requests

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "service": "MacBook ML Inference Server",
        "models_loaded": ["FLAN-T5-small", "interview_quality_classifier"]
    }), 200


@app.route("/generate", methods=["GET"])
def generate():
    """Generate interview questions using FLAN-T5-small."""
    role       = request.args.get("role", "All")
    category   = request.args.get("category", "All")
    difficulty = request.args.get("difficulty", "Medium")
    limit      = min(int(request.args.get("limit", 10)), 15)

    try:
        qs = generate_questions(role=role, category=category, difficulty=difficulty, n=limit)
        return jsonify({"questions": qs, "total": len(qs)}), 200
    except Exception as e:
        app.logger.error(f"Error generating questions: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/evaluate", methods=["POST"])
def evaluate():
    """Evaluate an answer using XGBoost."""
    data = request.get_json()
    if not data or "answer" not in data or "question" not in data:
        return jsonify({"error": "Missing 'answer' or 'question' in request body"}), 400

    answer = data["answer"]
    question = data["question"]
    category = data.get("category", "")

    try:
        result = evaluate_answer(answer, question, category)
        return jsonify(result), 200
    except Exception as e:
        app.logger.error(f"Error evaluating answer: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    print("🚀 Local MacBook ML Server starting on port 8001...")
    # Run single-threaded locally to save memory, or use debug=False
    app.run(host="0.0.0.0", port=8001, debug=True, use_reloader=False)
