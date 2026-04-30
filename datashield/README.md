# DataShield
**Decentralised training data marketplace with cryptographic poison detection — built on 0G.**  
DataShield lets dataset uploaders certify training data via 0G Compute poison scans, mint an on-chain DataSeal quality certificate, and sell verified datasets to buyers using $0G.

## The Problem
AI training datasets are increasingly targeted by **data poisoning**: malicious samples, label flips, duplicate/backdoor triggers, and distribution anomalies that silently degrade model performance or embed backdoors.

## How It Works
1. **Upload**: Uploader submits a dataset file to the DataShield backend.
2. **0G Storage**: Dataset is uploaded and a merkle root is produced (dataset hash).
3. **Poison detection**: 0G Compute (plus a local scanner for demo) produces a scan log and a cleanliness score.
4. **Data Availability**: Scan logs are archived (demo uses 0G Storage as DA), producing a proof root.
5. **Seal (NFT)**: A **DataSeal NFT** is minted on 0G Chain with a bonded $0G stake and an oracle signature over the scan output.
6. **List & Purchase**: Seller lists the DataSeal on the **DataMarket** contract. Buyers pay in $0G, receive the DataSeal NFT and dataset access.
7. **Disputes**: If post-sale poison is proven, an AI verdict can trigger **slashing** of the uploader’s bonded stake via oracle.

## 0G Infrastructure

| 0G layer | What DataShield uses it for |
|---|---|
| 0G Storage | Dataset uploads + scan log archival (DA demo) |
| 0G Compute Network | LLM-powered listing generation and dispute verdicts |
| 0G Chain (EVM) | DataSeal NFT + DataMarket settlement in $0G |
| Data Availability | Scan log proof root anchoring (archival + replay) |

## Smart Contracts
- **DataSealNFT**: `TODO_AFTER_DEPLOY`
- **DataMarket**: `TODO_AFTER_DEPLOY`

Explorer base: `https://chainscan-galileo.0g.ai/address/<CONTRACT_ADDRESS>`

## Live Demo
- Frontend: `TODO_DEPLOY_URL`

## Tech Stack
- **Contracts**: Solidity (`0.8.20`), Foundry (forge/cast)
- **Backend**: Node.js + TypeScript, Express, Bull (Redis), ethers v6, 0G TS SDK
- **Frontend**: Next.js 14 (App Router), TailwindCSS, wagmi + viem, React Query, Sonner
- **AI models (0G Compute)**: `qwen-2.5-7b-instruct` (testnet)

## Local Setup
### Prerequisites
- Node.js 18+
- Foundry (`forge`)
- Python 3
- Redis (required for the queue)

### 1) Install
```bash
cd datashield/contracts
forge install --no-git foundry-rs/forge-std OpenZeppelin/openzeppelin-contracts@v4.9.6

cd ../backend
npm install

cd ../frontend
npm install
```

### 2) Environment variables
- Copy `datashield/.env.example` into:
  - `datashield/contracts/.env`
  - `datashield/backend/.env`
  - `datashield/frontend/.env.local`

**Important**: `ORACLE_PRIVATE_KEY` must match between contracts + backend.

### 3) Deploy contracts (0G testnet)
```bash
cd datashield/contracts
set -a; source .env; set +a
forge script script/Deploy.s.sol:Deploy --rpc-url "$OG_CHAIN_RPC" --broadcast --private-key "$PRIVATE_KEY"
```

This updates `datashield/contracts/deployments.json`. Copy the deployed addresses into:
- `datashield/backend/.env` (`DATASEAL_NFT_ADDRESS`, `DATAMARKET_ADDRESS`)
- `datashield/frontend/.env.local` (`NEXT_PUBLIC_DATASEAL_ADDRESS`, `NEXT_PUBLIC_DATAMARKET_ADDRESS`)

### 4) Start Redis
```bash
brew install redis && brew services start redis
# OR
docker run -d -p 6379:6379 redis:alpine
```

### 5) Run backend
```bash
cd datashield/backend
set -a; source .env; set +a
npm run dev
```

### 6) Run frontend
```bash
cd datashield/frontend
set -a; source .env.local; set +a
npm run dev
```

