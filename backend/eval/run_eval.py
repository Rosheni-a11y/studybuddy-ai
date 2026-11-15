"""
Retrieval evaluation for StudyBuddy AI.

Measures how well the RAG system retrieves relevant chunks
for known questions from the Flutter lecture PDF.

Usage:
  1. Upload the Flutter lecture PDF via the app (or run with --upload path/to/pdf)
  2. python run_eval.py
"""

import json
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from rag_engine import _get_vectorstore, upload_pdf


def load_eval_data():
    path = os.path.join(os.path.dirname(__file__), "eval_data.json")
    with open(path) as f:
        return json.load(f)


def evaluate_retrieval(k=4):
    vectorstore = _get_vectorstore()
    eval_data = load_eval_data()
    results = []

    for item in eval_data:
        question = item["question"]
        expected = [kw.lower() for kw in item["expected_keywords"]]

        docs = vectorstore.similarity_search(question, k=k)
        retrieved_text = " ".join(doc.page_content.lower() for doc in docs)

        found = [kw for kw in expected if kw in retrieved_text]
        missed = [kw for kw in expected if kw not in retrieved_text]

        recall = len(found) / len(expected) if expected else 0

        results.append({
            "question": question,
            "expected": item["expected_keywords"],
            "found": found,
            "missed": missed,
            "recall": round(recall, 2),
            "chunks_retrieved": len(docs),
        })

    avg_recall = sum(r["recall"] for r in results) / len(results)

    perfect = sum(1 for r in results if r["recall"] == 1.0)
    partial = sum(1 for r in results if 0 < r["recall"] < 1.0)
    zero = sum(1 for r in results if r["recall"] == 0)

    summary = {
        "total_questions": len(results),
        "avg_recall": round(avg_recall, 3),
        "perfect_recall": perfect,
        "partial_recall": partial,
        "zero_recall": zero,
        "k": k,
    }

    return summary, results


def print_report(summary, results):
    print("=" * 60)
    print("  StudyBuddy AI — Retrieval Evaluation Report")
    print("=" * 60)
    print(f"\n  Questions evaluated : {summary['total_questions']}")
    print(f"  Chunks per query   : {summary['k']}")
    print(f"  Average recall     : {summary['avg_recall']:.1%}")
    print(f"  Perfect recall     : {summary['perfect_recall']}/{summary['total_questions']}")
    print(f"  Partial recall     : {summary['partial_recall']}/{summary['total_questions']}")
    print(f"  Zero recall        : {summary['zero_recall']}/{summary['total_questions']}")
    print()

    print("-" * 60)
    print("  Per-question breakdown")
    print("-" * 60)

    for i, r in enumerate(results, 1):
        status = "PASS" if r["recall"] == 1.0 else ("PARTIAL" if r["recall"] > 0 else "FAIL")
        print(f"\n  Q{i}: {r['question']}")
        print(f"      Recall: {r['recall']:.0%}  [{status}]")
        if r["found"]:
            print(f"      Found:  {', '.join(r['found'])}")
        if r["missed"]:
            print(f"      Missed: {', '.join(r['missed'])}")

    print("\n" + "=" * 60)

    out_path = os.path.join(os.path.dirname(__file__), "eval_results.json")
    with open(out_path, "w") as f:
        json.dump({"summary": summary, "results": results}, f, indent=2)
    print(f"  Results saved to {out_path}")
    print("=" * 60)


if __name__ == "__main__":
    if "--upload" in sys.argv:
        idx = sys.argv.index("--upload")
        pdf_path = sys.argv[idx + 1]
        print(f"Uploading {pdf_path}...")
        result = upload_pdf(pdf_path)
        print(result["message"])
        print()

    summary, results = evaluate_retrieval()
    print_report(summary, results)
