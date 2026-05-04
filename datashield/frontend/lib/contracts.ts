import { defineChain } from "viem";

export const OG_CHAIN = defineChain({
  id: Number(process.env.NEXT_PUBLIC_OG_CHAIN_ID || 16600),
  name: "0G Aristotle Testnet",
  nativeCurrency: { name: "0G", symbol: "0G", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_OG_CHAIN_RPC || "https://evmrpc-testnet.0g.ai"] },
  },
});

export const DATASEAL_ADDRESS = (process.env.NEXT_PUBLIC_DATASEAL_ADDRESS || "0x") as `0x${string}`;
export const DATAMARKET_ADDRESS = (process.env.NEXT_PUBLIC_DATAMARKET_ADDRESS || "0x") as `0x${string}`;
export const OG_TOKEN_ADDRESS = (process.env.NEXT_PUBLIC_OG_TOKEN_ADDRESS || "0x0000000000000000000000000000000000000001") as `0x${string}`;

export const ERC20_ABI = [
  {
    type: "function",
    name: "approve",
    stateMutability: "nonpayable",
    inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "allowance",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
] as const;

export const DATASEAL_ABI = [
  {
    type: "function",
    name: "getSeal",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "datasetHash", type: "bytes32" },
          { name: "scanResultHash", type: "bytes32" },
          { name: "daProofRoot", type: "bytes32" },
          { name: "score", type: "uint8" },
          { name: "timestamp", type: "uint64" },
          { name: "uploader", type: "address" },
          { name: "stake", type: "uint256" },
          { name: "slashed", type: "bool" },
          { name: "datasetName", type: "string" },
          { name: "modelType", type: "string" },
          { name: "sampleCount", type: "uint256" }
        ]
      }
    ]
  },
  { type: "function", name: "isSlashed", stateMutability: "view", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ name: "", type: "bool" }] },
  {
    type: "function",
    name: "mint",
    stateMutability: "payable",
    inputs: [
      { name: "datasetHash", type: "bytes32" },
      { name: "scanResultHash", type: "bytes32" },
      { name: "score", type: "uint8" },
      { name: "datasetName", type: "string" },
      { name: "modelType", type: "string" },
      { name: "sampleCount", type: "uint256" },
      { name: "oracleSig", type: "bytes" }
    ],
    outputs: [{ name: "tokenId", type: "uint256" }]
  },
  { type: "function", name: "anchorDAProof", stateMutability: "nonpayable", inputs: [{ name: "tokenId", type: "uint256" }, { name: "daProofRoot", type: "bytes32" }], outputs: [] },
  { type: "function", name: "slash", stateMutability: "nonpayable", inputs: [{ name: "tokenId", type: "uint256" }, { name: "reporter", type: "address" }], outputs: [] },
  { type: "function", name: "hashToToken", stateMutability: "view", inputs: [{ name: "datasetHash", type: "bytes32" }], outputs: [{ name: "", type: "uint256" }] },
  { type: "function", name: "approve", stateMutability: "nonpayable", inputs: [{ name: "to", type: "address" }, { name: "tokenId", type: "uint256" }], outputs: [] },
] as const;

export const DATAMARKET_ABI = [
  { type: "function", name: "list", stateMutability: "nonpayable", inputs: [{ name: "tokenId", type: "uint256" }, { name: "price", type: "uint256" }], outputs: [] },
  { type: "function", name: "purchase", stateMutability: "nonpayable", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [] },
  { type: "function", name: "delist", stateMutability: "nonpayable", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [] },
  { type: "function", name: "updatePrice", stateMutability: "nonpayable", inputs: [{ name: "tokenId", type: "uint256" }, { name: "newPrice", type: "uint256" }], outputs: [] },
  {
    type: "function",
    name: "getListing",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "seller", type: "address" },
          { name: "price", type: "uint256" },
          { name: "active", type: "bool" },
          { name: "listedAt", type: "uint64" }
        ]
      }
    ]
  }
] as const;

