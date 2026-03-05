# NeuralMint - AI-Powered NFT Marketplace on Stacks

> Create stunning NFTs with AI, mint on Stacks L2, trade with 1% fees - all secured by Bitcoin.

**BUIDL Battle #2 Submission** | [Live Demo](https://neuralmint.vercel.app) | [DoraHacks BUIDL](https://dorahacks.io/buidl/40049)

## What is NeuralMint?

NeuralMint is an AI-powered NFT marketplace built on the Stacks blockchain. It combines multiple AI providers (OpenAI DALL-E 3 and self-hosted Stable Diffusion via OpenClaw) with on-chain AI provenance tracking - every NFT stores the AI model, prompt hash, and generation parameters directly in Clarity smart contracts.

**Key Innovation:** On-chain AI provenance with multi-provider support. NeuralMint stores immutable proof of how each NFT was created (AI model, provider, prompt hash, generation params) directly on the Stacks blockchain, anchored to Bitcoin. Users pay a generation fee in STX that goes directly to the platform wallet on-chain.

## Features

- **Multi-AI Provider** - Choose between OpenAI (DALL-E 3) or self-hosted OpenClaw (Stable Diffusion XL)
- **STX Fee Collection** - On-chain payment (2.0 STX for OpenAI, 1.5 STX for OpenClaw) before AI generation
- **AI Studio** - Generate NFT art, enhance prompts with GPT-4o-mini or local LLMs via OpenClaw
- **On-Chain AI Provenance** - Model, provider, prompt hash, and params stored in Clarity
- **SIP-009 Compliant** - Full NFT standard implementation with royalty support (up to 10%)
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
           AI Provider                             Hiro API
          /          \                         (Blockchain Data)
   OpenAI API    OpenClaw (VPS)                      |
   (DALL-E 3)   + Stable Diffusion              Pinata IPFS
                 + Ollama LLM                  (NFT Metadata)
```

## Smart Contracts

All contracts deployed at: `SP387HJN7F2HR9KQ4250YGFCA4815T1F9X7N74C5W`

| Contract | Description | Features |
|----------|-------------|----------|
| `neuralmint-nft` | SIP-009 NFT with AI metadata | Mint, transfer, burn, royalties, AI provenance |
| `neuralmint-marketplace` | Fixed-price marketplace | List, buy, cancel, escrow, 1% fee |
| `neuralmint-auction` | English auction system | Block-height timing, auto-extend, bid refunds |
| `neuralmint-lazy-mint` | Gasless minting | Voucher redemption, payment splitting |
| `sip009-nft-trait` | Standard NFT trait | SIP-009 interface definition |

### AI Provenance Pipeline

```
1. User selects AI provider (OpenAI or OpenClaw)
2. User writes prompt
3. (Optional) Prompt enhanced via GPT-4o-mini or OpenClaw LLM
4. User pays generation fee in STX (wallet popup)
5. Backend verifies payment on-chain via Hiro API
6. AI generates image (DALL-E 3 or Stable Diffusion XL)
7. SHA-256 hash of prompt computed
8. Image + metadata uploaded to IPFS (Pinata)
9. NFT minted on Stacks with:
   - ai-model: "dall-e-3" | "sdxl"
   - prompt-hash: 0x... (32 bytes)
   - generation-params: "{size, style, provider, ...}"
10. Transaction anchored to Bitcoin via PoX
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript 5 |
| Styling | Tailwind CSS v4, Framer Motion |
| State | Zustand, TanStack Query |
| Blockchain | Stacks Connect, @stacks/transactions, Hiro API |
| Smart Contracts | Clarity (SIP-009, custom marketplace) |
| AI (Cloud) | OpenAI (DALL-E 3, GPT-4o-mini) |
| AI (Self-hosted) | OpenClaw, Ollama, Stable Diffusion WebUI (SDXL) |
| Storage | Pinata IPFS |
| Deployment | Vercel |

## Stacks Ecosystem Integration

- **Clarity Smart Contracts** - 5 contracts with auditable on-chain logic
- **stacks.js** - Transaction building, contract calls, hex parsing
- **Stacks Connect** - Wallet authentication (Leather, Xverse)
- **Hiro API** - Real-time blockchain data (balances, NFT holdings, contract reads)
- **STX Transfers** - AI generation fees paid via native STX transfer to platform wallet
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
# Edit .env.local with your API keys
npm run dev
```

Visit `http://localhost:3000`

### Environment Variables

```env
# Required
NEXT_PUBLIC_STACKS_NETWORK=mainnet
NEXT_PUBLIC_PLATFORM_WALLET=SP387HJN7F2HR9KQ4250YGFCA4815T1F9X7N74C5W

# AI: OpenAI (at least one AI provider needed)
OPENAI_API_KEY=sk-...

# AI: OpenClaw + Stable Diffusion (self-hosted alternative)
OPENCLAW_API_URL=http://your-vps-ip:18789
OPENCLAW_API_TOKEN=your-secret-token
OPENCLAW_AGENT_ID=main
STABLE_DIFFUSION_API_URL=http://your-vps-ip:7860

# Storage
PINATA_API_KEY=...
PINATA_SECRET_API_KEY=...
```

See `.env.example` for all available variables.

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

## Self-Hosted AI Setup (OpenClaw + Stable Diffusion)

NeuralMint supports a self-hosted AI option via OpenClaw and Stable Diffusion on your own VPS. This gives users a cheaper alternative (1.5 STX vs 2.0 STX) and removes dependency on cloud AI providers.

### VPS Requirements
- 4+ CPU cores, 8+ GB RAM (16+ GB recommended for SDXL)
- GPU recommended for Stable Diffusion (NVIDIA with 8+ GB VRAM)
- Ubuntu 22.04+ or similar Linux

### 1. Install OpenClaw

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

### 2. Install Ollama (Local LLM for prompt enhancement)

```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama pull deepseek-r1:8b
```

### 3. Configure OpenClaw Gateway

Edit `~/.openclaw/openclaw.json`:

```json
{
  "gateway": {
    "auth": { "mode": "token", "token": "YOUR_SECRET_TOKEN" },
    "http": {
      "endpoints": {
        "chatCompletions": { "enabled": true }
      }
    }
  }
}
```

Start the gateway:

```bash
openclaw gateway --port 18789
```

### 4. Install Stable Diffusion WebUI (Image Generation)

```bash
git clone https://github.com/AUTOMATIC1111/stable-diffusion-webui.git
cd stable-diffusion-webui
# Download SDXL model to models/Stable-diffusion/
./webui.sh --api --listen --port 7860
```

### 5. Set Environment Variables

In your NeuralMint `.env.local`:

```env
OPENCLAW_API_URL=http://your-vps-ip:18789
OPENCLAW_API_TOKEN=YOUR_SECRET_TOKEN
OPENCLAW_AGENT_ID=main
STABLE_DIFFUSION_API_URL=http://your-vps-ip:7860
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/price` | GET | Real-time STX price |
| `/api/v1/providers` | GET | Available AI providers status |
| `/api/v1/stats` | GET | Platform stats (on-chain) |
| `/api/v1/generate` | POST | AI image generation (requires STX payment txId) |
| `/api/v1/enhance-prompt` | POST | AI prompt enhancement (supports provider selection) |
| `/api/v1/upload` | POST | IPFS upload (Pinata) |
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
