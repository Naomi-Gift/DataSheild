import express from "express";
import cors from "cors";
import multer from "multer";
import * as path from "path";
import * as fs from "fs";
import * as crypto from "crypto";
import { ethers } from "ethers";
import { spawn } from "child_process";
import { anchorProofOnChain } from "../src/da";
import * as dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors({
  origin: [
    "https://data-shield-red.vercel.app",
    "http://localhost:3000",
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"],
}));
app.use(express.json({ limit: "10mb" }));

const upload = multer({
  dest: "/tmp",
  fileFilter: (_req, file, cb) => {
    const allowed = [".csv", ".json", ".jsonl", ".ndjson", ".txt", ".docx", ".parquet"];
    const ext = path.extname(file.originalname || "").toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

// In-memory job store (lives for the duration of the serverless instance)
const results = new Map<string, any>();

function runScanner(filePath: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const scannerPath = path.join(__dirname, "../src/scanner/scanner.py");
    const proc = spawn("python3", [scannerPath, filePath]);
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += d));
    proc.stderr.on("data", (d) => (stderr += d));
    proc.on("close", (code) => {
      if (code !== 0) reject(new Error(`Scanner failed: ${stderr}`));
      else {
        try { resolve(JSON.parse(stdout)); }
        catch { reject(new Error(`Invalid scanner output: ${stdout}`)); }
      }
    });
  });
}

function signScanResult(datasetHash: string, scanResultHash: string, score: number): Promise<string> {
  const provider = new ethers.JsonRpcProvider(process.env.OG_CHAIN_RPC!);
  const wallet = new ethers.Wallet(process.env.ORACLE_PRIVATE_KEY!, provider);
  const packed = ethers.solidityPackedKeccak256(
    ["bytes32", "bytes32", "uint8"],
    [datasetHash, scanResultHash, score]
  );
  return wallet.signMessage(ethers.getBytes(packed));
}

app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    const walletAddress = String(req.body.walletAddress || "");
    const file = req.file;
    if (!file) return res.status(400).json({ error: "Missing file" });
    if (!walletAddress || !walletAddress.startsWith("0x")) {
      return res.status(400).json({ error: "Missing walletAddress" });
    }

    const jobId = crypto.randomUUID();
    const ext = path.extname(file.originalname || "");
    const finalPath = path.join("/tmp", `datashield_${jobId}${ext}`);
    fs.renameSync(file.path, finalPath);

    // Mark as running immediately
    results.set(jobId, { status: "running" });

    // Run scan inline (async, don't await — return jobId immediately)
    (async () => {
      try {
        // Hash the file locally instead of uploading to 0G Storage (fast)
        const fileBuffer = fs.readFileSync(finalPath);
        const fileHash = "0x" + crypto.createHash("sha256").update(fileBuffer).digest("hex");
        // Pad to bytes32
        const rootHash = fileHash.padEnd(66, "0") as `0x${string}`;

        const scanOutput = await runScanner(finalPath);

        const scanResultStr = JSON.stringify(scanOutput);
        const scanResultHash = "0x" + crypto.createHash("sha256").update(scanResultStr).digest("hex");

        const oracleSig = await signScanResult(rootHash, scanResultHash, scanOutput.score);

        if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);

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
            name: path.basename(file.originalname || "Dataset", ext) || "Dataset",
            description: "Dataset uploaded and verified by DataShield.",
            modelType: "other",
            useCases: [],
          },
        });
      } catch (err: any) {
        results.set(jobId, { status: "failed", error: err?.message || "Scan failed" });
        if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
      }
    })();

    return res.json({ jobId, message: "Upload received, scan started" });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Upload failed" });
  }
});

app.get("/api/scan/:jobId", (req, res) => {
  const result = results.get(req.params.jobId) || { status: "pending" };
  return res.json(result);
});

type Listing = {
  tokenId: number; datasetName: string; modelType: string; score: number;
  price: string; stake: string; uploader: string; sampleCount: number;
  slashed: boolean; listedAt: number;
};

const MOCK_LISTINGS: Listing[] = [
  { tokenId: 1, datasetName: "Clean Reviews v1", modelType: "text-classification", score: 88, price: "50.0", stake: "100.0", uploader: "0x1111111111111111111111111111111111111111", sampleCount: 1200, slashed: false, listedAt: Date.now() - 1000 * 60 * 60 * 5 },
  { tokenId: 2, datasetName: "Support Chats", modelType: "nlp", score: 76, price: "25.0", stake: "100.0", uploader: "0x2222222222222222222222222222222222222222", sampleCount: 5400, slashed: false, listedAt: Date.now() - 1000 * 60 * 60 * 12 },
  { tokenId: 3, datasetName: "Retail Transactions", modelType: "tabular", score: 82, price: "30.0", stake: "100.0", uploader: "0x3333333333333333333333333333333333333333", sampleCount: 25000, slashed: false, listedAt: Date.now() - 1000 * 60 * 60 * 36 },
  { tokenId: 4, datasetName: "Poisoned Set (Example)", modelType: "other", score: 45, price: "5.0", stake: "100.0", uploader: "0x4444444444444444444444444444444444444444", sampleCount: 900, slashed: true, listedAt: Date.now() - 1000 * 60 * 60 * 48 },
];

app.get("/api/listings", (req, res) => {
  const modelType = typeof req.query.modelType === "string" ? req.query.modelType : undefined;
  const minScore = typeof req.query.minScore === "string" ? Number(req.query.minScore) : undefined;
  const sort = typeof req.query.sort === "string" ? req.query.sort : "newest";

  let items = [...MOCK_LISTINGS];
  if (modelType && modelType !== "all") items = items.filter((l) => l.modelType === modelType);
  if (Number.isFinite(minScore as any)) items = items.filter((l) => l.score >= (minScore as number));
  if (sort === "score") items.sort((a, b) => b.score - a.score);
  else if (sort === "price") items.sort((a, b) => Number(a.price) - Number(b.price));
  else items.sort((a, b) => b.listedAt - a.listedAt);

  return res.json({ listings: items });
});

const DATASEAL_ABI = [
  "function getSeal(uint256 tokenId) view returns (tuple(bytes32 datasetHash, bytes32 scanResultHash, bytes32 daProofRoot, uint8 score, uint64 timestamp, address uploader, uint256 stake, bool slashed, string datasetName, string modelType, uint256 sampleCount))",
  "function isSlashed(uint256 tokenId) view returns (bool)",
];

app.get("/api/seal/:tokenId", async (req, res) => {
  try {
    const tokenId = Number(req.params.tokenId);
    if (!Number.isFinite(tokenId) || tokenId <= 0) return res.status(400).json({ error: "Invalid tokenId" });
    const provider = new ethers.JsonRpcProvider(process.env.OG_CHAIN_RPC!);
    const nft = new ethers.Contract(process.env.DATASEAL_NFT_ADDRESS!, DATASEAL_ABI, provider);
    const seal = await nft.getSeal(tokenId);
    return res.json(seal);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Failed to fetch seal" });
  }
});

app.post("/api/anchor", async (req, res) => {
  try {
    const tokenId = Number(req.body?.tokenId);
    const daProofRoot = String(req.body?.daProofRoot || "");
    if (!Number.isFinite(tokenId) || tokenId <= 0) return res.status(400).json({ error: "Invalid tokenId" });
    if (!daProofRoot.startsWith("0x") || daProofRoot.length !== 66) return res.status(400).json({ error: "Invalid daProofRoot" });
    const provider = new ethers.JsonRpcProvider(process.env.OG_CHAIN_RPC!);
    const signer = new ethers.Wallet(process.env.ORACLE_PRIVATE_KEY!, provider);
    const txHash = await anchorProofOnChain(tokenId, daProofRoot, signer);
    return res.json({ txHash });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Anchor failed" });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

export default app;
