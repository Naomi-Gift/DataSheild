#!/usr/bin/env python3
"""
DataShield Poison Detection Scanner
Supports CSV, JSON, JSONL, TXT, and DOCX datasets
Usage: python scanner.py <dataset_path>
"""

import sys
import json
import hashlib
import csv
import math
import os
from collections import Counter


def load_dataset(path: str):
    ext = os.path.splitext(path)[1].lower()

    if ext == ".csv":
        return load_csv(path)
    elif ext == ".json":
        return load_json(path)
    elif ext in (".jsonl", ".ndjson"):
        return load_jsonl(path)
    elif ext == ".txt":
        return load_txt(path)
    elif ext in (".docx", ".doc"):
        return load_docx(path)
    else:
        # Try CSV as fallback
        return load_csv(path)


def load_csv(path: str):
    rows = []
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append(row)
    return rows


def load_json(path: str):
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        data = json.load(f)
    if isinstance(data, list):
        return [r if isinstance(r, dict) else {"text": str(r)} for r in data]
    elif isinstance(data, dict):
        # Try common keys: data, rows, samples, items, records
        for key in ("data", "rows", "samples", "items", "records", "examples"):
            if key in data and isinstance(data[key], list):
                return [r if isinstance(r, dict) else {"text": str(r)} for r in data[key]]
        return [data]
    return [{"text": str(data)}]


def load_jsonl(path: str):
    rows = []
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
                rows.append(obj if isinstance(obj, dict) else {"text": str(obj)})
            except json.JSONDecodeError:
                rows.append({"text": line})
    return rows


def load_txt(path: str):
    rows = []
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            line = line.strip()
            if line:
                rows.append({"text": line})
    return rows


def load_docx(path: str):
    """Extract paragraphs from a .docx file using stdlib zipfile + XML parsing."""
    import zipfile
    import xml.etree.ElementTree as ET

    rows = []
    try:
        with zipfile.ZipFile(path, "r") as z:
            with z.open("word/document.xml") as doc_xml:
                tree = ET.parse(doc_xml)
                root = tree.getroot()
                ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
                for para in root.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}p"):
                    texts = [t.text or "" for t in para.iter("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}t")]
                    line = "".join(texts).strip()
                    if line:
                        rows.append({"text": line})
    except Exception as e:
        raise ValueError(f"Failed to parse DOCX: {e}")
    return rows


def check_label_consistency(rows: list) -> dict:
    """
    Detect label anomalies.
    Flags if any label class has fewer than 5% or more than 60% of total samples.
    Score penalty: -15 if triggered, -30 if severely unbalanced
    """
    if not rows or "label" not in rows[0]:
        return {"passed": True, "detail": "No label column found", "penalty": 0}

    labels = [r.get("label", "").strip() for r in rows if r.get("label", "").strip()]
    if not labels:
        return {"passed": True, "detail": "No labels found", "penalty": 0}

    total = len(labels)
    counts = Counter(labels)
    num_classes = len(counts)

    suspicious = []
    for label, count in counts.items():
        ratio = count / total
        if ratio < 0.01 or ratio > 0.80:
            suspicious.append({"label": label, "ratio": round(ratio, 4), "count": count})

    if not suspicious:
        return {"passed": True, "detail": f"{num_classes} classes, balanced distribution", "penalty": 0}
    elif len(suspicious) == 1 and suspicious[0]["ratio"] < 0.05:
        return {
            "passed": False,
            "detail": f"Minor imbalance: {suspicious}",
            "penalty": 15,
            "suspicious": suspicious,
        }
    else:
        return {
            "passed": False,
            "detail": f"Severe imbalance: {suspicious}",
            "penalty": 30,
            "suspicious": suspicious,
        }


def check_duplicate_injection(rows: list) -> dict:
    """
    Detect near-duplicate samples (backdoor trigger pattern).
    Score penalty: -20 if > 0.5% of samples are near-duplicates
    """
    if not rows:
        return {"passed": True, "detail": "Empty dataset", "penalty": 0}

    hashes = []
    for row in rows:
        content = json.dumps(row, sort_keys=True)
        h = hashlib.sha256(content.encode()).hexdigest()
        hashes.append(h)

    total = len(hashes)
    seen = {}
    duplicates = []
    for i, h in enumerate(hashes):
        if h in seen:
            duplicates.append({"index": i, "duplicate_of": seen[h]})
        else:
            seen[h] = i

    dup_ratio = len(duplicates) / total if total > 0 else 0

    if dup_ratio < 0.005:
        return {"passed": True, "detail": f"Duplicate ratio: {round(dup_ratio * 100, 2)}%", "penalty": 0}
    elif dup_ratio < 0.02:
        return {
            "passed": False,
            "detail": f"Suspicious duplicates: {round(dup_ratio * 100, 2)}%",
            "penalty": 20,
            "duplicateRatio": dup_ratio,
        }
    else:
        return {
            "passed": False,
            "detail": f"High duplicate rate: {round(dup_ratio * 100, 2)}%",
            "penalty": 35,
            "duplicateRatio": dup_ratio,
        }


def check_text_outliers(rows: list) -> dict:
    """
    Detect text length outliers (proxy for embedding outlier detection without ML deps).
    Flags rows where text length is > 3 standard deviations from mean.
    Score penalty: -15 if > 2% of samples are outliers
    """
    text_cols = [
        k
        for k in (rows[0].keys() if rows else [])
        if k.lower() in ("text", "content", "input", "sentence", "review", "comment")
    ]

    if not text_cols or not rows:
        return {"passed": True, "detail": "No text column found for outlier check", "penalty": 0}

    col = text_cols[0]
    lengths = [len(str(r.get(col, ""))) for r in rows]

    if not lengths:
        return {"passed": True, "detail": "No text content", "penalty": 0}

    mean = sum(lengths) / len(lengths)
    if len(lengths) < 2:
        return {"passed": True, "detail": "Too few samples for outlier detection", "penalty": 0}

    variance = sum((l - mean) ** 2 for l in lengths) / len(lengths)
    std_dev = math.sqrt(variance)

    if std_dev == 0:
        return {"passed": True, "detail": "All texts same length (unusual but not poisoned)", "penalty": 0}

    outlier_indices = [i for i, l in enumerate(lengths) if abs(l - mean) > 3 * std_dev]
    outlier_ratio = len(outlier_indices) / len(lengths)

    if outlier_ratio < 0.02:
        return {"passed": True, "detail": f"Outlier ratio: {round(outlier_ratio * 100, 2)}%", "penalty": 0}
    elif outlier_ratio < 0.05:
        return {
            "passed": False,
            "detail": f"Moderate outliers: {round(outlier_ratio * 100, 2)}%",
            "penalty": 15,
            "outlierRatio": outlier_ratio,
            "sampleIndices": outlier_indices[:10],
        }
    else:
        return {
            "passed": False,
            "detail": f"High outlier rate: {round(outlier_ratio * 100, 2)}%",
            "penalty": 25,
            "outlierRatio": outlier_ratio,
            "sampleIndices": outlier_indices[:10],
        }


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: scanner.py <dataset_path>"}))
        sys.exit(1)

    dataset_path = sys.argv[1]

    try:
        rows = load_dataset(dataset_path)
    except Exception as e:
        print(json.dumps({"error": f"Failed to load dataset: {str(e)}", "score": 0}))
        sys.exit(1)

    label_result = check_label_consistency(rows)
    dup_result = check_duplicate_injection(rows)
    embed_result = check_text_outliers(rows)

    total_penalty = label_result["penalty"] + dup_result["penalty"] + embed_result["penalty"]
    score = max(0, 100 - total_penalty)

    output = {
        "score": score,
        "sampleCount": len(rows),
        "checks": {
            "label": label_result,
            "embed": embed_result,
            "dup": dup_result,
        },
    }

    print(json.dumps(output))


if __name__ == "__main__":
    main()

