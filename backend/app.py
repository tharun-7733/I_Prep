"""
app.py — Flask API server for I_Prep
Run: python3 app.py
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import json, random, datetime

app = Flask(__name__)
CORS(app)

from evaluator import evaluate_answer
from question_bank import get_questions, get_metadata

# ── Mock session store (localStorage-based frontend; server just provides data) ──
MOCK_SESSIONS = [
    {"date": "2026-05-09", "role": "Backend Engineer", "category": "System Design", "questions": 10, "avg_score": 82, "badge": "Good"},
    {"date": "2026-05-08", "role": "Backend Engineer", "category": "DSA", "questions": 8,  "avg_score": 74, "badge": "Good"},
    {"date": "2026-05-07", "role": "Full Stack Developer", "category": "Technical Concepts", "questions": 10, "avg_score": 91, "badge": "Excellent"},
    {"date": "2026-05-06", "role": "Backend Engineer", "category": "Behavioral", "questions": 5, "avg_score": 65, "badge": "Good"},
    {"date": "2026-05-04", "role": "System Designer", "category": "System Design", "questions": 10, "avg_score": 56, "badge": "Needs Improvement"},
    {"date": "2026-05-02", "role": "Frontend Developer", "category": "DSA", "questions": 8, "avg_score": 88, "badge": "Excellent"},
    {"date": "2026-04-30", "role": "Backend Engineer", "category": "Technical Concepts", "questions": 10, "avg_score": 70, "badge": "Good"},
]

MOCK_LEADERBOARD = [
    {"rank":1,"username":"aditya_sys","role":"System Designer","sessions":42,"avg_score":94,"badge":"Excellent","streak":14},
    {"rank":2,"username":"priya_backend","role":"Backend Engineer","sessions":38,"avg_score":91,"badge":"Excellent","streak":10},
    {"rank":3,"username":"karan_fs","role":"Full Stack Developer","sessions":35,"avg_score":89,"badge":"Excellent","streak":7},
    {"rank":4,"username":"neha_ml","role":"Backend Engineer","sessions":29,"avg_score":85,"badge":"Excellent","streak":5},
    {"rank":5,"username":"rahul_dsa","role":"DSA / Competitive Programming","sessions":27,"avg_score":83,"badge":"Good","streak":12},
    {"rank":6,"username":"you","role":"Backend Engineer","sessions":7,"avg_score":75,"badge":"Good","streak":3,"isCurrentUser":True},
    {"rank":7,"username":"divya_front","role":"Frontend Developer","sessions":22,"avg_score":78,"badge":"Good","streak":4},
    {"rank":8,"username":"arjun_devops","role":"DevOps Engineer","sessions":19,"avg_score":76,"badge":"Good","streak":2},
    {"rank":9,"username":"sneha_full","role":"Full Stack Developer","sessions":17,"avg_score":71,"badge":"Good","streak":0},
    {"rank":10,"username":"vikram_sys","role":"System Designer","sessions":15,"avg_score":69,"badge":"Good","streak":1},
]

# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/api/health")
def health():
    return jsonify({"status": "ok", "model": "XGBoost Interview Quality Classifier"})

@app.route("/api/metadata")
def metadata():
    return jsonify(get_metadata())

@app.route("/api/questions")
def questions():
    role       = request.args.get("role", "All")
    category   = request.args.get("category", "All")
    difficulty = request.args.get("difficulty", "All")
    limit      = min(int(request.args.get("limit", 10)), 20)
    qs = get_questions(role=role, category=category, difficulty=difficulty, limit=limit)
    return jsonify({"questions": qs, "total": len(qs)})

@app.route("/api/evaluate", methods=["POST"])
def evaluate():
    data = request.get_json(force=True)
    answer   = data.get("answer", "").strip()
    question = data.get("question", "").strip()
    category = data.get("category", "")
    if not question:
        return jsonify({"error": "Question is required"}), 400
    result = evaluate_answer(answer, question, category)
    return jsonify(result)

@app.route("/api/sessions")
def sessions():
    return jsonify({"sessions": MOCK_SESSIONS, "total": len(MOCK_SESSIONS)})

@app.route("/api/leaderboard")
def leaderboard():
    period = request.args.get("period", "weekly")
    role_filter = request.args.get("role", "All")
    data = MOCK_LEADERBOARD.copy()
    if role_filter and role_filter != "All":
        data = [r for r in data if r["role"].lower() == role_filter.lower() or r.get("isCurrentUser")]
    return jsonify({"leaderboard": data, "period": period, "total": len(data)})

@app.route("/api/progress")
def progress():
    scores = [s["avg_score"] for s in MOCK_SESSIONS]
    radar = {"DSA": 78, "System Design": 65, "Behavioral": 72, "Technical Concepts": 88, "Communication": 70}
    summary = {
        "total_questions": sum(s["questions"] for s in MOCK_SESSIONS),
        "avg_score": int(sum(scores) / len(scores)) if scores else 0,
        "best_category": "Technical Concepts",
        "sessions_completed": len(MOCK_SESSIONS),
        "session_scores": [{"label": f"S{i+1}", "score": s["avg_score"], "date": s["date"]} for i, s in enumerate(reversed(MOCK_SESSIONS))],
        "radar": radar,
    }
    return jsonify(summary)

if __name__ == "__main__":
    print("🚀 I_Prep API running at http://localhost:8000")
    app.run(port=8000, debug=True)
