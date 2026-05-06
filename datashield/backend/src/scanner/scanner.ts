/**
 * DataShield Poison Detection Scanner — TypeScript port
 * Runs the same 3 checks as scanner.py but in-process (no Python subprocess)
 */

export interface CheckResult {
  passed: boolean;
  detail: string;
  penalty: number;
  suspicious?: any[];
  duplicateRatio?: number;
  outlierRatio?: number;
  sampleIndices?: number[];
}

export interface ScanOutput {
  score: number;
  sampleCount: number;
  checks: {
    label: CheckResult;
    embed: CheckResult;
    dup: CheckResult;
  };
}

type Row = Record<string, string>;

// ── Loaders ──────────────────────────────────────────────────────────────────

function parseCSV(content: string): Row[] {
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  return lines.slice(1).map((line) => {
    // Simple CSV parse — handles quoted fields
    const values: string[] = [];
    let cur = "", inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQuote = !inQuote; continue; }
      if (ch === "," && !inQuote) { values.push(cur); cur = ""; continue; }
      cur += ch;
    }
    values.push(cur);
    const row: Row = {};
    headers.forEach((h, i) => { row[h] = (values[i] ?? "").trim(); });
    return row;
  });
}

function parseJSON(content: string): Row[] {
  const data = JSON.parse(content);
  const arr = Array.isArray(data)
    ? data
    : (data.data ?? data.rows ?? data.samples ?? data.items ?? data.records ?? data.examples ?? [data]);
  return arr.map((r: any) => (typeof r === "object" && r !== null ? r : { text: String(r) }));
}

function parseJSONL(content: string): Row[] {
  return content.split(/\r?\n/).filter((l) => l.trim()).map((line) => {
    try { const o = JSON.parse(line); return typeof o === "object" ? o : { text: String(o) }; }
    catch { return { text: line }; }
  });
}

function parseTXT(content: string): Row[] {
  return content.split(/\r?\n/).filter((l) => l.trim()).map((l) => ({ text: l.trim() }));
}

function parseDocx(buffer: Buffer): Row[] {
  // DOCX is a zip — extract word/document.xml and pull text runs
  // Use a simple regex approach since we can't use xml parsers easily
  try {
    // Find PK zip signature and try to extract XML text
    const str = buffer.toString("binary");
    // Look for text between <w:t> tags
    const matches = str.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || [];
    const paragraphs: string[] = [];
    let current = "";
    for (const m of matches) {
      const text = m.replace(/<[^>]+>/g, "").trim();
      if (text) current += text + " ";
    }
    // Split by paragraph markers
    const paraMatches = str.match(/<w:p[ >][\s\S]*?<\/w:p>/g) || [];
    for (const para of paraMatches) {
      const texts = (para.match(/<w:t[^>]*>([^<]*)<\/w:t>/g) || [])
        .map((t) => t.replace(/<[^>]+>/g, "").trim())
        .join(" ").trim();
      if (texts) paragraphs.push(texts);
    }
    return paragraphs.length > 0
      ? paragraphs.map((p) => ({ text: p }))
      : [{ text: current.trim() }];
  } catch {
    return [{ text: "Unable to parse document" }];
  }
}

export function loadDataset(filePath: string, buffer: Buffer): Row[] {
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  const content = buffer.toString("utf8");
  if (ext === "csv") return parseCSV(content);
  if (ext === "json") return parseJSON(content);
  if (ext === "jsonl" || ext === "ndjson") return parseJSONL(content);
  if (ext === "txt") return parseTXT(content);
  if (ext === "docx" || ext === "doc") return parseDocx(buffer);
  // Fallback: try CSV
  try { return parseCSV(content); } catch { return parseTXT(content); }
}

// ── Checks ────────────────────────────────────────────────────────────────────

function checkLabelConsistency(rows: Row[]): CheckResult {
  const labels = rows.map((r) => r.label?.trim()).filter(Boolean);
  if (!labels.length) return { passed: true, detail: "No label column found", penalty: 0 };

  const total = labels.length;
  const counts: Record<string, number> = {};
  for (const l of labels) counts[l] = (counts[l] ?? 0) + 1;

  const suspicious = Object.entries(counts)
    .filter(([, c]) => c / total < 0.01 || c / total > 0.80)
    .map(([label, count]) => ({ label, ratio: Math.round((count / total) * 10000) / 10000, count }));

  if (!suspicious.length) {
    return { passed: true, detail: `${Object.keys(counts).length} classes, balanced distribution`, penalty: 0 };
  }
  if (suspicious.length === 1 && suspicious[0].ratio < 0.05) {
    return { passed: false, detail: `Minor imbalance: ${JSON.stringify(suspicious)}`, penalty: 15, suspicious };
  }
  return { passed: false, detail: `Severe imbalance: ${JSON.stringify(suspicious)}`, penalty: 30, suspicious };
}

function checkDuplicateInjection(rows: Row[]): CheckResult {
  if (!rows.length) return { passed: true, detail: "Empty dataset", penalty: 0 };

  const seen = new Map<string, number>();
  let dupes = 0;
  for (let i = 0; i < rows.length; i++) {
    const key = JSON.stringify(rows[i]);
    if (seen.has(key)) dupes++;
    else seen.set(key, i);
  }

  const ratio = dupes / rows.length;
  if (ratio < 0.005) return { passed: true, detail: `Duplicate ratio: ${(ratio * 100).toFixed(2)}%`, penalty: 0 };
  if (ratio < 0.02) return { passed: false, detail: `Suspicious duplicates: ${(ratio * 100).toFixed(2)}%`, penalty: 20, duplicateRatio: ratio };
  return { passed: false, detail: `High duplicate rate: ${(ratio * 100).toFixed(2)}%`, penalty: 35, duplicateRatio: ratio };
}

function checkTextOutliers(rows: Row[]): CheckResult {
  const textCols = ["text", "content", "input", "sentence", "review", "comment"];
  const col = textCols.find((c) => rows[0] && c in rows[0]);
  if (!col || !rows.length) return { passed: true, detail: "No text column found for outlier check", penalty: 0 };

  const lengths = rows.map((r) => String(r[col] ?? "").length);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((a, b) => a + (b - mean) ** 2, 0) / lengths.length;
  const std = Math.sqrt(variance);

  if (std === 0) return { passed: true, detail: "All texts same length", penalty: 0 };

  const outliers = lengths.map((l, i) => ({ l, i })).filter(({ l }) => Math.abs(l - mean) > 3 * std);
  const ratio = outliers.length / lengths.length;

  if (ratio < 0.02) return { passed: true, detail: `Outlier ratio: ${(ratio * 100).toFixed(2)}%`, penalty: 0 };
  if (ratio < 0.05) return { passed: false, detail: `Moderate outliers: ${(ratio * 100).toFixed(2)}%`, penalty: 15, outlierRatio: ratio, sampleIndices: outliers.slice(0, 10).map((o) => o.i) };
  return { passed: false, detail: `High outlier rate: ${(ratio * 100).toFixed(2)}%`, penalty: 25, outlierRatio: ratio, sampleIndices: outliers.slice(0, 10).map((o) => o.i) };
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function runScannerSync(filePath: string, buffer: Buffer): ScanOutput {
  const rows = loadDataset(filePath, buffer);
  const label = checkLabelConsistency(rows);
  const dup = checkDuplicateInjection(rows);
  const embed = checkTextOutliers(rows);
  const score = Math.max(0, 100 - label.penalty - dup.penalty - embed.penalty);
  return { score, sampleCount: rows.length, checks: { label, embed, dup } };
}
