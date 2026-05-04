# DataShield Deployment Guide

This guide covers deploying DataShield to Vercel (frontend + backend).

## Prerequisites

- Vercel account ([vercel.com](https://vercel.com))
- GitHub repository with your code
- Upstash Redis account ([upstash.com](https://upstash.com)) for serverless Redis

---

## Part 1: Deploy Backend

### 1.1 Set up Upstash Redis

1. Go to [console.upstash.com](https://console.upstash.com)
2. Create a new Redis database (choose a region close to your users)
3. Copy the `UPSTASH_REDIS_REST_URL` — you'll need this

### 1.2 Deploy to Vercel

1. **Import Project**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Set **Root Directory** to `datashield/backend`
   - Framework Preset: **Other**

2. **Configure Environment Variables**
   
   Add these in Vercel dashboard (Settings → Environment Variables):

   ```
   OG_INDEXER_RPC=https://indexer-storage-testnet-standard.0g.ai
   OG_CHAIN_RPC=https://evmrpc-testnet.0g.ai
   ORACLE_PRIVATE_KEY=0x87fdd961acc59b9f6d412d96688e3b53550ff720de9e3c1ca1e61752900a7e7b
   DATASEAL_NFT_ADDRESS=0xF34c654ebE27954E7b0917A267EA4c8B4d2AD619
   DATAMARKET_ADDRESS=0xD1F1E3D8818959cC4bE1b109770d5B6875daF499
   OG_TOKEN_ADDRESS=0x0000000000000000000000000000000000000001
   REDIS_URL=<your-upstash-redis-url>
   PORT=4000
   ```

   ⚠️ **IMPORTANT**: Keep `ORACLE_PRIVATE_KEY` secret! This is the same key used in contract deployment.

3. **Deploy**
   - Click **Deploy**
   - Wait for build to complete
   - Copy your backend URL (e.g., `https://datashield-backend.vercel.app`)

### 1.3 Test Backend

```bash
curl https://your-backend.vercel.app/api/health
# Should return: {"status":"ok","timestamp":...}
```

---

## Part 2: Deploy Frontend

### 2.1 Deploy to Vercel

1. **Import Project** (or add another project if using same repo)
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Set **Root Directory** to `datashield/frontend`
   - Framework Preset: **Next.js**

2. **Configure Environment Variables**

   Add these in Vercel dashboard:

   ```
   NEXT_PUBLIC_API_URL=https://your-backend.vercel.app
   NEXT_PUBLIC_OG_CHAIN_ID=16602
   NEXT_PUBLIC_OG_CHAIN_RPC=https://evmrpc-testnet.0g.ai
   NEXT_PUBLIC_DATASEAL_ADDRESS=0xF34c654ebE27954E7b0917A267EA4c8B4d2AD619
   NEXT_PUBLIC_DATAMARKET_ADDRESS=0xD1F1E3D8818959cC4bE1b109770d5B6875daF499
   NEXT_PUBLIC_OG_TOKEN_ADDRESS=0x0000000000000000000000000000000000000001
   ```

   Replace `https://your-backend.vercel.app` with your actual backend URL from Part 1.

3. **Deploy**
   - Click **Deploy**
   - Wait for build to complete
   - Your frontend is now live! 🎉

---

## Part 3: Update Backend CORS

After deploying the frontend, update the backend to allow requests from your frontend domain:

1. Go to your backend Vercel project
2. Add environment variable:
   ```
   ALLOWED_ORIGINS=https://your-frontend.vercel.app
   ```
3. Redeploy backend

---

## Part 4: Custom Domains (Optional)

### Frontend
1. Go to your frontend project → Settings → Domains
2. Add your custom domain (e.g., `datashield.ai`)
3. Follow DNS configuration instructions

### Backend
1. Go to your backend project → Settings → Domains
2. Add subdomain (e.g., `api.datashield.ai`)
3. Update frontend `NEXT_PUBLIC_API_URL` to use new domain
4. Redeploy frontend

---

## Troubleshooting

### Backend Issues

**"Module not found" errors**
- Check that all dependencies are in `package.json`
- Ensure `vercel.json` includes the correct source files

**Redis connection errors**
- Verify `REDIS_URL` is correct
- Check Upstash dashboard for connection issues
- Ensure Redis database is in the same region as Vercel deployment

**0G RPC errors**
- Verify `OG_CHAIN_RPC` and `OG_INDEXER_RPC` are accessible
- Test RPC endpoints: `curl https://evmrpc-testnet.0g.ai`

### Frontend Issues

**"Failed to fetch" errors**
- Check `NEXT_PUBLIC_API_URL` points to correct backend
- Verify backend CORS allows frontend domain
- Check browser console for specific error messages

**Wallet connection issues**
- Ensure `NEXT_PUBLIC_OG_CHAIN_ID` is `16602`
- Verify contract addresses are correct
- Check MetaMask is connected to 0G testnet

**Build failures**
- Check all environment variables are set
- Verify no TypeScript errors: `npm run build` locally
- Check Vercel build logs for specific errors

---

## Monitoring & Logs

### Vercel Dashboard
- **Functions**: View serverless function logs
- **Analytics**: Monitor traffic and performance
- **Deployments**: Roll back to previous versions if needed

### Upstash Dashboard
- Monitor Redis usage and connections
- View command statistics
- Check for rate limiting issues

---

## Production Checklist

Before going to production:

- [ ] Replace `ORACLE_PRIVATE_KEY` with a production key (not the one in this repo!)
- [ ] Set up custom domains
- [ ] Enable Vercel Analytics
- [ ] Configure rate limiting on backend
- [ ] Set up monitoring/alerting (e.g., Sentry)
- [ ] Test full upload → scan → mint → list → purchase flow
- [ ] Verify all contract addresses are correct
- [ ] Update README with live URLs
- [ ] Add terms of service and privacy policy pages

---

## Cost Estimates

### Vercel
- **Hobby Plan**: Free (good for hackathons/demos)
  - 100 GB bandwidth/month
  - Serverless function execution included
- **Pro Plan**: $20/month (recommended for production)
  - 1 TB bandwidth
  - Better performance

### Upstash Redis
- **Free Tier**: 10,000 commands/day (good for demos)
- **Pay-as-you-go**: $0.2 per 100K commands (production)

**Total for demo**: $0/month (using free tiers)
**Total for production**: ~$20-40/month

---

## Alternative: Railway Deployment

If you prefer Railway over Vercel (better for backend with Redis):

1. Create Railway project
2. Add Redis service (built-in, no Upstash needed)
3. Add Node.js service for backend
4. Deploy frontend to Vercel (same as above)

Railway is simpler for backend but costs ~$5/month minimum.

---

## Support

- **0G Documentation**: [docs.0g.ai](https://docs.0g.ai)
- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Upstash Docs**: [docs.upstash.com](https://docs.upstash.com)

For DataShield-specific issues, open a GitHub issue or contact the team.
