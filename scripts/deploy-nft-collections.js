const {
  makeContractDeploy,
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  uintCV,
  stringAsciiCV,
  stringUtf8CV,
  principalCV,
  noneCV,
  someCV,
} = require("@stacks/transactions");
const { STACKS_MAINNET } = require("@stacks/network");

const PRIVATE_KEY = "4c664d1c1c36f56063823b6a7cbc8185ab9bcd84d4b291500667bc7ad5e3054b01";
const ADDRESS = "SP2PEBKJ2W1ZDDF2QQ6Y4FXKZEDPT9J9R2NKD9WJB";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 5 NFT Collection contracts for NeuralMint
const collections = [
  {
    name: "neuralmint-cyber-genesis",
    displayName: "Cyber Genesis",
    symbol: "CYBER",
    maxSupply: 1000,
    baseUri: "https://neuralmint.vercel.app/api/metadata/cyber-genesis/",
  },
  {
    name: "neuralmint-neural-dreams",
    displayName: "Neural Dreams",
    symbol: "DREAM",
    maxSupply: 500,
    baseUri: "https://neuralmint.vercel.app/api/metadata/neural-dreams/",
  },
  {
    name: "neuralmint-bitcoin-punks",
    displayName: "Bitcoin Punks",
    symbol: "BPUNK",
    maxSupply: 2100,
    baseUri: "https://neuralmint.vercel.app/api/metadata/bitcoin-punks/",
  },
  {
    name: "neuralmint-stacks-horizon",
    displayName: "Stacks Horizon",
    symbol: "HORZ",
    maxSupply: 750,
    baseUri: "https://neuralmint.vercel.app/api/metadata/stacks-horizon/",
  },
  {
    name: "neuralmint-neon-samurai",
    displayName: "Neon Samurai",
    symbol: "NEON",
    maxSupply: 888,
    baseUri: "https://neuralmint.vercel.app/api/metadata/neon-samurai/",
  },
];

function generateNFTContract(collection) {
  return `
;; ${collection.displayName} - NeuralMint NFT Collection
;; SIP-009 Compliant NFT Contract

(impl-trait 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait.nft-trait)

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u401))
(define-constant ERR-NOT-FOUND (err u404))
(define-constant ERR-SOLD-OUT (err u500))
(define-constant ERR-WRONG-PRICE (err u501))

(define-constant COLLECTION-NAME "${collection.displayName}")
(define-constant COLLECTION-SYMBOL "${collection.symbol}")
(define-constant MAX-SUPPLY u${collection.maxSupply})
(define-constant MINT-PRICE u1000000) ;; 1 STX

(define-non-fungible-token ${collection.symbol.toLowerCase()} uint)

(define-data-var last-token-id uint u0)
(define-data-var base-uri (string-ascii 200) "${collection.baseUri}")
(define-data-var paused bool false)

(define-map token-uris uint (string-ascii 256))

;; SIP-009 Functions
(define-read-only (get-last-token-id)
  (ok (var-get last-token-id)))

(define-read-only (get-token-uri (token-id uint))
  (ok (some (concat (var-get base-uri) (int-to-ascii token-id)))))

(define-read-only (get-owner (token-id uint))
  (ok (nft-get-owner? ${collection.symbol.toLowerCase()} token-id)))

(define-public (transfer (token-id uint) (sender principal) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender sender) ERR-NOT-AUTHORIZED)
    (nft-transfer? ${collection.symbol.toLowerCase()} token-id sender recipient)))

;; Mint Functions
(define-public (mint (recipient principal))
  (let ((token-id (+ (var-get last-token-id) u1)))
    (asserts! (not (var-get paused)) ERR-NOT-AUTHORIZED)
    (asserts! (<= token-id MAX-SUPPLY) ERR-SOLD-OUT)
    (try! (nft-mint? ${collection.symbol.toLowerCase()} token-id recipient))
    (var-set last-token-id token-id)
    (ok token-id)))

(define-public (mint-many (recipients (list 10 principal)))
  (ok (map mint recipients)))

;; Admin Functions
(define-public (set-base-uri (new-uri (string-ascii 200)))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (var-set base-uri new-uri)
    (ok true)))

(define-public (toggle-pause)
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (var-set paused (not (var-get paused)))
    (ok (var-get paused))))

;; Read-only helpers
(define-read-only (get-collection-info)
  {
    name: COLLECTION-NAME,
    symbol: COLLECTION-SYMBOL,
    max-supply: MAX-SUPPLY,
    minted: (var-get last-token-id),
    base-uri: (var-get base-uri),
    paused: (var-get paused)
  })

(define-read-only (get-mint-price)
  (ok MINT-PRICE))
`;
}

async function main() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║  NEURALMINT - DEPLOY NFT COLLECTIONS                       ║");
  console.log("║  Budget: 0.5 STX                                           ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  const nonceRes = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${ADDRESS}/nonces`);
  const nonceData = await nonceRes.json();
  let nonce = nonceData.possible_next_nonce;

  const balRes = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${ADDRESS}/balances`);
  const balData = await balRes.json();
  const initialBalance = parseInt(balData.stx.balance) / 1000000;

  console.log(`Starting nonce: ${nonce}`);
  console.log(`Initial balance: ${initialBalance.toFixed(4)} STX\n`);

  let deployed = 0;
  let minted = 0;
  const deployedContracts = [];

  // Deploy 5 NFT collection contracts
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  DEPLOYING NFT COLLECTIONS");
  console.log("═══════════════════════════════════════════════════════════\n");

  for (const collection of collections) {
    console.log(`Deploying ${collection.displayName} (${collection.name})...`);
    const contractCode = generateNFTContract(collection);
    
    try {
      const tx = await makeContractDeploy({
        contractName: collection.name,
        codeBody: contractCode,
        senderKey: PRIVATE_KEY,
        network: STACKS_MAINNET,
        anchorMode: AnchorMode.Any,
        fee: 25000, // 0.025 STX per contract
        nonce: nonce,
      });
      
      const result = await broadcastTransaction({ transaction: tx, network: STACKS_MAINNET });
      
      if (result.error) {
        console.log(`  ❌ ${result.reason || result.error}`);
      } else {
        console.log(`  ✅ TX: ${result.txid.slice(0, 20)}...`);
        deployed++;
        deployedContracts.push(collection.name);
      }
      nonce++;
      await sleep(800);
    } catch (e) {
      console.log(`  ❌ ${e.message}`);
      nonce++;
    }
  }

  console.log(`\nDeployed: ${deployed}/${collections.length} collections`);
  console.log("\nWaiting for contracts to propagate...");
  await sleep(5000);

  // Mint NFTs from each collection
  console.log("\n═══════════════════════════════════════════════════════════");
  console.log("  MINTING NFTs");
  console.log("═══════════════════════════════════════════════════════════\n");

  for (const contractName of deployedContracts) {
    // Mint 3 NFTs per collection
    for (let i = 0; i < 3; i++) {
      console.log(`Minting from ${contractName} (#${i + 1})...`);
      try {
        const tx = await makeContractCall({
          contractAddress: ADDRESS,
          contractName: contractName,
          functionName: "mint",
          functionArgs: [principalCV(ADDRESS)],
          senderKey: PRIVATE_KEY,
          network: STACKS_MAINNET,
          anchorMode: AnchorMode.Any,
          postConditionMode: PostConditionMode.Allow,
          fee: 3000,
          nonce: nonce,
        });
        
        const result = await broadcastTransaction({ transaction: tx, network: STACKS_MAINNET });
        
        if (result.error) {
          console.log(`  ❌ ${result.reason || result.error}`);
        } else {
          console.log(`  ✅ TX: ${result.txid.slice(0, 20)}...`);
          minted++;
        }
        nonce++;
        await sleep(600);
      } catch (e) {
        console.log(`  ❌ ${e.message}`);
        nonce++;
      }
    }
  }

  // Final stats
  await sleep(2000);
  const finalBalRes = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${ADDRESS}/balances`);
  const finalBalData = await finalBalRes.json();
  const finalBalance = parseInt(finalBalData.stx.balance) / 1000000;

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║                      SUMMARY                               ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");
  console.log(`Collections deployed: ${deployed}/${collections.length}`);
  console.log(`NFTs minted: ${minted}`);
  console.log(`\nDeployed contracts:`);
  deployedContracts.forEach(c => console.log(`  - ${c}`));
  console.log(`\nInitial balance: ${initialBalance.toFixed(4)} STX`);
  console.log(`Final balance: ${finalBalance.toFixed(4)} STX`);
  console.log(`Total spent: ${(initialBalance - finalBalance).toFixed(4)} STX`);
}

main().catch(console.error);
