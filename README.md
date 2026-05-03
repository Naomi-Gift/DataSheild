# DataShield Repository

## 📁 Project Structure

```
DataSheild/
├── datashield/                    # Main project directory
│   ├── README.md                  # Comprehensive project documentation
│   ├── .env.example              # Environment template
│   ├── backend/                  # Node.js backend API
│   │   ├── src/
│   │   │   ├── api.ts            # Express API server
│   │   │   ├── compute.ts        # 0G Compute integration
│   │   │   ├── da.ts             # Data availability functions
│   │   │   ├── queue.ts          # Bull queue for scan jobs
│   │   │   ├── storage.ts        # 0G Storage integration
│   │   │   └── scanner/          # Python poison detection scanner
│   │   │       ├── scanner.py    # Main scanner script
│   │   │       └── requirements.txt
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── contracts/                # Smart contracts (Solidity)
│   │   ├── contracts/
│   │   │   ├── DataSealNFT.sol   # NFT for certified datasets
│   │   │   └── DataMarket.sol    # Marketplace for trading
│   │   ├── script/
│   │   │   └── Deploy.s.sol      # Deployment script
│   │   ├── foundry.toml
│   │   └── deployments.json      # Deployed contract addresses
│   └── frontend/                 # Next.js frontend application
│       ├── app/                   # App router pages
│       │   ├── page.tsx          # Home page
│       │   ├── upload/page.tsx   # Upload page
│       │   ├── layout.tsx        # Root layout
│       │   └── globals.css       # Global styles
│       ├── components/           # React components
│       │   ├── home/             # Home page components
│       │   ├── upload/           # Upload components
│       │   ├── marketplace/      # Marketplace components
│       │   ├── verify/           # Verification components
│       │   ├── layout/           # Layout components
│       │   └── ui/               # UI components
│       ├── package.json
│       └── tailwind.config.ts    # Tailwind configuration
└── README.md                      # This file
```

## 🚀 Quick Start

For detailed setup instructions, see [`datashield/README.md`](./datashield/README.md).

### 1. Navigate to project
```bash
cd DataSheild/datashield
```

### 2. Set up environment variables
```bash
cp .env.example contracts/.env
cp .env.example backend/.env
cp .env.example frontend/.env.local
```

### 3. Install dependencies
```bash
# Contracts
cd contracts
forge install

# Backend
cd ../backend
npm install

# Frontend
cd ../frontend
npm install
```

### 4. Start services
```bash
# Start Redis (queue system)
brew services start redis

# Backend (port 4000)
cd backend
npm run dev

# Frontend (port 3000)
cd frontend
npm run dev
```

## 📖 Documentation

- **Full Documentation**: See [`datashield/README.md`](./datashield/README.md) for comprehensive guide
- **API Reference**: Backend endpoints and usage examples
- **Contract Details**: Smart contract architecture and functions
- **Deployment Guide**: How to deploy to 0G testnet/mainnet

## 🔗 Links

- **Live Demo**: `TODO_DEPLOY_URL`
- **Smart Contracts**: `TODO_AFTER_DEPLOY`
- **0G Explorer**: `https://chainscan-galileo.0g.ai`
- **GitHub Repository**: `https://github.com/your-org/datashield`

## 🆘 Support

For questions, issues, or contributions:
1. Check the detailed documentation in `datashield/README.md`
2. Open a GitHub issue
3. Join our community Discord channel

---

*Last Updated: April 30, 2026*