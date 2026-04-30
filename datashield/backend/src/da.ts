import { ZgFile, Indexer } from "@0glabs/0g-ts-sdk";
import { ethers } from "ethers";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
dotenv.config();

const INDEXER_RPC = process.env.OG_INDEXER_RPC!;
const CHAIN_RPC = process.env.OG_CHAIN_RPC!;

export async function publishScanLog(
  jobId: string,
  scanLog: object,
  signer: ethers.Signer
): Promise<{ daProofRoot: string; txHash: string }> {
  const tmpPath = path.join("/tmp", `scan_log_${jobId}.json`);
  fs.writeFileSync(tmpPath, JSON.stringify(scanLog, null, 2));

  const file: any = await (ZgFile as any).fromFilePath(tmpPath);
  const [tree, err] = (await file.merkleTree()) as [any, any];
  if (err) throw new Error(`DA merkle error: ${err}`);

  const daProofRoot: string = tree?.rootHash?.() ?? tree?.rootHash ?? "";
  if (!daProofRoot) throw new Error("DA merkle tree returned empty rootHash");
  const indexer = new Indexer(INDEXER_RPC);
  const [tx, uploadErr] = (await (indexer as any).upload(file, CHAIN_RPC, signer as any)) as [any, any];
  if (uploadErr) throw new Error(`DA upload error: ${uploadErr}`);

  fs.unlinkSync(tmpPath);
  const txHash: string = tx?.hash ?? tx?.txHash ?? "";
  return { daProofRoot, txHash };
}

const DATASEAL_ABI = [
  "function anchorDAProof(uint256 tokenId, bytes32 daProofRoot) external",
];

export async function anchorProofOnChain(
  tokenId: number,
  daProofRoot: string,
  signer: ethers.Signer
): Promise<string> {
  const nft = new ethers.Contract(process.env.DATASEAL_NFT_ADDRESS!, DATASEAL_ABI, signer);
  const tx = await nft.anchorDAProof(tokenId, daProofRoot);
  await tx.wait();
  return tx.hash;
}

