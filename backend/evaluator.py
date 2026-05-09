"""
evaluator.py — Answer Evaluation using XGBoost + TF-IDF
I_Prep backend scoring engine
"""

import pickle
import re
import math
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer

# ── Load Model ────────────────────────────────────────────────────────────────
import warnings
with warnings.catch_warnings():
    warnings.simplefilter("ignore")
    with open("../model/interview_quality_classifier.pkl", "rb") as f:
        MODEL = pickle.load(f)

# ── Reference corpus to fit TF-IDF to produce 770 features ──────────────────
REFERENCE_CORPUS = [
    "binary search tree recursion algorithm complexity time space",
    "system design scalability load balancing database sharding replication",
    "javascript closures scope prototype async event loop promise",
    "react component state props hooks virtual dom reconciliation",
    "database index btree hash query optimization sql nosql",
    "rest api http methods status codes authentication jwt token",
    "docker kubernetes container orchestration deployment scaling",
    "machine learning model training validation overfitting regularization",
    "data structure array linked list stack queue heap graph",
    "network tcp ip http https ssl tls protocol handshake",
    "concurrency threading mutex lock semaphore deadlock race condition",
    "microservices architecture monolith service discovery api gateway",
    "caching redis memcached eviction policy lru ttl invalidation",
    "message queue kafka rabbitmq producer consumer publish subscribe",
    "security xss csrf injection authentication authorization oauth",
    "python java golang node express flask django spring boot",
    "dynamic programming memoization tabulation optimal substructure",
    "graph bfs dfs topological sort shortest path dijkstra bellman",
    "sorting merge quick heap insertion selection bubble time complexity",
    "operating system process thread scheduling memory management virtual",
    "css flexbox grid responsive media query animation transition",
    "html semantic accessibility aria role attribute form input",
    "testing unit integration end to end mock stub spy coverage",
    "git version control branch merge rebase conflict pull request",
    "agile scrum sprint backlog retrospective kanban velocity planning",
    "big o notation complexity analysis worst case average best case",
    "functional programming pure function immutable map filter reduce",
    "design pattern singleton factory observer strategy command decorator",
    "web performance optimization lazy loading code splitting bundle",
    "cloud aws azure gcp serverless lambda function storage compute",
    "the answer demonstrates understanding of the concept with clear explanation",
    "the solution handles edge cases and considers time space tradeoffs",
    "i would approach this problem by first analyzing requirements",
    "this is a weak answer with very little detail",
    "excellent detailed response covering all major aspects",
    "needs improvement missing key concepts and examples",
    "the implementation uses efficient data structures and algorithms",
    "considers scalability fault tolerance and high availability",
    "behavioral question situation task action result star method",
    "leadership collaboration communication conflict resolution teamwork",
]

VECTORIZER = TfidfVectorizer(max_features=770, ngram_range=(1, 2), min_df=1)
VECTORIZER.fit(REFERENCE_CORPUS)
_VOCAB_SIZE = len(VECTORIZER.vocabulary_)  # actual vocabulary size after fitting

# ── Label map ─────────────────────────────────────────────────────────────────
CLASS_LABELS = {0: "Weak", 1: "Needs Improvement", 2: "Good"}
BADGE_CONFIG = {
    "Excellent": {"color": "#00ff88", "glow": "rgba(0,255,136,0.35)", "range": "85–100", "emoji": '<i class="ph-fill ph-check-circle" style="color: #00ff88"></i>'},
    "Good":      {"color": "#00d4ff", "glow": "rgba(0,212,255,0.35)", "range": "65–84",  "emoji": '<i class="ph-fill ph-info" style="color: #00d4ff"></i>'},
    "Needs Improvement": {"color": "#ffcc00", "glow": "rgba(255,204,0,0.35)", "range": "40–64", "emoji": '<i class="ph-fill ph-warning-circle" style="color: #ffcc00"></i>'},
    "Weak":      {"color": "#ff4d6d", "glow": "rgba(255,77,109,0.35)", "range": "0–39",  "emoji": '<i class="ph-fill ph-x-circle" style="color: #ff4d6d"></i>'},
}

# ── Heuristic scorers ─────────────────────────────────────────────────────────
def compute_relevance(answer: str, question: str) -> int:
    """Keyword overlap between answer and question."""
    q_words = set(re.findall(r'\b\w{4,}\b', question.lower()))
    a_words = set(re.findall(r'\b\w{4,}\b', answer.lower()))
    if not q_words:
        return 50
    overlap = len(q_words & a_words) / len(q_words)
    # Scale: 0 overlap = 20, full = 95
    return min(95, int(20 + overlap * 75))

def compute_depth(answer: str) -> int:
    """Word count and structure-based depth score."""
    words = len(answer.split())
    sentences = max(1, len(re.split(r'[.!?]+', answer)))
    avg_sent_len = words / sentences
    # 150+ words, 3+ sentences = deep
    depth = min(1.0, words / 150) * 0.6 + min(1.0, sentences / 5) * 0.25 + min(1.0, avg_sent_len / 15) * 0.15
    return max(10, int(depth * 90))

def compute_clarity(answer: str) -> int:
    """Sentence structure and coherence proxy."""
    sentences = re.split(r'[.!?]+', answer.strip())
    sentences = [s.strip() for s in sentences if len(s.strip()) > 10]
    if not sentences:
        return 30
    # Good clarity: not too short, not run-on sentences
    good = sum(1 for s in sentences if 5 < len(s.split()) < 40)
    ratio = good / len(sentences)
    return max(20, int(ratio * 85 + 10))

def get_feedback(pred_class: int, relevance: int, depth: int, clarity: int, question: str) -> dict:
    """Generate structured feedback based on scores."""
    positives, missing, ideal = [], [], []

    if relevance >= 70:
        positives.append("Directly addresses the question's core concept")
    if depth >= 60:
        positives.append("Provides sufficient explanation and detail")
    if clarity >= 70:
        positives.append("Well-structured and easy to follow")
    if pred_class == 2:
        positives.append("Demonstrates strong technical understanding")

    if relevance < 60:
        missing.append("Answer doesn't closely address what was asked — re-read the question")
    if depth < 50:
        missing.append("Too brief — expand on concepts with examples or code snippets")
    if clarity < 50:
        missing.append("Improve sentence structure — avoid run-on sentences")
    if pred_class == 0:
        missing.append("Core technical concepts appear to be missing")

    # Generic ideal points based on question keywords
    q_lower = question.lower()
    if any(w in q_lower for w in ["design", "system", "scale"]):
        ideal.extend(["Define functional and non-functional requirements", "Estimate scale (QPS, storage)", "Discuss trade-offs and bottlenecks"])
    elif any(w in q_lower for w in ["algorithm", "complexity", "implement"]):
        ideal.extend(["State time and space complexity (Big-O)", "Handle edge cases explicitly", "Explain the approach before coding"])
    elif any(w in q_lower for w in ["difference", "compare", "vs"]):
        ideal.extend(["Use a concrete comparison table or examples", "Mention when to use each option", "Cover trade-offs and use cases"])
    else:
        ideal.extend(["Include a concrete example or analogy", "Cover edge cases or limitations", "Relate to real-world experience if possible"])

    if not positives:
        positives = ["Shows attempt to engage with the question"]
    if not missing:
        missing = ["Minor improvements could add more depth"]

    return {"positive": positives[:3], "missing": missing[:3], "ideal": ideal[:3]}

# ── Main evaluate function ────────────────────────────────────────────────────
def evaluate_answer(answer: str, question: str, category: str = "") -> dict:
    """Full evaluation pipeline → returns scoring dict."""
    if not answer or len(answer.strip()) < 5:
        return {
            "class": 0, "label": "Weak", "overall_score": 5,
            "relevance": 10, "depth": 5, "clarity": 10,
            "badge": "Weak", "badge_config": BADGE_CONFIG["Weak"],
            "feedback": {"positive": ["You started!"], "missing": ["Please write a substantive answer"], "ideal": ["Explain the concept thoroughly"]},
        }

    # TF-IDF transform + pad to 770 features
    vec = VECTORIZER.transform([answer])
    arr = vec.toarray()
    # Pad to 770 if vocabulary is smaller
    if arr.shape[1] < 770:
        arr = np.hstack([arr, np.zeros((1, 770 - arr.shape[1]))])

    # Predict
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        pred_class = int(MODEL.predict(arr)[0])
        proba = MODEL.predict_proba(arr)[0]  # [weak, needs_imp, good]

    # Heuristic sub-scores
    relevance = compute_relevance(answer, question)
    depth = compute_depth(answer)
    clarity = compute_clarity(answer)

    # Overall score blend
    model_score = (proba[2] * 70 + proba[1] * 45 + proba[0] * 15)
    overall = int(model_score * 0.55 + relevance * 0.2 + depth * 0.15 + clarity * 0.1)
    overall = max(5, min(100, overall))

    # Badge
    if overall >= 85:
        badge = "Excellent"
    elif overall >= 65:
        badge = "Good"
    elif overall >= 40:
        badge = "Needs Improvement"
    else:
        badge = "Weak"

    # Recalibrate label
    label = badge

    return {
        "class": pred_class,
        "label": label,
        "overall_score": overall,
        "relevance": relevance,
        "depth": depth,
        "clarity": clarity,
        "badge": badge,
        "badge_config": BADGE_CONFIG[badge],
        "feedback": get_feedback(pred_class, relevance, depth, clarity, question),
        "probabilities": {"weak": round(float(proba[0]), 3), "needs_improvement": round(float(proba[1]), 3), "good": round(float(proba[2]), 3)},
    }
