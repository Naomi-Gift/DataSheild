import Bull from "bull";
import { ethers } from "ethers";
import * as fs from "fs";
import * as crypto from "crypto";
import { uploadDataset } from "./storage";
import { runPoisonScanner, signScanResult, generateDatasetListing } from "./compute";
import { publishScanLog } from "./da";
import * as dotenv from "dotenv";
dotenv.config();

export interface ScanJob {
  jobId: string;
  filePath: string;
  walletAddress: string;
}

export interface ScanResult {
  status: "pending" | "running" | "complete" | "failed";
  rootHash?: string;
  score?: number;
  sampleCount?: number;
  scanResultHash?: string;
  oracleSig?: string;
  daProofRoot?: string;
  checks?: object;
  listing?: object;
  error?: string;
}

const scanQueue = new Bull("scan-jobs", process.env.REDIS_URL || "redis://localhost:6379");
const results = new Map<string, ScanResult>();

function getSigner(): ethers.Signer {
  const provider = new ethers.JsonRpcProvider(process.env.OG_CHAIN_RPC!);
  return new ethers.Wallet(process.env.ORACLE_PRIVATE_KEY!, provider);
}

scanQueue.process(async (job) => {
  const { jobId, filePath, walletAddress } = job.data as ScanJob;
  results.set(jobId, { status: "running" });

  try {
    const signer = getSigner();

    // Run storage upload and poison scan in parallel — independent of each other
    const [{ rootHash }, scanOutput] = await Promise.all([
      uploadDataset(filePath, signer),
      runPoisonScanner(filePath),
    ]);

    const scanResultStr = JSON.stringify(scanOutput);
    const scanResultHash = "0x" + crypto.createHash("sha256").update(scanResultStr).digest("hex");

    const oracleSig = await signScanResult(rootHash, scanResultHash, scanOutput.score);

    // Mark complete immediately with core results so frontend unblocks
    results.set(jobId, {
      status: "complete",
      rootHash,
      score: scanOutput.score,
      sampleCount: scanOutput.sampleCount,
      scanResultHash,
      oracleSig,
      daProofRoot: "",
      checks: scanOutput.checks,
      listing: {
        name: "Dataset",
        description: "Dataset uploaded to DataShield.",
        modelType: "other",
        useCases: [],
      },
    });

    // Run listing generation and DA archival in background — don't block the user
    const sample = fs.existsSync(filePath)
      ? fs.readFileSync(filePath, "utf8").slice(0, 3000)
      : "";

    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    // Fire and forget — update result when done
    Promise.all([
      generateDatasetListing(sample).catch(() => null),
      publishScanLog(jobId, { scanOutput, rootHash, walletAddress }, signer).catch(() => null),
    ]).then(([listing, daResult]) => {
      const current = results.get(jobId);
      if (current?.status === "complete") {
        results.set(jobId, {
          ...current,
          listing: listing || current.listing,
          daProofRoot: daResult?.daProofRoot || "",
        });
      }
    });

  } catch (err: any) {
    results.set(jobId, { status: "failed", error: err?.message || "Unknown error" });
    if (fs.existsSync(job.data.filePath)) fs.unlinkSync(job.data.filePath);
  }
});

export function enqueueScan(job: ScanJob): void {
  results.set(job.jobId, { status: "pending" });
  scanQueue.add(job);
}

export function getScanResult(jobId: string): ScanResult {
  return results.get(jobId) || { status: "pending" };
}

