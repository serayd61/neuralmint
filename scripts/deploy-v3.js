const {
  makeSTXTokenTransfer,
  makeContractDeploy,
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  uintCV,
  stringAsciiCV,
  principalCV,
  boolCV,
} = require("@stacks/transactions");
const { STACKS_MAINNET } = require("@stacks/network");

const PRIVATE_KEY = "4c664d1c1c36f56063823b6a7cbc8185ab9bcd84d4b291500667bc7ad5e3054b01";
const ADDRESS = "SP2PEBKJ2W1ZDDF2QQ6Y4FXKZEDPT9J9R2NKD9WJB";
const BURN_ADDRESS = "SP000000000000000000002Q6VF78";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fillMissingNonces() {
  console.log("Filling missing nonces...\n");
  const missingNonces = [668, 669, 670, 671, 672, 673, 674, 675, 676, 677, 678];
  
  for (const nonce of missingNonces) {
    console.log(`Filling nonce ${nonce}...`);
    try {
      const tx = await makeSTXTokenTransfer({
        recipient: BURN_ADDRESS,
        amount: 1n,
        senderKey: PRIVATE_KEY,
        network: STACKS_MAINNET,
        anchorMode: AnchorMode.Any,
        fee: 2000,
        nonce: nonce,
      });
      const result = await broadcastTransaction({ transaction: tx, network: STACKS_MAINNET });
      console.log(`  TX: ${result.txid}`);
      await sleep(1200);
    } catch (e) {
      console.log(`  Error: ${e.message}`);
    }
  }
}

const v3Contracts = [
  {
    name: "nm-notifications-v3",
    code: `(define-map notification-data uint {recipient: principal, message: (string-ascii 100), read: bool, timestamp: uint})
(define-data-var notification-counter uint u0)
(define-read-only (get-notification (id uint)) (map-get? notification-data id))
(define-read-only (get-notification-count) (var-get notification-counter))
(define-public (create-notification (recipient principal) (message (string-ascii 100)))
  (let ((id (var-get notification-counter)))
    (map-set notification-data id {recipient: recipient, message: message, read: false, timestamp: block-height})
    (var-set notification-counter (+ id u1))
    (ok id)))`
  },
  {
    name: "nm-activity-v3",
    code: `(define-map activities uint {actor: principal, action: (string-ascii 20), nft-id: uint, amount: uint, timestamp: uint})
(define-data-var activity-counter uint u0)
(define-read-only (get-activity (id uint)) (map-get? activities id))
(define-read-only (get-activity-count) (var-get activity-counter))
(define-public (log-activity (action (string-ascii 20)) (nft-id uint) (amount uint))
  (let ((id (var-get activity-counter)))
    (map-set activities id {actor: tx-sender, action: action, nft-id: nft-id, amount: amount, timestamp: block-height})
    (var-set activity-counter (+ id u1))
    (ok id)))`
  },
  {
    name: "nm-offers-v3",
    code: `(define-map offers uint {nft-id: uint, offerer: principal, amount: uint, expiry: uint, accepted: bool})
(define-data-var offer-counter uint u0)
(define-read-only (get-offer (id uint)) (map-get? offers id))
(define-read-only (get-offer-count) (var-get offer-counter))
(define-public (make-offer (nft-id uint) (amount uint) (duration uint))
  (let ((id (var-get offer-counter)))
    (map-set offers id {nft-id: nft-id, offerer: tx-sender, amount: amount, expiry: (+ block-height duration), accepted: false})
    (var-set offer-counter (+ id u1))
    (ok id)))`
  },
  {
    name: "nm-analytics-v3",
    code: `(define-map daily-volume uint uint)
(define-map daily-sales uint uint)
(define-data-var total-volume uint u0)
(define-data-var total-sales uint u0)
(define-read-only (get-daily-volume (day uint)) (default-to u0 (map-get? daily-volume day)))
(define-read-only (get-totals) {volume: (var-get total-volume), sales: (var-get total-sales)})
(define-public (record-sale (amount uint))
  (let ((day (/ block-height u144)))
    (map-set daily-volume day (+ (get-daily-volume day) amount))
    (var-set total-volume (+ (var-get total-volume) amount))
    (var-set total-sales (+ (var-get total-sales) u1))
    (ok true)))`
  },
  {
    name: "nm-governance-v3",
    code: `(define-map proposals uint {title: (string-ascii 100), creator: principal, yes-votes: uint, no-votes: uint, end-block: uint})
(define-data-var proposal-counter uint u0)
(define-read-only (get-proposal (id uint)) (map-get? proposals id))
(define-read-only (get-proposal-count) (var-get proposal-counter))
(define-public (create-proposal (title (string-ascii 100)) (duration uint))
  (let ((id (var-get proposal-counter)))
    (map-set proposals id {title: title, creator: tx-sender, yes-votes: u0, no-votes: u0, end-block: (+ block-height duration)})
    (var-set proposal-counter (+ id u1))
    (ok id)))`
  },
  {
    name: "nm-auction-v3",
    code: `(define-map auctions uint {seller: principal, min-bid: uint, end-block: uint, highest-bid: uint})
(define-data-var auction-counter uint u0)
(define-read-only (get-auction (id uint)) (map-get? auctions id))
(define-read-only (get-auction-count) (var-get auction-counter))
(define-public (create-auction (min-bid uint) (duration uint))
  (let ((id (var-get auction-counter)))
    (map-set auctions id {seller: tx-sender, min-bid: min-bid, end-block: (+ block-height duration), highest-bid: u0})
    (var-set auction-counter (+ id u1))
    (ok id)))`
  },
  {
    name: "nm-staking-v3",
    code: `(define-map staked-amounts principal uint)
(define-data-var total-staked uint u0)
(define-data-var min-stake uint u1000000)
(define-read-only (get-staked (user principal)) (default-to u0 (map-get? staked-amounts user)))
(define-read-only (get-total-staked) (var-get total-staked))
(define-public (stake (amount uint))
  (begin
    (asserts! (>= amount (var-get min-stake)) (err u1))
    (map-set staked-amounts tx-sender (+ (get-staked tx-sender) amount))
    (var-set total-staked (+ (var-get total-staked) amount))
    (ok true)))`
  }
];

async function deployV3Contracts(startNonce) {
  console.log("\n\nDeploying v3 contracts...\n");
  let nonce = startNonce;
  
  for (const contract of v3Contracts) {
    console.log(`Deploying ${contract.name}...`);
    try {
      const tx = await makeContractDeploy({
        contractName: contract.name,
        codeBody: contract.code,
        senderKey: PRIVATE_KEY,
        network: STACKS_MAINNET,
        anchorMode: AnchorMode.Any,
        fee: 10000,
        nonce: nonce,
      });
      const result = await broadcastTransaction({ transaction: tx, network: STACKS_MAINNET });
      console.log(`  TX: ${result.txid}`);
      nonce++;
      await sleep(2000);
    } catch (e) {
      console.log(`  Error: ${e.message}`);
    }
  }
  return nonce;
}

async function v3Interactions(startNonce) {
  console.log("\n\nRunning v3 interactions...\n");
  let nonce = startNonce;
  
  const ops = [
    { contract: "nm-notifications-v3", fn: "create-notification", args: [principalCV(ADDRESS), stringAsciiCV("Platform launched!")] },
    { contract: "nm-activity-v3", fn: "log-activity", args: [stringAsciiCV("mint"), uintCV(1), uintCV(0)] },
    { contract: "nm-activity-v3", fn: "log-activity", args: [stringAsciiCV("list"), uintCV(1), uintCV(250000000)] },
    { contract: "nm-offers-v3", fn: "make-offer", args: [uintCV(1), uintCV(200000000), uintCV(144)] },
    { contract: "nm-analytics-v3", fn: "record-sale", args: [uintCV(250000000)] },
    { contract: "nm-governance-v3", fn: "create-proposal", args: [stringAsciiCV("Enable staking rewards"), uintCV(1008)] },
    { contract: "nm-auction-v3", fn: "create-auction", args: [uintCV(100000), uintCV(1008)] },
    { contract: "nm-staking-v3", fn: "stake", args: [uintCV(1000000)] },
    { contract: "nm-rewards-v1", fn: "add-rewards", args: [principalCV(ADDRESS), uintCV(5000000)] },
    { contract: "nm-collection-v1", fn: "create-collection", args: [stringAsciiCV("Digital Flora")] },
    { contract: "nm-badges-v1", fn: "create-badge", args: [stringAsciiCV("OG Member"), stringAsciiCV("Early platform supporter")] },
  ];

  for (const op of ops) {
    console.log(`Calling ${op.contract}.${op.fn}...`);
    try {
      const tx = await makeContractCall({
        contractAddress: ADDRESS,
        contractName: op.contract,
        functionName: op.fn,
        functionArgs: op.args,
        senderKey: PRIVATE_KEY,
        network: STACKS_MAINNET,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
        fee: 4000,
        nonce: nonce,
      });
      const result = await broadcastTransaction({ transaction: tx, network: STACKS_MAINNET });
      console.log(`  TX: ${result.txid}`);
      nonce++;
      await sleep(1500);
    } catch (e) {
      console.log(`  Error: ${e.message}`);
    }
  }
  
  console.log(`\nFinal nonce: ${nonce}`);
}

async function main() {
  await fillMissingNonces();
  await sleep(3000);
  
  const response = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${ADDRESS}/nonces`);
  const data = await response.json();
  console.log(`\nCurrent nonce state: ${JSON.stringify(data)}`);
  
  const nextNonce = await deployV3Contracts(data.possible_next_nonce);
  await sleep(3000);
  await v3Interactions(nextNonce);
}

main().catch(console.error);
