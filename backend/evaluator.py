"""
evaluator.py — Answer Evaluation using the interview_quality_classifier.pkl model
iPrep backend scoring engine

Feature Engineering (770 features total):
  f0–f767 : TF-IDF features (768 features, ngram_range=(1,2), max_features=768)
  f768    : Type-Token Ratio (vocabulary diversity: unique_words / total_words)
  f769    : Sentence count (number of complete sentences in the answer)

Model classification:
  0 = Weak           (sentence count ≤4 or ≥12, or very low quality)
  1 = Needs Improvement (sentence count 9-11, moderate quality)
  2 = Good           (sentence count 5-8 with decent vocabulary diversity)
"""

import os
import re
import pickle
import warnings
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer

# ── Load the trained XGBoost model ────────────────────────────────────────────
_MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "model", "interview_quality_classifier.pkl")

with warnings.catch_warnings():
    warnings.simplefilter("ignore")
    with open(_MODEL_PATH, "rb") as f:
        MODEL = pickle.load(f)

# ── Build a rich TF-IDF vectorizer for the first 768 features ─────────────────
# This corpus covers interview topics across all roles and categories.
# The vectorizer is fit on this corpus to produce a stable 768-feature vocabulary.
INTERVIEW_CORPUS = [
    # DSA
    "binary search tree recursion algorithm complexity time space O(log n) O(n)",
    "dynamic programming memoization tabulation optimal substructure overlapping subproblems",
    "graph bfs dfs topological sort shortest path dijkstra bellman ford floyd warshall",
    "sorting merge sort quick sort heap sort insertion bubble selection time complexity",
    "data structure array linked list stack queue heap priority queue deque",
    "hash map hash table collision chaining open addressing load factor rehashing",
    "sliding window two pointer prefix sum binary search divide conquer",
    "tree traversal inorder preorder postorder level order bfs dfs",
    "greedy algorithm interval scheduling knapsack huffman activity selection",
    "backtracking permutation combination subset n-queens sudoku recursion",
    "segment tree fenwick tree range query update lazy propagation",
    "trie prefix tree autocomplete word search string pattern matching",
    "union find disjoint set path compression union by rank kruskal minimum spanning tree",
    "bit manipulation xor and or shift mask power of two",
    "amortized analysis dynamic array append O(1) amortized aggregate accounting",
    "palindrome string reverse two pointer substring longest",
    "LRU cache doubly linked list hashmap O(1) get put eviction",
    "matrix rotation transpose spiral traversal boundary",
    "word break dynamic programming dictionary string partition",
    "lowest common ancestor binary tree recursion parent pointer",
    # System Design
    "system design scalability load balancing database sharding replication partitioning",
    "microservices architecture monolith service discovery api gateway circuit breaker",
    "caching redis memcached eviction policy LRU LFU TTL cache invalidation CDN",
    "message queue kafka rabbitmq producer consumer publish subscribe event driven",
    "distributed system cap theorem consistency availability partition tolerance",
    "url shortener hashing storage base62 encoding redirect analytics",
    "notification system push email SMS fanout write read queue",
    "rate limiting sliding window token bucket leaky bucket distributed",
    "consistent hashing virtual nodes ring partitioning load distribution",
    "database index btree hash query optimization SQL NoSQL cassandra",
    "twitter timeline fanout write fanout read social graph news feed",
    "youtube video upload streaming CDN encoding transcoding storage",
    "uber geospatial matching surge pricing real-time location tracking",
    "google search crawling indexing ranking PageRank inverted index",
    "chat application websocket 1M concurrent users message storage delivery",
    "distributed key value store dynamo replication quorum conflict resolution",
    "e-commerce checkout inventory reservation payment transaction atomic",
    "high availability fault tolerance disaster recovery replication failover",
    "API design REST GraphQL versioning pagination rate limiting authentication",
    "zero downtime deployment blue green canary rolling update kubernetes",
    # Technical Concepts
    "javascript closures scope prototype chain async await promise event loop",
    "react component state props hooks virtual dom reconciliation fiber",
    "css flexbox grid responsive design media query animation transition",
    "html semantic accessibility aria landmark role form input",
    "REST API HTTP methods GET POST PUT DELETE PATCH status codes 200 404 500",
    "authentication JWT token OAuth session cookie HTTPS SSL TLS",
    "SQL NoSQL database transaction ACID BASE normalization denormalization",
    "concurrency threading mutex lock semaphore deadlock race condition atomic",
    "docker kubernetes container pod service deployment namespace ingress",
    "CI/CD pipeline continuous integration delivery jenkins github actions",
    "testing unit integration end-to-end mock stub spy coverage TDD BDD",
    "git version control branch merge rebase conflict pull request review",
    "security XSS CSRF SQL injection authentication authorization OWASP",
    "CAP theorem consistency partition tolerance availability eventual consistency",
    "N+1 query problem ORM eager loading join database performance",
    "connection pooling database driver threads PgBouncer idle connections",
    "2PC two-phase commit saga pattern distributed transaction eventual consistency",
    "goroutine channel select go concurrency lightweight thread OS thread",
    "web worker service worker PWA offline background sync push notification",
    "code splitting lazy loading webpack bundle optimization performance",
    "CORS cross-origin request header preflight OPTIONS whitelist",
    "JWT authentication signature header payload claims expiry refresh token",
    "SOAP REST GraphQL API protocol format XML JSON schema",
    "B-tree B+ tree index clustered non-clustered database query performance",
    # Behavioral
    "situation task action result STAR method behavioral interview leadership",
    "teamwork collaboration communication conflict resolution stakeholder management",
    "technical decision trade-off architecture refactoring legacy code debt",
    "production outage incident debugging root cause analysis postmortem",
    "performance bottleneck optimization profiling memory CPU latency throughput",
    "agile scrum sprint retrospective backlog estimation velocity kanban",
    "code review feedback constructive pair programming mentorship",
    "deadline pressure prioritization time management delivery quality",
    "cross-functional team frontend backend devops product design",
    "failure learning growth mistake ownership accountability",
    # Quality signals
    "the answer clearly explains the core concept with concrete examples",
    "demonstrates deep understanding through systematic step-by-step analysis",
    "considers edge cases time complexity space complexity trade-offs",
    "provides real-world context and practical application of the concept",
    "structured approach first define requirements then design solution",
    "compares multiple approaches and justifies the chosen solution",
    "mentions limitations drawbacks and when not to use the approach",
    "uses precise technical terminology correctly and consistently",
    "covers both theory and practical implementation details",
    "addresses scalability fault tolerance and operational concerns",
    "vague answer lacks specific technical details or examples",
    "incomplete response missing key aspects of the question",
    "correct high level but lacks depth in implementation details",
    "shows awareness of the problem but struggles with specifics",
]

VECTORIZER = TfidfVectorizer(max_features=768, ngram_range=(1, 2), min_df=1, sublinear_tf=True)
VECTORIZER.fit(INTERVIEW_CORPUS)

# ── Badge / label configuration ───────────────────────────────────────────────
CLASS_LABELS = {0: "Weak", 1: "Needs Improvement", 2: "Good"}

BADGE_CONFIG = {
    "Excellent":          {"color": "#00ff88", "glow": "rgba(0,255,136,0.35)", "range": "85–100", "emoji": '<i class="ph-fill ph-check-circle" style="color: #00ff88"></i>'},
    "Good":               {"color": "#00d4ff", "glow": "rgba(0,212,255,0.35)", "range": "65–84",  "emoji": '<i class="ph-fill ph-info"         style="color: #00d4ff"></i>'},
    "Needs Improvement":  {"color": "#ffcc00", "glow": "rgba(255,204,0,0.35)", "range": "40–64",  "emoji": '<i class="ph-fill ph-warning-circle" style="color: #ffcc00"></i>'},
    "Weak":               {"color": "#ff4d6d", "glow": "rgba(255,77,109,0.35)","range": "0–39",   "emoji": '<i class="ph-fill ph-x-circle"      style="color: #ff4d6d"></i>'},
}

# ── Feature extraction ────────────────────────────────────────────────────────

def _tokenize(text: str) -> list[str]:
    """Return cleaned tokens from text."""
    return [w.lower().strip('.,!?;:()"\'-') for w in text.split()
            if w.strip('.,!?;:()"\'-')]


def _sentence_count(text: str) -> int:
    """Count meaningful sentences (>3 chars) in the text."""
    sents = [s.strip() for s in re.split(r'[.!?]+', text) if len(s.strip()) > 3]
    return max(0, len(sents))


def _type_token_ratio(tokens: list[str]) -> float:
    """Vocabulary diversity: unique_words / total_words. Range: 0.0–1.0."""
    if not tokens:
        return 0.0
    return len(set(tokens)) / len(tokens)


def _build_feature_vector(answer: str) -> np.ndarray:
    """
    Build the 770-dimensional feature vector that matches the model's training format:
      [0:768]  TF-IDF bigram features
      [768]    Type-token ratio  (vocabulary diversity)
      [769]    Sentence count
    """
    tokens = _tokenize(answer)
    sent_count = _sentence_count(answer)
    ttr = _type_token_ratio(tokens)

    # TF-IDF features (f0–f767)
    tfidf_vec = VECTORIZER.transform([answer]).toarray()  # shape (1, ≤768)
    if tfidf_vec.shape[1] < 768:
        tfidf_vec = np.hstack([tfidf_vec, np.zeros((1, 768 - tfidf_vec.shape[1]))])

    # Engineered features (f768, f769)
    engineered = np.array([[ttr, float(sent_count)]])

    return np.hstack([tfidf_vec, engineered])  # shape (1, 770)


# ── Heuristic sub-scores ──────────────────────────────────────────────────────

def _relevance_score(answer: str, question: str) -> int:
    """Keyword overlap between answer tokens and question tokens (≥4 chars)."""
    q_words = set(re.findall(r'\b\w{4,}\b', question.lower()))
    a_words = set(re.findall(r'\b\w{4,}\b', answer.lower()))
    if not q_words:
        return 50
    overlap = len(q_words & a_words) / len(q_words)
    return min(95, int(20 + overlap * 75))


def _depth_score(answer: str) -> int:
    """Measures answer depth via word count, sentence count, and average sentence length."""
    words = answer.split()
    sentences = max(1, len(re.split(r'[.!?]+', answer)))
    avg_sent_len = len(words) / sentences
    depth = (
        min(1.0, len(words) / 150) * 0.60
        + min(1.0, sentences / 7)   * 0.25
        + min(1.0, avg_sent_len / 15) * 0.15
    )
    return max(10, int(depth * 90))


def _clarity_score(answer: str) -> int:
    """Sentence structure and coherence proxy."""
    sentences = re.split(r'[.!?]+', answer.strip())
    sentences = [s.strip() for s in sentences if len(s.strip()) > 10]
    if not sentences:
        return 30
    good = sum(1 for s in sentences if 5 < len(s.split()) < 40)
    ratio = good / len(sentences)
    return max(20, int(ratio * 85 + 10))


# ── Feedback generator ───────────────────────────────────────────────────────

def _build_feedback(pred_class: int, relevance: int, depth: int, clarity: int, question: str, sent_count: int) -> dict:
    """Generate structured feedback based on model prediction and heuristic scores."""
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
        if sent_count < 5:
            missing.append("Too brief — expand on concepts with examples or step-by-step explanations")
        else:
            missing.append("Add more technical details or specific examples to support your points")
    if clarity < 50:
        missing.append("Improve sentence structure — use shorter, clearer sentences")
    if pred_class == 0:
        missing.append("Core technical concepts appear to be missing or underdeveloped")
    elif pred_class == 1:
        if sent_count < 5:
            missing.append("Add more depth: aim for 5–8 well-developed sentences covering key aspects")
        else:
            missing.append("Refine your explanation: ensure you define key terms and concepts clearly")

    # Question-specific ideal points
    q_lower = question.lower()
    if any(w in q_lower for w in ["design", "system", "scale", "architect"]):
        ideal.extend([
            "Define functional and non-functional requirements first",
            "Estimate scale (QPS, storage, bandwidth)",
            "Discuss key components, trade-offs, and bottlenecks",
        ])
    elif any(w in q_lower for w in ["algorithm", "complexity", "implement", "code", "write"]):
        ideal.extend([
            "State time and space complexity (Big-O notation)",
            "Handle edge cases explicitly (empty input, duplicates, overflow)",
            "Walk through the approach with a concrete example",
        ])
    elif any(w in q_lower for w in ["difference", "compare", "vs", "versus", "between"]):
        ideal.extend([
            "Structure as a direct comparison with key differentiators",
            "Mention when to use each option with real-world examples",
            "Cover trade-offs and appropriate use cases",
        ])
    elif any(w in q_lower for w in ["tell me", "describe", "situation", "time when", "experience"]):
        ideal.extend([
            "Use the STAR method: Situation, Task, Action, Result",
            "Quantify the impact of your actions where possible",
            "Reflect on what you learned from the experience",
        ])
    else:
        ideal.extend([
            "Include a concrete example or analogy to illustrate the concept",
            "Cover edge cases, limitations, or when not to use this approach",
            "Relate to real-world production usage or personal experience",
        ])

    if not positives:
        positives = ["Shows attempt to engage with the question"]
    if not missing:
        missing = ["Minor improvements could add even more depth or precision"]

    return {"positive": positives[:3], "missing": missing[:3], "ideal": ideal[:3]}


# ── Main evaluation pipeline ─────────────────────────────────────────────────

def evaluate_answer(answer: str, question: str, category: str = "") -> dict:
    """
    Full evaluation pipeline using interview_quality_classifier.pkl.

    Returns a scoring dict with:
      - class (0/1/2), label, badge
      - overall_score (0–100)
      - relevance, depth, clarity sub-scores
      - probabilities from the XGBoost model
      - structured feedback (positive, missing, ideal)
    """
    # Handle empty / very short answers immediately
    if not answer or len(answer.strip()) < 5:
        return {
            "class": 0,
            "label": "Weak",
            "overall_score": 5,
            "relevance": 10,
            "depth": 5,
            "clarity": 10,
            "badge": "Weak",
            "badge_config": BADGE_CONFIG["Weak"],
            "feedback": {
                "positive": ["You started — that's the first step!"],
                "missing":  ["Please write a substantive answer with at least a few sentences"],
                "ideal":    ["Explain the concept clearly, then support it with examples"],
            },
            "probabilities": {"weak": 1.0, "needs_improvement": 0.0, "good": 0.0},
        }

    # Build 770-dim feature vector
    feature_vec = _build_feature_vector(answer)

    # Run XGBoost model
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        pred_class = int(MODEL.predict(feature_vec)[0])
        proba      = MODEL.predict_proba(feature_vec)[0]   # [weak, needs_imp, good]

    # Heuristic sub-scores
    relevance = _relevance_score(answer, question)
    depth     = _depth_score(answer)
    clarity   = _clarity_score(answer)
    sent_count = _sentence_count(answer)

    # Correction layer: The trained XGBoost model was trained with sentence count
    # directly as a feature, which penalizes answers with >= 9 sentences (class 1)
    # and >= 12 sentences (class 0). We override this penalization for long, 
    # high-quality, relevant answers to make the scoring system monotonic and logical.
    if sent_count >= 5:
        if pred_class < 2:
            if relevance >= 50 and depth >= 60:
                pred_class = 2
                proba = np.array([0.01, 0.09, 0.90])
            elif relevance >= 40 and depth >= 45 and pred_class == 0:
                pred_class = 1
                proba = np.array([0.05, 0.85, 0.10])

    # Blend model confidence with heuristics for a smooth 0–100 overall score
    # model_score peaks at 100 when proba[good]=1.0
    model_score = proba[2] * 100 + proba[1] * 55 + proba[0] * 15
    overall     = int(model_score * 0.50 + relevance * 0.20 + depth * 0.20 + clarity * 0.10)
    overall     = max(5, min(100, overall))

    # Derive badge from overall score
    if overall >= 85:
        badge = "Excellent"
    elif overall >= 65:
        badge = "Good"
    elif overall >= 40:
        badge = "Needs Improvement"
    else:
        badge = "Weak"

    return {
        "class":         pred_class,
        "label":         badge,
        "overall_score": overall,
        "relevance":     relevance,
        "depth":         depth,
        "clarity":       clarity,
        "badge":         badge,
        "badge_config":  BADGE_CONFIG[badge],
        "feedback":      _build_feedback(pred_class, relevance, depth, clarity, question, sent_count),
        "probabilities": {
            "weak":             round(float(proba[0]), 3),
            "needs_improvement": round(float(proba[1]), 3),
            "good":             round(float(proba[2]), 3),
        },
    }
