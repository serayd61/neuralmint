const {
  makeSTXTokenTransfer,
  makeContractDeploy,
  makeContractCall,
  broadcastTransaction,
  AnchorMode,
  PostConditionMode,
  uintCV,
  stringAsciiCV,
  stringUtf8CV,
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
  const missingNonces = [623, 624, 625, 626, 627, 628];
  
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
      await sleep(1500);
    } catch (e) {
      console.log(`  Error: ${e.message}`);
    }
  }
}

const remainingContracts = [
  {
    name: "nm-pricing-v1",
    code: `(define-map price-history uint (list 100 {price: uint, block: uint}))
(define-map floor-prices (string-ascii 64) uint)
(define-read-only (get-price-history (nft-id uint)) (default-to (list) (map-get? price-history nft-id)))
(define-read-only (get-floor-price (collection (string-ascii 64))) (default-to u0 (map-get? floor-prices collection)))
(define-public (set-floor-price (collection (string-ascii 64)) (price uint))
  (begin
    (map-set floor-prices collection price)
    (ok true)))`
  },
  {
    name: "nm-verification-v1",
    code: `(define-map verified-creators principal bool)
(define-map verified-collections uint bool)
(define-data-var admin principal tx-sender)
(define-read-only (is-verified-creator (creator principal)) (default-to false (map-get? verified-creators creator)))
(define-read-only (is-verified-collection (id uint)) (default-to false (map-get? verified-collections id)))
(define-public (verify-creator (creator principal))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u1))
    (map-set verified-creators creator true)
    (ok true)))
(define-public (verify-collection (id uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u1))
    (map-set verified-collections id true)
    (ok true)))`
  },
  {
    name: "nm-notifications-v1",
    code: `(define-map user-notifications principal (list 50 uint))
(define-map notification-data uint {recipient: principal, message: (string-ascii 100), read: bool, timestamp: uint})
(define-data-var notification-counter uint u0)
(define-read-only (get-notification (id uint)) (map-get? notification-data id))
(define-read-only (get-notification-count) (var-get notification-counter))
(define-public (create-notification (recipient principal) (message (string-ascii 100)))
  (let ((id (var-get notification-counter)))
    (map-set notification-data id {recipient: recipient, message: message, read: false, timestamp: block-height})
    (var-set notification-counter (+ id u1))
    (ok id)))
(define-public (mark-read (id uint))
  (let ((notif (unwrap! (get-notification id) (err u1))))
    (asserts! (is-eq tx-sender (get recipient notif)) (err u2))
    (map-set notification-data id (merge notif {read: true}))
    (ok true)))`
  },
  {
    name: "nm-metadata-v1",
    code: `(define-map nft-metadata uint {name: (string-ascii 64), description: (string-utf8 500), image-uri: (string-ascii 256), attributes: (string-utf8 1000)})
(define-read-only (get-metadata (token-id uint)) (map-get? nft-metadata token-id))
(define-public (set-metadata (token-id uint) (name (string-ascii 64)) (description (string-utf8 500)) (image-uri (string-ascii 256)) (attributes (string-utf8 1000)))
  (begin
    (map-set nft-metadata token-id {name: name, description: description, image-uri: image-uri, attributes: attributes})
    (ok true)))`
  },
  {
    name: "nm-settings-v1",
    code: `(define-map platform-settings (string-ascii 32) uint)
(define-map feature-flags (string-ascii 32) bool)
(define-data-var admin principal tx-sender)
(define-read-only (get-setting (key (string-ascii 32))) (default-to u0 (map-get? platform-settings key)))
(define-read-only (is-feature-enabled (feature (string-ascii 32))) (default-to false (map-get? feature-flags feature)))
(define-public (set-setting (key (string-ascii 32)) (value uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u1))
    (map-set platform-settings key value)
    (ok true)))
(define-public (set-feature (feature (string-ascii 32)) (enabled bool))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err u1))
    (map-set feature-flags feature enabled)
    (ok true)))`
  }
];

async function deployRemainingContracts(startNonce) {
  console.log("\n\nDeploying remaining 5 contracts...\n");
  let nonce = startNonce;
  
  for (const contract of remainingContracts) {
    console.log(`Deploying ${contract.name}...`);
    try {
      const tx = await makeContractDeploy({
        contractName: contract.name,
        codeBody: contract.code,
        senderKey: PRIVATE_KEY,
        network: STACKS_MAINNET,
        anchorMode: AnchorMode.Any,
        fee: 12000,
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

async function moreInteractions(startNonce) {
  console.log("\n\nRunning more interactions...\n");
  let nonce = startNonce;
  
  const ops = [
    { contract: "nm-rewards-v1", fn: "add-rewards", args: [principalCV(ADDRESS), uintCV(2000000)] },
    { contract: "nm-rewards-v1", fn: "set-reward-rate", args: [uintCV(200)] },
    { contract: "nm-staking-v1", fn: "set-min-stake", args: [uintCV(250000)] },
    { contract: "nm-auction-v1", fn: "create-auction", args: [uintCV(50000), uintCV(500)] },
    { contract: "nm-auction-v1", fn: "place-bid", args: [uintCV(1), uintCV(55000)] },
    { contract: "nm-escrow-v1", fn: "create-escrow", args: [principalCV("SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9"), uintCV(75000)] },
    { contract: "nm-royalties-v1", fn: "set-royalty", args: [uintCV(2), uintCV(750)] },
    { contract: "nm-collection-v1", fn: "create-collection", args: [stringAsciiCV("Bitcoin Punks AI")] },
    { contract: "nm-collection-v1", fn: "create-collection", args: [stringAsciiCV("Neon Warriors")] },
    { contract: "nm-whitelist-v1", fn: "create-whitelist", args: [] },
    { contract: "nm-governance-v1", fn: "create-proposal", args: [stringAsciiCV("Add new AI model support"), uintCV(2016)] },
    { contract: "nm-governance-v1", fn: "vote", args: [uintCV(1), boolCV(true)] },
    { contract: "nm-analytics-v1", fn: "record-sale", args: [uintCV(340000000)] },
    { contract: "nm-analytics-v1", fn: "record-sale", args: [uintCV(890000000)] },
    { contract: "nm-badges-v1", fn: "create-badge", args: [stringAsciiCV("Whale"), stringAsciiCV("Purchased over 10 STX worth")] },
    { contract: "nm-referral-v1", fn: "set-bonus", args: [uintCV(1000)] },
    { contract: "nm-favorites-v1", fn: "increment-likes", args: [uintCV(3)] },
    { contract: "nm-favorites-v1", fn: "increment-likes", args: [uintCV(4)] },
    { contract: "nm-offers-v1", fn: "make-offer", args: [uintCV(3), uintCV(300000000), uintCV(432)] },
    { contract: "nm-activity-v1", fn: "log-activity", args: [stringAsciiCV("transfer"), uintCV(2), uintCV(0)] },
    { contract: "nm-activity-v1", fn: "log-activity", args: [stringAsciiCV("burn"), uintCV(3), uintCV(0)] },
    { contract: "nm-collection-v1", fn: "update-floor-price", args: [uintCV(1), uintCV(95000000)] },
    { contract: "nm-rewards-v1", fn: "add-rewards", args: [principalCV("SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9"), uintCV(750000)] },
    { contract: "nm-auction-v1", fn: "create-auction", args: [uintCV(200000), uintCV(1008)] },
    { contract: "nm-escrow-v1", fn: "release-escrow", args: [uintCV(0)] },
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
  
  // Check new nonce
  const response = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${ADDRESS}/nonces`);
  const data = await response.json();
  console.log(`\nCurrent nonce state: ${JSON.stringify(data)}`);
  
  const nextNonce = await deployRemainingContracts(data.possible_next_nonce);
  await sleep(3000);
  await moreInteractions(nextNonce);
}

main().catch(console.error);
