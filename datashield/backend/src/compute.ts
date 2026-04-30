import { ethers } from "ethers";
import { spawn } from "child_process";
import * as path from "path";
import * as dotenv from "dotenv";
dotenv.config();

const ORACLE_KEY = process.env.ORACLE_PRIVATE_KEY!;
const CHAIN_RPC = process.env.OG_CHAIN_RPC!;

// Work around ESM/CJS interop issues on newer Node versions by requiring the package at runtime.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createZGComputeNetworkBroker } = require("@0glabs/0g-serving-broker") as {
  createZGComputeNetworkBroker: (signer: any) => Promise<any>;
};

export function getOracleWallet(): ethers.Wallet {
  const provider = new ethers.JsonRpcProvider(CHAIN_RPC);
  return new ethers.Wallet(ORACLE_KEY, provider);
}

export async function signScanResult(
  datasetHash: string,
  scanResultHash: string,
  score: number
): Promise<string> {
  const wallet = getOracleWallet();
  const packed = ethers.solidityPackedKeccak256(
    ["bytes32", "bytes32", "uint8"],
    [datasetHash, scanResultHash, score]
  );
  return wallet.signMessage(ethers.getBytes(packed));
}

export async function runPoisonScanner(datasetPath: string): Promise<{
  score: number;
  sampleCount: number;
  checks: { label: object; embed: object; dup: object };
}> {
  return new Promise((resolve, reject) => {
    const scannerPath = path.join(__dirname, "scanner", "scanner.py");
    const proc = spawn("python3", [scannerPath, datasetPath]);
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += d));
    proc.stderr.on("data", (d) => (stderr += d));
    proc.on("close", (code) => {
      if (code !== 0) reject(new Error(`Scanner failed: ${stderr}`));
      else {
        try {
          resolve(JSON.parse(stdout));
        } catch {
          reject(new Error(`Invalid scanner output: ${stdout}`));
        }
      }
    });
  });
}

export async function generateDatasetListing(datasetSample: string): Promise<{
  name: string;
  description: string;
  modelType: string;
  useCases: string[];
}> {
  const signer = getOracleWallet();
  const broker: any = await createZGComputeNetworkBroker(signer as any);
  const svcName = "qwen-2.5-7b-instruct";

  const { endpoint } = await broker.getServiceMetadata(svcName);
  const headers = await broker.getRequestHeaders(svcName, datasetSample);

  const res = await fetch(`${endpoint}/v1/chat/completions`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: svcName,
      messages: [
        {
          role: "user",
          content: `You are a dataset analyst. Given this training data sample, return ONLY a JSON object (no markdown, no explanation) with these exact fields:
- name: string (max 6 words, descriptive dataset name)
- description: string (2 sentences explaining what this dataset is for)
- modelType: one of ["text-classification","image-segmentation","object-detection","nlp","tabular","other"]
- useCases: array of exactly 3 specific use cases as strings

Dataset sample (first 2000 chars):
${datasetSample.slice(0, 2000)}`,
        },
      ],
      max_tokens: 400,
    }),
  });

  await broker.processResponse(svcName, res, datasetSample);
  const data = (await res.json()) as any;
  const content = data.choices[0].message.content;
  return JSON.parse(content.replace(/```json|```/g, "").trim());
}

export async function generateDisputeVerdict(
  scanLog: object,
  disputeEvidence: string
): Promise<{
  poisonFound: boolean;
  confidence: number;
  summary: string;
  evidence: number[];
  recommendation: "slash" | "dismiss" | "investigate_further";
}> {
  const signer = getOracleWallet();
  const broker: any = await createZGComputeNetworkBroker(signer as any);
  const svcName = "qwen-2.5-7b-instruct";

  const prompt = JSON.stringify({ scanLog, disputeEvidence });
  const { endpoint } = await broker.getServiceMetadata(svcName);
  const headers = await broker.getRequestHeaders(svcName, prompt);

  const res = await fetch(`${endpoint}/v1/chat/completions`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: svcName,
      messages: [
        {
          role: "user",
          content: `You are a data integrity auditor. Analyse this scan log and buyer dispute.
Return ONLY a JSON object (no markdown) with:
- poisonFound: boolean
- confidence: number 0-100
- summary: string (2 sentences plain English verdict)
- evidence: array of sample indices that are problematic (empty array if none)
- recommendation: one of ["slash","dismiss","investigate_further"]

Scan log: ${JSON.stringify(scanLog)}
Buyer evidence: ${disputeEvidence}`,
        },
      ],
      max_tokens: 500,
    }),
  });

  await broker.processResponse(svcName, res, prompt);
  const data = (await res.json()) as any;
  const content = data.choices[0].message.content;
  return JSON.parse(content.replace(/```json|```/g, "").trim());
}

