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

    const { rootHash } = await uploadDataset(filePath, signer);

    const scanOutput = await runPoisonScanner(filePath);

    const scanResultStr = JSON.stringify(scanOutput);
    const scanResultHash = "0x" + crypto.createHash("sha256").update(scanResultStr).digest("hex");

    const oracleSig = await signScanResult(rootHash, scanResultHash, scanOutput.score);

    let listing: any = null;
    try {
      const sample = fs.readFileSync(filePath, "utf8").slice(0, 3000);
      listing = await generateDatasetListing(sample);
    } catch (e) {
      listing = {
        name: "Unnamed Dataset",
        description: "Dataset uploaded to DataShield.",
        modelType: "other",
        useCases: [],
      };
    }

    let daProofRoot = "";
    try {
      const { daProofRoot: root } = await publishScanLog(jobId, { scanOutput, rootHash, walletAddress }, signer);
      daProofRoot = root;
    } catch {
      daProofRoot = "";
    }

    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    results.set(jobId, {
      status: "complete",
      rootHash,
      score: scanOutput.score,
      sampleCount: scanOutput.sampleCount,
      scanResultHash,
      oracleSig,
      daProofRoot,
      checks: scanOutput.checks,
      listing,
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

