# Quick Vercel Deployment

## 1. Backend First

```bash
cd datashield/backend
vercel
```

**Environment Variables to add in Vercel dashboard:**
```
OG_INDEXER_RPC=https://indexer-storage-testnet-standard.0g.ai
OG_CHAIN_RPC=https://evmrpc-testnet.0g.ai
ORACLE_PRIVATE_KEY=0x87fdd961acc59b9f6d412d96688e3b53550ff720de9e3c1ca1e61752900a7e7b
DATASEAL_NFT_ADDRESS=0xF34c654ebE27954E7b0917A267EA4c8B4d2AD619
DATAMARKET_ADDRESS=0xD1F1E3D8818959cC4bE1b109770d5B6875daF499
OG_TOKEN_ADDRESS=0x0000000000000000000000000000000000000001
REDIS_URL=<get-from-upstash>
PORT=4000
```

**Get Redis URL:**
1. Go to [console.upstash.com](https://console.upstash.com)
2. Create Redis database
3. Copy REST URL

**Copy backend URL** (e.g., `https://datashield-backend.vercel.app`)

---

## 2. Frontend Second

```bash
cd datashield/frontend
vercel
```

**Environment Variables to add in Vercel dashboard:**
```
NEXT_PUBLIC_API_URL=<your-backend-url-from-step-1>
NEXT_PUBLIC_OG_CHAIN_ID=16602
NEXT_PUBLIC_OG_CHAIN_RPC=https://evmrpc-testnet.0g.ai
NEXT_PUBLIC_DATASEAL_ADDRESS=0xF34c654ebE27954E7b0917A267EA4c8B4d2AD619
NEXT_PUBLIC_DATAMARKET_ADDRESS=0xD1F1E3D8818959cC4bE1b109770d5B6875daF499
NEXT_PUBLIC_OG_TOKEN_ADDRESS=0x0000000000000000000000000000000000000001
```

---

## 3. Test

Visit your frontend URL and:
1. Connect wallet (MetaMask with 0G testnet)
2. Try uploading a CSV dataset
3. Check marketplace loads

---

## Troubleshooting

**Backend 500 errors:**
- Check Vercel function logs
- Verify all env vars are set
- Test Redis connection in Upstash dashboard

**Frontend can't connect:**
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check browser console for CORS errors
- Ensure backend is deployed and healthy

**Wallet issues:**
- Add 0G testnet to MetaMask:
  - Network Name: 0G Testnet
  - RPC URL: https://evmrpc-testnet.0g.ai
  - Chain ID: 16602
  - Currency: 0G

---

## Done! 🎉

Your DataShield is now live on Vercel.

For full documentation, see [DEPLOYMENT.md](./DEPLOYMENT.md)
