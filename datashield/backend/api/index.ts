import express from "express";
import cors from "cors";
import multer from "multer";
import * as path from "path";
import * as fs from "fs";
import * as crypto from "crypto";
import { enqueueScan, getScanResult } from "../src/queue";
import { ethers } from "ethers";
import { anchorProofOnChain } from "../src/da";
import * as dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const upload = multer({ dest: "/tmp" });

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

    enqueueScan({ jobId, filePath: finalPath, walletAddress });
    return res.json({ jobId, message: "Upload received, scan started" });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Upload failed" });
  }
});

app.get("/api/scan/:jobId", (req, res) => {
  const jobId = req.params.jobId;
  const result = getScanResult(jobId);
  return res.json(result);
});

type Listing = {
  tokenId: number;
  datasetName: string;
  modelType: string;
  score: number;
  price: string;
  stake: string;
  uploader: string;
  sampleCount: number;
  slashed: boolean;
  listedAt: number;
};

const MOCK_LISTINGS: Listing[] = [
  {
    tokenId: 1,
    datasetName: "Clean Reviews v1",
    modelType: "text-classification",
    score: 88,
    price: ethers.formatEther(ethers.parseEther("50")),
    stake: ethers.formatEther(ethers.parseEther("100")),
    uploader: "0x1111111111111111111111111111111111111111",
    sampleCount: 1200,
    slashed: false,
    listedAt: Date.now() - 1000 * 60 * 60 * 5,
  },
  {
    tokenId: 2,
    datasetName: "Support Chats",
    modelType: "nlp",
    score: 76,
    price: ethers.formatEther(ethers.parseEther("25")),
    stake: ethers.formatEther(ethers.parseEther("100")),
    uploader: "0x2222222222222222222222222222222222222222",
    sampleCount: 5400,
    slashed: false,
    listedAt: Date.now() - 1000 * 60 * 60 * 12,
  },
  {
    tokenId: 3,
    datasetName: "Retail Transactions",
    modelType: "tabular",
    score: 82,
    price: ethers.formatEther(ethers.parseEther("30")),
    stake: ethers.formatEther(ethers.parseEther("100")),
    uploader: "0x3333333333333333333333333333333333333333",
    sampleCount: 25000,
    slashed: false,
    listedAt: Date.now() - 1000 * 60 * 60 * 36,
  },
  {
    tokenId: 4,
    datasetName: "Poisoned Set (Example)",
    modelType: "other",
    score: 45,
    price: ethers.formatEther(ethers.parseEther("5")),
    stake: ethers.formatEther(ethers.parseEther("100")),
    uploader: "0x4444444444444444444444444444444444444444",
    sampleCount: 900,
    slashed: true,
    listedAt: Date.now() - 1000 * 60 * 60 * 48,
  },
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
    if (!daProofRoot.startsWith("0x") || daProofRoot.length !== 66) {
      return res.status(400).json({ error: "Invalid daProofRoot" });
    }

    const provider = new ethers.JsonRpcProvider(process.env.OG_CHAIN_RPC!);
    const signer = new ethers.Wallet(process.env.ORACLE_PRIVATE_KEY!, provider);
    const txHash = await anchorProofOnChain(tokenId, daProofRoot, signer);
    return res.json({ txHash });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Anchor failed" });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

// Export for Vercel serverless
export default app;
