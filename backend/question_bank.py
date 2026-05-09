"""
question_bank.py — Question retrieval from questions.json
"""
import json, random, os

_DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "questions.json")
with open(_DATA_PATH, "r") as f:
    _DB = json.load(f)

ALL_QUESTIONS = _DB["questions"]

def get_questions(role=None, category=None, difficulty=None, limit=10):
    filtered = ALL_QUESTIONS
    if role and role != "All":
        filtered = [q for q in filtered if q["role"].lower() == role.lower()]
    if category and category != "All":
        filtered = [q for q in filtered if q["category"].lower() == category.lower()]
    if difficulty and difficulty != "All":
        filtered = [q for q in filtered if q["difficulty"].lower() == difficulty.lower()]
    if not filtered:
        filtered = ALL_QUESTIONS[:limit]
    random.shuffle(filtered)
    return filtered[:limit]

def get_metadata():
    return {
        "roles": _DB["roles"],
        "categories": _DB["categories"],
        "difficulties": _DB["difficulties"],
        "total": len(ALL_QUESTIONS),
    }
