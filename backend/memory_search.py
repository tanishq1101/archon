"""Shared keyword-ranking used by the memory and AI-query endpoints.

NOTE: This is lightweight substring word-matching, not vector RAG. It is a
single source of truth so the memory preview, search, and AI-query routes
rank identically. For semantic retrieval, swap this for pgvector embeddings.
"""
from typing import List, Optional


def tokenize(query: str, min_len: int = 1) -> List[str]:
    return [w for w in query.lower().split() if len(w) >= min_len]


def rank_docs(query: str, docs: list, limit: int, min_word_len: int = 1) -> list:
    """Return the top `limit` docs scored by how many query words appear in
    their title/content, highest score first."""
    query_words = tokenize(query, min_word_len)
    if not query_words:
        return []
    scored = []
    for doc in docs:
        haystack_content = doc.get("content", "").lower()
        haystack_title = doc.get("title", "").lower()
        score = sum(1 for w in query_words if w in haystack_content or w in haystack_title)
        if score > 0:
            scored.append((score, doc))
    scored.sort(key=lambda x: x[0], reverse=True)
    return scored[:limit]
