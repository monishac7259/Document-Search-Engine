"""
DocSearch AI - Document Search Engine Backend
AI & Cloud Computing Internship Project
Author: Intern
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import numpy as np
from datetime import datetime

app = Flask(__name__)
CORS(app)

# ─── In-memory document store (replace with cloud DB in production) ───
documents = [
    {
        "id": 1,
        "title": "Introduction to Machine Learning Algorithms",
        "content": "This document covers supervised and unsupervised learning. "
                   "Topics include gradient descent, backpropagation, SVMs, "
                   "decision trees, and random forests. Neural networks are "
                   "explored with practical Python examples.",
        "type": "PDF",
        "tags": ["ML", "AI", "Algorithms"],
        "date": "2024-03-10",
        "size_kb": 420,
        "embedding": None,  # Populated on upload
    },
    {
        "id": 2,
        "title": "Cloud Computing Architecture Patterns",
        "content": "Microservices and serverless patterns for scalable cloud "
                   "deployment. Covers AWS Lambda, GCP Cloud Run, load balancing, "
                   "auto-scaling, CI/CD pipelines, and Kubernetes orchestration.",
        "type": "DOCX",
        "tags": ["Cloud", "AWS", "GCP"],
        "date": "2024-01-15",
        "size_kb": 310,
        "embedding": None,
    },
    {
        "id": 3,
        "title": "Neural Network Design: A Practical Guide",
        "content": "Deep dive into CNNs, RNNs, and transformer architectures. "
                   "Covers attention mechanisms, BERT, GPT, and hands-on "
                   "PyTorch code. Includes training tips and hyperparameter tuning.",
        "type": "PDF",
        "tags": ["DL", "Neural Nets", "PyTorch"],
        "date": "2024-02-22",
        "size_kb": 580,
        "embedding": None,
    },
    {
        "id": 4,
        "title": "Semantic Search Engine Implementation",
        "content": "Building a semantic search system using OpenAI embeddings, "
                   "Pinecone vector database, and FAISS. Covers cosine similarity, "
                   "approximate nearest neighbor search, and indexing strategies.",
        "type": "PPT",
        "tags": ["NLP", "Embeddings", "Vector DB"],
        "date": "2023-11-05",
        "size_kb": 250,
        "embedding": None,
    },
]

# ─── Simulated Embeddings (replace with OpenAI/Sentence Transformers) ───
def get_mock_embedding(text: str) -> list[float]:
    """
    Production: Use sentence-transformers or OpenAI embeddings API.
    For demo: generate deterministic pseudo-random vectors.
    """
    np.random.seed(sum(ord(c) for c in text[:20]))
    return np.random.randn(384).tolist()  # 384-dim like all-MiniLM-L6-v2

def cosine_similarity(a: list, b: list) -> float:
    a, b = np.array(a), np.array(b)
    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-8))

# Pre-compute embeddings for all documents
for doc in documents:
    doc["embedding"] = get_mock_embedding(doc["title"] + " " + doc["content"])


# ─── API Routes ───

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "docs_indexed": len(documents), "timestamp": datetime.utcnow().isoformat()})


@app.route("/api/search", methods=["GET"])
def search():
    """Semantic search endpoint."""
    query = request.args.get("q", "").strip()
    doc_type = request.args.get("type", "all").lower()
    limit = int(request.args.get("limit", 10))

    if not query:
        return jsonify({"error": "Query parameter 'q' is required"}), 400

    # 1. Embed the query
    query_embedding = get_mock_embedding(query)

    # 2. Compute cosine similarity against all docs
    results = []
    for doc in documents:
        if doc_type != "all" and doc["type"].lower() != doc_type:
            continue
        score = cosine_similarity(query_embedding, doc["embedding"])
        # Boost score by keyword overlap (TF-IDF style boost in production)
        keyword_boost = sum(
            0.05 for word in query.lower().split()
            if word in (doc["title"] + doc["content"]).lower()
        )
        final_score = min(1.0, score * 0.5 + 0.5 + keyword_boost)
        results.append({
            "id": doc["id"],
            "title": doc["title"],
            "snippet": doc["content"][:200] + "...",
            "type": doc["type"],
            "tags": doc["tags"],
            "date": doc["date"],
            "size_kb": doc["size_kb"],
            "score": round(final_score, 4),
        })

    # 3. Sort by score descending
    results.sort(key=lambda x: x["score"], reverse=True)

    return jsonify({
        "query": query,
        "total": len(results),
        "results": results[:limit],
        "latency_ms": 42,  # Replace with real timing
    })


@app.route("/api/documents", methods=["GET"])
def list_documents():
    """Return all indexed documents (without embeddings)."""
    return jsonify([
        {k: v for k, v in doc.items() if k != "embedding"}
        for doc in documents
    ])


@app.route("/api/documents/<int:doc_id>", methods=["GET"])
def get_document(doc_id):
    """Fetch a single document by ID."""
    doc = next((d for d in documents if d["id"] == doc_id), None)
    if not doc:
        return jsonify({"error": "Document not found"}), 404
    return jsonify({k: v for k, v in doc.items() if k != "embedding"})


@app.route("/api/upload", methods=["POST"])
def upload_document():
    """
    Upload and index a new document.
    Production: Parse PDF/DOCX, chunk text, embed chunks, store in vector DB.
    """
    data = request.get_json()
    if not data or "title" not in data or "content" not in data:
        return jsonify({"error": "title and content are required"}), 400

    new_doc = {
        "id": max(d["id"] for d in documents) + 1,
        "title": data["title"],
        "content": data["content"],
        "type": data.get("type", "TXT").upper(),
        "tags": data.get("tags", []),
        "date": datetime.utcnow().strftime("%Y-%m-%d"),
        "size_kb": len(data["content"]) // 1024 or 1,
        "embedding": get_mock_embedding(data["title"] + " " + data["content"]),
    }
    documents.append(new_doc)
    return jsonify({"message": "Document indexed successfully", "id": new_doc["id"]}), 201


@app.route("/api/stats", methods=["GET"])
def stats():
    """System statistics for the dashboard."""
    return jsonify({
        "total_documents": len(documents),
        "by_type": {t: sum(1 for d in documents if d["type"] == t)
                    for t in set(d["type"] for d in documents)},
        "embedding_dimensions": 384,
        "model": "all-MiniLM-L6-v2 (demo: mock)",
        "avg_latency_ms": 42,
    })


if __name__ == "__main__":
    print("DocSearch AI backend running on http://localhost:5000")
    app.run(debug=True, host="0.0.0.0", port=5000)
