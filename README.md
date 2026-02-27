# NeuralMint

NeuralMint, Stacks üzerinde çalışan AI destekli NFT marketplace uygulamasıdır.

## Tech Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS v4 + Framer Motion
- Zustand + TanStack Query
- Stacks Connect / Stacks transactions
- Vercel deploy hedefi
- Clarity contract workspace (`clarity/`)

## Local Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Uygulama: `http://localhost:3000`

## Production Readiness Checks

```bash
npm run check
```

Bu komut:

- typecheck
- lint
- production build

adımlarını birlikte çalıştırır.

## API Endpoints

- `GET /api/health` : canlılık kontrolü
- `GET /api/v1/stats` : platform istatistikleri (şimdilik mock-data tabanlı)

## Vercel Deploy

1. Repository'yi GitHub'a push et.
2. Vercel'de **New Project** ile bu repo'yu bağla.
3. Build ayarları:
   - Framework: `Next.js`
   - Build command: `npm run build`
   - Install command: `npm install`
4. Vercel Environment Variables ekranına `.env.example` içindeki değişkenleri gir.
5. Deploy et.

Deploy sonrası hızlı kontrol:

- `https://<your-domain>/api/health`
- `https://<your-domain>/api/v1/stats`

## Clarity Contracts (Deploy Prep)

Contract workspace: `clarity/`

### Dosyalar

- `clarity/contracts/sip009-nft-trait.clar`
- `clarity/contracts/neuralmint-nft.clar`
- `clarity/contracts/neuralmint-marketplace.clar`
- `clarity/contracts/neuralmint-lazy-mint.clar`
- `clarity/settings/Testnet.toml`
- `clarity/settings/Mainnet.toml`

### Kurulum

Önce Clarinet kur:

- Docs: https://github.com/hirosystems/clarinet

### Testnet Deploy

```bash
cd clarity
clarinet check
clarinet deployments apply --network testnet --deployment-plan settings/Testnet.toml
```

### Mainnet Deploy

```bash
cd clarity
clarinet check
clarinet deployments apply --network mainnet --deployment-plan settings/Mainnet.toml
```

### Private Key ile Otomatik Deploy (Önerilen)

Mnemonic yerine private key kullanmak için:

1. `.env.local` içine sadece lokal makinede ekle:

```bash
STACKS_DEPLOYER_KEY=your_private_key_here
```

2. Testnet deploy:

```bash
npm run deploy:contracts:testnet
```

3. Mainnet deploy:

```bash
npm run deploy:contracts:mainnet
```

Script, kontratları sırayla yayınlar ve her tx onayını bekler.

## Dikkat Edilecekler

- `STACKS_DEPLOYER_KEY` ve mnemonic değerlerini repo'ya commit etme.
- `.env*` dosyaları `.gitignore` ile korunuyor.
- Mainnet deploy öncesi contract audit önerilir.
