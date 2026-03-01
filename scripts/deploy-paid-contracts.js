const {
  makeContractDeploy,
  broadcastTransaction,
  AnchorMode,
} = require("@stacks/transactions");
const { STACKS_MAINNET } = require("@stacks/network");
const fs = require("fs");

const PRIVATE_KEY = process.env.STACKS_PRIVATE_KEY;
const ADDRESS = "SP2PEBKJ2W1ZDDF2QQ6Y4FXKZEDPT9J9R2NKD9WJB";
const HIRO_API = "https://api.mainnet.hiro.so";

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getNonce() {
  const res = await fetch(`${HIRO_API}/extended/v1/address/${ADDRESS}/nonces`);
  const data = await res.json();
  return data.possible_next_nonce;
}

// Paid NFT Collection Contract
const PAID_NFT_CONTRACT = `
;; NeuralMint Premium Collection - 5 STX per mint
(impl-trait 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait.nft-trait)

(define-constant CONTRACT-OWNER tx-sender)
(define-constant PLATFORM-WALLET 'SP2PEBKJ2W1ZDDF2QQ6Y4FXKZEDPT9J9R2NKD9WJB)
(define-constant MINT-PRICE u5000000)

(define-constant ERR-NOT-AUTHORIZED (err u401))
(define-constant ERR-NOT-FOUND (err u404))
(define-constant ERR-SOLD-OUT (err u500))

(define-constant COLLECTION-NAME "NeuralMint Premium")
(define-constant COLLECTION-SYMBOL "NMPREM")
(define-constant MAX-SUPPLY u500)

(define-non-fungible-token neuralmint-premium uint)

(define-data-var last-token-id uint u0)
(define-data-var base-uri (string-ascii 200) "https://neuralmint.vercel.app/api/metadata/premium/")
(define-data-var total-revenue uint u0)

(define-read-only (get-last-token-id)
  (ok (var-get last-token-id)))

(define-read-only (get-token-uri (token-id uint))
  (ok (some (concat (var-get base-uri) (int-to-ascii token-id)))))

(define-read-only (get-owner (token-id uint))
  (ok (nft-get-owner? neuralmint-premium token-id)))

(define-read-only (get-mint-price)
  MINT-PRICE)

(define-read-only (get-collection-info)
  {name: COLLECTION-NAME, symbol: COLLECTION-SYMBOL, max-supply: MAX-SUPPLY, minted: (var-get last-token-id), mint-price: MINT-PRICE, total-revenue: (var-get total-revenue)})

(define-public (transfer (token-id uint) (sender principal) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender sender) ERR-NOT-AUTHORIZED)
    (nft-transfer? neuralmint-premium token-id sender recipient)))

(define-public (mint (recipient principal))
  (let ((token-id (+ (var-get last-token-id) u1)))
    (asserts! (<= token-id MAX-SUPPLY) ERR-SOLD-OUT)
    (try! (stx-transfer? MINT-PRICE tx-sender PLATFORM-WALLET))
    (try! (nft-mint? neuralmint-premium token-id recipient))
    (var-set last-token-id token-id)
    (var-set total-revenue (+ (var-get total-revenue) MINT-PRICE))
    (ok token-id)))

(define-public (mint-free (recipient principal))
  (let ((token-id (+ (var-get last-token-id) u1)))
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (asserts! (<= token-id MAX-SUPPLY) ERR-SOLD-OUT)
    (try! (nft-mint? neuralmint-premium token-id recipient))
    (var-set last-token-id token-id)
    (ok token-id)))
`;

async function main() {
  if (!PRIVATE_KEY) {
    console.error("STACKS_PRIVATE_KEY not set");
    process.exit(1);
  }

  console.log("🚀 Deploying NeuralMint Premium Collection (5 STX per mint)...\n");

  let nonce = await getNonce();
  console.log(`Starting nonce: ${nonce}`);

  try {
    const tx = await makeContractDeploy({
      contractName: "neuralmint-premium-v1",
      codeBody: PAID_NFT_CONTRACT,
      senderKey: PRIVATE_KEY,
      network: STACKS_MAINNET,
      anchorMode: AnchorMode.Any,
      fee: 50000,
      nonce: nonce,
    });

    const result = await broadcastTransaction({ transaction: tx, network: STACKS_MAINNET });
    
    if (result.error) {
      console.error("❌ Deploy failed:", result.error, result.reason);
    } else {
      console.log("✅ Contract deployed!");
      console.log(`   TX: ${result.txid}`);
      console.log(`   Contract: ${ADDRESS}.neuralmint-premium-v1`);
      console.log(`   Mint Price: 5 STX`);
      console.log(`   Max Supply: 500`);
      console.log(`   Fee Wallet: ${ADDRESS}`);
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main();
