export type ScanResult = {
  status: "pending" | "running" | "complete" | "failed";
  rootHash?: string;
  score?: number;
  sampleCount?: number;
  scanResultHash?: string;
  oracleSig?: string;
  daProofRoot?: string;
  checks?: any;
  listing?: any;
  error?: string;
};

function baseUrl() {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) throw new Error("Missing NEXT_PUBLIC_API_URL");
  return url.replace(/\/$/, "");
}

export async function fetchListings(params: {
  modelType?: string;
  minScore?: number;
  sort?: "score" | "price" | "newest";
}): Promise<{ listings: any[] }> {
  const usp = new URLSearchParams();
  if (params.modelType) usp.set("modelType", params.modelType);
  if (typeof params.minScore === "number") usp.set("minScore", String(params.minScore));
  if (params.sort) usp.set("sort", params.sort);

  const res = await fetch(`${baseUrl()}/api/listings?${usp.toString()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch listings (${res.status})`);
  return res.json();
}

export async function fetchScan(jobId: string): Promise<ScanResult> {
  const res = await fetch(`${baseUrl()}/api/scan/${jobId}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch scan (${res.status})`);
  return res.json();
}

export async function fetchSeal(tokenId: number): Promise<any> {
  const res = await fetch(`${baseUrl()}/api/seal/${tokenId}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch seal (${res.status})`);
  return res.json();
}

export async function anchorDAProof(tokenId: number, daProofRoot: string): Promise<{ txHash: string }> {
  const res = await fetch(`${baseUrl()}/api/anchor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tokenId, daProofRoot }),
  });
  if (!res.ok) throw new Error(`Failed to anchor proof (${res.status})`);
  return res.json();
}

