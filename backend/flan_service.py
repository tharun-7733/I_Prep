"""
flan_service.py — Dedicated microservice for FLAN-T5 Question Generation
"""
from flask import Flask, request, jsonify
from question_generator import generate_questions

app = Flask(__name__)

@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "service": "FLAN-T5-small"})

@app.route("/api/generate", methods=["GET"])
def generate():
    """
    Generate interview questions using FLAN-T5-small.
    Query params: role, category, difficulty, limit
    """
    role       = request.args.get("role", "All")
    category   = request.args.get("category", "All")
    difficulty = request.args.get("difficulty", "Medium")
    limit      = min(int(request.args.get("limit", 10)), 15)

    try:
        qs = generate_questions(role=role, category=category, difficulty=difficulty, n=limit)
        return jsonify({"questions": qs, "total": len(qs)}), 200
    except Exception as e:
        print(f"Error generating questions: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    print("🚀 FLAN-T5 Microservice running at http://0.0.0.0:8001")
    app.run(host="0.0.0.0", port=8001, debug=False)
