import { ZgFile, Indexer } from "@0glabs/0g-ts-sdk";
import { ethers } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

const INDEXER_RPC = process.env.OG_INDEXER_RPC!;
const CHAIN_RPC = process.env.OG_CHAIN_RPC!;

export async function uploadDataset(
  filePath: string,
  signer: ethers.Signer
): Promise<{ rootHash: string; txHash: string }> {
  const file: any = await (ZgFile as any).fromFilePath(filePath);
  const [tree, err] = (await file.merkleTree()) as [any, any];
  if (err) throw new Error(`Merkle tree error: ${err}`);

  const rootHash: string = tree?.rootHash?.() ?? tree?.rootHash ?? "";
  if (!rootHash) throw new Error("Merkle tree returned empty rootHash");
  const indexer = new Indexer(INDEXER_RPC);
  const [tx, uploadErr] = (await (indexer as any).upload(file, CHAIN_RPC, signer as any)) as [any, any];
  if (uploadErr) throw new Error(`Upload error: ${uploadErr}`);

  const txHash: string = tx?.hash ?? tx?.txHash ?? "";
  return { rootHash, txHash };
}

export async function downloadDataset(
  rootHash: string,
  outputPath: string,
  signer: ethers.Signer
): Promise<void> {
  const indexer = new Indexer(INDEXER_RPC);
  const res: any = await (indexer as any).download(rootHash, outputPath, false);
  const err = Array.isArray(res) ? res[1] : res?.err;
  if (err) throw new Error(`Download error: ${err}`);
}

