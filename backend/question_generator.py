"""
question_generator.py — AI Question Generation using FLAN-T5-small
iPrep backend — generates interview questions locally with no API key required.

Model: google/flan-t5-small (~300MB, downloaded once to HF cache on first run)
"""

import re
import os
import warnings
import random

# Suppress HF/transformers warnings for cleaner logs
os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
warnings.filterwarnings("ignore")

from transformers import T5Tokenizer, T5ForConditionalGeneration

# ── Load FLAN-T5-small once at module import ───────────────────────────────
print("⏳ Loading FLAN-T5-small… (first run downloads ~300MB, cached after)")
_MODEL_NAME = "google/flan-t5-small"
_TOKENIZER  = T5Tokenizer.from_pretrained(_MODEL_NAME)
_MODEL      = T5ForConditionalGeneration.from_pretrained(_MODEL_NAME)
_MODEL.eval()
print("✅ FLAN-T5-small loaded.")

# ── Prompt templates keyed by category ────────────────────────────────────
_PROMPT_TEMPLATES = {
    "DSA": [
        "Ask a {difficulty} technical interview question about data structures and algorithms for a {role}: ",
        "Write one {difficulty} coding interview question on arrays, trees, graphs, or sorting for a {role} interview: ",
        "Give a {difficulty} algorithm interview question testing problem solving skills for a {role}: ",
    ],
    "System Design": [
        "Ask a {difficulty} system design interview question for a {role}: ",
        "Write one {difficulty} software architecture question about scalability or distributed systems for a {role}: ",
        "Give a {difficulty} system design question about databases, caching, or microservices for a {role}: ",
    ],
    "Technical Concepts": [
        "Ask a {difficulty} technical interview question about programming concepts for a {role}: ",
        "Write one {difficulty} interview question testing core software engineering knowledge for a {role}: ",
        "Give a {difficulty} technical question about concurrency, databases, or APIs for a {role}: ",
    ],
    "Behavioral": [
        "Ask a {difficulty} behavioral interview question using the STAR method for a {role}: ",
        "Write one {difficulty} situational interview question about teamwork or leadership for a {role}: ",
        "Give a {difficulty} behavioral interview question about handling challenges at work for a {role}: ",
    ],
    "All": [
        "Ask a {difficulty} software engineering interview question for a {role}: ",
        "Write one {difficulty} technical interview question for a {role} candidate: ",
        "Give a {difficulty} interview question covering programming or system design for a {role}: ",
    ],
}

# ── Tag suggestions per category ──────────────────────────────────────────
_CATEGORY_TAGS = {
    "DSA": ["Arrays", "Trees", "Graphs", "Dynamic Programming", "Sorting", "Hashing", "Recursion", "Binary Search"],
    "System Design": ["Scalability", "Distributed Systems", "Databases", "Caching", "Load Balancing", "APIs", "Microservices"],
    "Technical Concepts": ["Programming", "OOP", "Concurrency", "Memory", "Networking", "Security", "APIs"],
    "Behavioral": ["Leadership", "Teamwork", "Communication", "Problem Solving", "Conflict Resolution", "Ownership"],
    "All": ["General", "Software Engineering", "Problem Solving"],
}


def _clean_output(text: str) -> str:
    """Clean and validate the generated question text."""
    text = text.strip()
    # Remove leading labels like "Question:", "Q:" etc.
    text = re.sub(r"^(Question|Q|Interview Question|Answer)\s*[:\-]\s*", "", text, flags=re.IGNORECASE)
    text = text.strip()
    # Ensure it ends with a question mark
    if text and not text.endswith("?"):
        # If it ends with a period, replace with question mark
        if text.endswith("."):
            text = text[:-1] + "?"
        else:
            text += "?"
    # Capitalize first letter
    if text:
        text = text[0].upper() + text[1:]
    return text


def _generate_one(role: str, category: str, difficulty: str) -> str:
    """Generate a single interview question using FLAN-T5."""
    cat_key = category if category in _PROMPT_TEMPLATES else "All"
    template = random.choice(_PROMPT_TEMPLATES[cat_key])
    prompt = template.format(
        role=role if role != "All" else "software engineer",
        difficulty=difficulty if difficulty != "All" else "medium",
    )

    inputs = _TOKENIZER(
        prompt,
        return_tensors="pt",
        max_length=128,
        truncation=True,
    )

    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        outputs = _MODEL.generate(
            inputs.input_ids,
            max_new_tokens=80,
            num_beams=4,
            no_repeat_ngram_size=2,
            early_stopping=True,
            do_sample=False,
        )

    decoded = _TOKENIZER.decode(outputs[0], skip_special_tokens=True)
    return _clean_output(decoded)


def generate_questions(
    role: str = "All",
    category: str = "All",
    difficulty: str = "Medium",
    n: int = 10,
) -> list[dict]:
    """
    Generate `n` interview questions using FLAN-T5-small.

    Returns a list of question dicts compatible with the existing frontend:
      {id, text, role, category, difficulty, tags}
    """
    cat_key = category if category in _CATEGORY_TAGS else "All"
    available_tags = _CATEGORY_TAGS[cat_key]

    questions = []
    seen_texts: set[str] = set()
    attempts = 0
    max_attempts = n * 4  # Allow retries for duplicates

    while len(questions) < n and attempts < max_attempts:
        attempts += 1
        text = _generate_one(role, category, difficulty)

        # Basic quality filter: must be ≥20 chars, a question, not a duplicate
        if len(text) < 20:
            continue
        if not text.endswith("?"):
            continue
        norm = text.lower()[:60]
        if norm in seen_texts:
            continue

        seen_texts.add(norm)
        tags = random.sample(available_tags, min(2, len(available_tags)))

        questions.append({
            "id":         len(questions) + 1,
            "text":       text,
            "role":       role if role != "All" else "General",
            "category":   category if category != "All" else "General",
            "difficulty": difficulty if difficulty != "All" else "Medium",
            "tags":       tags,
        })

    # If we couldn't generate enough unique questions, pad with fallbacks
    if len(questions) < n:
        fallbacks = _get_fallback_questions(role, category, difficulty)
        for fb in fallbacks:
            if len(questions) >= n:
                break
            norm = fb["text"].lower()[:60]
            if norm not in seen_texts:
                seen_texts.add(norm)
                questions.append(fb)

    return questions[:n]


def _get_fallback_questions(role: str, category: str, difficulty: str) -> list[dict]:
    """
    High-quality curated fallback questions if FLAN-T5 generates too many duplicates.
    These are only used as padding — the primary source is always FLAN-T5.
    """
    cat = category if category != "All" else "Technical Concepts"
    diff = difficulty if difficulty != "All" else "Medium"
    role_label = role if role != "All" else "Software Engineer"
    tag_pool = _CATEGORY_TAGS.get(cat, ["General"])
    tags = random.sample(tag_pool, min(2, len(tag_pool)))

    bank = {
        "DSA": [
            "Implement an LRU cache with O(1) get and put operations — what data structures would you use?",
            "Find the longest substring without repeating characters and explain your sliding window approach.",
            "Given a binary tree, find the lowest common ancestor of two nodes without parent pointers.",
            "Design a distributed rate limiter using a sliding window algorithm — handle edge cases like clock drift.",
            "Write a function to reverse a linked list in place and explain time and space complexity.",
        ],
        "System Design": [
            "Design a URL shortener like bit.ly — cover hashing, storage, and scaling considerations.",
            "Design a notification system that handles 10 million users with push, email, and SMS channels.",
            "Design Twitter's timeline feature — how do you handle fan-out on write vs fan-out on read?",
            "Design a real-time chat application supporting 1M concurrent users — cover WebSocket management and delivery guarantees.",
            "Design a globally distributed key-value store — cover partitioning, replication, and conflict resolution.",
        ],
        "Technical Concepts": [
            "Explain the difference between process and thread — how does Go's goroutine model differ from OS threads?",
            "What is the CAP theorem and how does it affect distributed database design choices?",
            "Explain the N+1 query problem — how do you detect and fix it in an ORM-based application?",
            "What are database indexes? Explain B-Tree vs Hash indexes and when to use each.",
            "Explain how JWT authentication works end-to-end — what are the security vulnerabilities?",
        ],
        "Behavioral": [
            "Tell me about a time you debugged a production issue under pressure — walk me through your process.",
            "Describe a situation where you had to balance technical debt against shipping a new feature.",
            "Tell me about a time you disagreed with a technical decision — how did you handle it?",
            "Walk me through a complex system you designed from scratch — what trade-offs did you make?",
            "Describe a project where you owned both frontend and backend — what were the biggest integration challenges?",
        ],
    }

    fallback_texts = bank.get(cat, bank["Technical Concepts"])
    random.shuffle(fallback_texts)
    return [
        {"id": i + 1, "text": t, "role": role_label, "category": cat, "difficulty": diff, "tags": tags}
        for i, t in enumerate(fallback_texts)
    ]
