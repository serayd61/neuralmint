# NeuralMint - AI-Powered NFT Marketplace on Stacks

> Create stunning NFTs with AI, mint on Stacks L2, trade with 1% fees - all secured by Bitcoin.

**BUIDL Battle #2 Submission** | [Live Demo](https://neuralmint.vercel.app) | [DoraHacks BUIDL](https://dorahacks.io/buidl/40049)

## What is NeuralMint?

NeuralMint is an AI-powered NFT marketplace built on the Stacks blockchain. It combines DALL-E 3 image generation with on-chain AI provenance tracking - every NFT stores the AI model, prompt hash, and generation parameters directly in Clarity smart contracts.

**Key Innovation:** On-chain AI provenance. Unlike other NFT platforms, NeuralMint stores immutable proof of how each NFT was created (AI model, prompt hash, generation params) directly on the Stacks blockchain, anchored to Bitcoin.

## Features

- **AI Studio** - Generate NFT art with DALL-E 3, enhance prompts with GPT-4o
- **On-Chain AI Provenance** - Model, prompt hash, and params stored in Clarity
- **SIP-009 Compliant** - Full NFT standard implementation with royalty support
- **Fixed-Price Marketplace** - List and buy NFTs with 1% platform fee + escrow
- **English Auction** - Block-height based auctions with auto-extend and automatic refunds
- **Lazy Minting** - Gasless NFT creation via voucher redemption
- **IPFS Storage** - Real metadata and image pinning via Pinata
- **Real-Time Data** - Live STX prices from CoinGecko + ALEX, on-chain collection stats from Hiro API
- **Multi-Wallet** - Leather and Xverse wallet support via Stacks Connect

## Architecture

```
User -> Next.js Frontend -> Stacks Connect -> Clarity Smart Contracts -> Stacks L2 -> Bitcoin L1
                |                                       |
           OpenAI API                              Hiro API
           (DALL-E 3)                          (Blockchain Data)
                |
           Pinata IPFS
          (NFT Metadata)
```

## Smart Contracts

All contracts deployed at: `SP2MEAT2GYJF0EXPQKH7A9S3KTNG36RYZAMA74VGJ`

| Contract | Description | Features |
|----------|-------------|----------|
| `neuralmint-nft` | SIP-009 NFT with AI metadata | Mint, transfer, burn, royalties, AI provenance |
| `neuralmint-marketplace` | Fixed-price marketplace | List, buy, cancel, escrow, 1% fee |
| `neuralmint-auction` | English auction system | Block-height timing, auto-extend, bid refunds |
| `neuralmint-lazy-mint` | Gasless minting | Voucher redemption, payment splitting |
| `sip009-nft-trait` | Standard NFT trait | SIP-009 interface definition |

### AI Provenance Pipeline

```
1. User writes prompt
2. (Optional) GPT-4o enhances the prompt
3. DALL-E 3 generates image
4. SHA-256 hash of prompt computed
5. Image + metadata uploaded to IPFS (Pinata)
6. NFT minted on Stacks with:
   - ai-model: "dall-e-3"
   - prompt-hash: 0x... (32 bytes)
   - generation-params: "{size, style, ...}"
7. Transaction anchored to Bitcoin via PoX
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript 5 |
| Styling | Tailwind CSS v4, Framer Motion |
| State | Zustand, TanStack Query |
| Blockchain | Stacks Connect, @stacks/transactions, Hiro API |
| Smart Contracts | Clarity (SIP-009, custom marketplace) |
| AI | OpenAI (DALL-E 3, GPT-4o-mini) |
| Storage | Pinata IPFS |
| Deployment | Vercel |

## Stacks Ecosystem Integration

- **Clarity Smart Contracts** - 5 contracts with auditable on-chain logic
- **stacks.js** - Transaction building, contract calls, hex parsing
- **Stacks Connect** - Wallet authentication (Leather, Xverse)
- **Hiro API** - Real-time blockchain data (balances, NFT holdings, contract reads)
- **Block Height** - Auction timing uses Stacks block height (PoT-aware)
- **SIP-009** - Full NFT standard compliance
- **SIP-016** - Compatible metadata format

## Getting Started

### Prerequisites
- Node.js 18+
- Clarinet (for smart contract development)

### Local Development

```bash
git clone https://github.com/serayd61/neuralmint.git
cd neuralmint
npm install
cp .env.example .env.local
npm run dev
```

Visit `http://localhost:3000`

### Environment Variables

```env
NEXT_PUBLIC_STACKS_NETWORK=mainnet
OPENAI_API_KEY=sk-...              # For AI generation
PINATA_API_KEY=...                 # For IPFS upload
PINATA_SECRET_API_KEY=...          # For IPFS upload
```

### Quality Checks

```bash
npm run check    # typecheck + lint + build
```

### Contract Development

```bash
cd clarity
clarinet check                    # Validate all contracts
clarinet test                     # Run tests
npm run deploy:contracts:testnet  # Deploy to testnet
npm run deploy:contracts:mainnet  # Deploy to mainnet
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/price` | GET | Real-time STX price |
| `/api/v1/stats` | GET | Platform stats (on-chain) |
| `/api/v1/generate` | POST | AI image generation |
| `/api/v1/upload` | POST | IPFS upload (Pinata) |
| `/api/v1/enhance-prompt` | POST | AI prompt enhancement |
| `/api/collections` | GET | Collection data |
| `/api/wallet/[address]` | GET | Wallet NFTs & balance |

## NFT Collections

| Collection | Symbol | Max Supply |
|-----------|--------|-----------|
| Cyber Genesis | CYBER | 1,000 |
| Neural Dreams | DREAM | 500 |
| Bitcoin Punks | BPUNK | 2,100 |
| Stacks Horizon | HORZ | 750 |
| Neon Samurai | NEON | 888 |

## License

MIT
