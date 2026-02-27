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
  bufferCV,
  boolCV,
  listCV,
} = require("@stacks/transactions");
const { STACKS_MAINNET } = require("@stacks/network");

const PRIVATE_KEY = "4c664d1c1c36f56063823b6a7cbc8185ab9bcd84d4b291500667bc7ad5e3054b01";
const ADDRESS = "SP2PEBKJ2W1ZDDF2QQ6Y4FXKZEDPT9J9R2NKD9WJB";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const contracts = [
  {
    name: "nm-token-v1",
    code: `(define-fungible-token neuralmint-token)
(define-data-var token-name (string-ascii 32) "NeuralMint Token")
(define-data-var token-symbol (string-ascii 10) "NMT")
(define-data-var token-decimals uint u6)
(define-data-var token-uri (optional (string-utf8 256)) (some u"https://neuralmint.app/token"))
(define-read-only (get-name) (ok (var-get token-name)))
(define-read-only (get-symbol) (ok (var-get token-symbol)))
(define-read-only (get-decimals) (ok (var-get token-decimals)))
(define-read-only (get-balance (account principal)) (ok (ft-get-balance neuralmint-token account)))
(define-read-only (get-total-supply) (ok (ft-get-supply neuralmint-token)))
(define-read-only (get-token-uri) (ok (var-get token-uri)))
(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34))))
  (begin
    (asserts! (is-eq tx-sender sender) (err u1))
    (ft-transfer? neuralmint-token amount sender recipient)))
(define-public (mint (amount uint) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender contract-caller) (err u2))
    (ft-mint? neuralmint-token amount recipient)))`
  },
  {
    name: "nm-rewards-v1",
    code: `(define-map user-rewards principal uint)
(define-map reward-claims principal uint)
(define-data-var total-distributed uint u0)
(define-data-var reward-rate uint u100)
(define-read-only (get-user-rewards (user principal)) (default-to u0 (map-get? user-rewards user)))
(define-read-only (get-total-distributed) (var-get total-distributed))
(define-public (add-rewards (user principal) (amount uint))
  (begin
    (map-set user-rewards user (+ (get-user-rewards user) amount))
    (var-set total-distributed (+ (var-get total-distributed) amount))
    (ok true)))
(define-public (set-reward-rate (rate uint))
  (begin (var-set reward-rate rate) (ok true)))`
  },
  {
    name: "nm-staking-v1",
    code: `(define-map staked-amounts principal uint)
(define-map stake-timestamps principal uint)
(define-data-var total-staked uint u0)
(define-data-var min-stake uint u1000000)
(define-read-only (get-staked (user principal)) (default-to u0 (map-get? staked-amounts user)))
(define-read-only (get-total-staked) (var-get total-staked))
(define-read-only (get-stake-time (user principal)) (default-to u0 (map-get? stake-timestamps user)))
(define-public (stake (amount uint))
  (begin
    (asserts! (>= amount (var-get min-stake)) (err u1))
    (map-set staked-amounts tx-sender (+ (get-staked tx-sender) amount))
    (map-set stake-timestamps tx-sender block-height)
    (var-set total-staked (+ (var-get total-staked) amount))
    (ok true)))
(define-public (set-min-stake (amount uint))
  (begin (var-set min-stake amount) (ok true)))`
  },
  {
    name: "nm-auction-v1",
    code: `(define-map auctions uint {seller: principal, min-bid: uint, end-block: uint, highest-bid: uint, highest-bidder: (optional principal)})
(define-data-var auction-counter uint u0)
(define-read-only (get-auction (id uint)) (map-get? auctions id))
(define-read-only (get-auction-count) (var-get auction-counter))
(define-public (create-auction (min-bid uint) (duration uint))
  (let ((id (var-get auction-counter)))
    (map-set auctions id {seller: tx-sender, min-bid: min-bid, end-block: (+ block-height duration), highest-bid: u0, highest-bidder: none})
    (var-set auction-counter (+ id u1))
    (ok id)))
(define-public (place-bid (auction-id uint) (bid-amount uint))
  (let ((auction (unwrap! (get-auction auction-id) (err u1))))
    (asserts! (< block-height (get end-block auction)) (err u2))
    (asserts! (> bid-amount (get highest-bid auction)) (err u3))
    (map-set auctions auction-id (merge auction {highest-bid: bid-amount, highest-bidder: (some tx-sender)}))
    (ok true)))`
  },
  {
    name: "nm-escrow-v1",
    code: `(define-map escrows uint {buyer: principal, seller: principal, amount: uint, released: bool})
(define-data-var escrow-counter uint u0)
(define-read-only (get-escrow (id uint)) (map-get? escrows id))
(define-read-only (get-escrow-count) (var-get escrow-counter))
(define-public (create-escrow (seller principal) (amount uint))
  (let ((id (var-get escrow-counter)))
    (map-set escrows id {buyer: tx-sender, seller: seller, amount: amount, released: false})
    (var-set escrow-counter (+ id u1))
    (ok id)))
(define-public (release-escrow (id uint))
  (let ((escrow (unwrap! (get-escrow id) (err u1))))
    (asserts! (is-eq tx-sender (get buyer escrow)) (err u2))
    (map-set escrows id (merge escrow {released: true}))
    (ok true)))`
  },
  {
    name: "nm-royalties-v1",
    code: `(define-map royalty-info uint {creator: principal, percentage: uint})
(define-data-var platform-fee uint u250)
(define-read-only (get-royalty (token-id uint)) (map-get? royalty-info token-id))
(define-read-only (get-platform-fee) (var-get platform-fee))
(define-public (set-royalty (token-id uint) (percentage uint))
  (begin
    (asserts! (<= percentage u1000) (err u1))
    (map-set royalty-info token-id {creator: tx-sender, percentage: percentage})
    (ok true)))
(define-public (set-platform-fee (fee uint))
  (begin
    (asserts! (<= fee u500) (err u2))
    (var-set platform-fee fee)
    (ok true)))`
  },
  {
    name: "nm-collection-v1",
    code: `(define-map collections uint {name: (string-ascii 64), creator: principal, item-count: uint, floor-price: uint})
(define-data-var collection-counter uint u0)
(define-read-only (get-collection (id uint)) (map-get? collections id))
(define-read-only (get-collection-count) (var-get collection-counter))
(define-public (create-collection (name (string-ascii 64)))
  (let ((id (var-get collection-counter)))
    (map-set collections id {name: name, creator: tx-sender, item-count: u0, floor-price: u0})
    (var-set collection-counter (+ id u1))
    (ok id)))
(define-public (update-floor-price (id uint) (price uint))
  (let ((col (unwrap! (get-collection id) (err u1))))
    (asserts! (is-eq tx-sender (get creator col)) (err u2))
    (map-set collections id (merge col {floor-price: price}))
    (ok true)))`
  },
  {
    name: "nm-whitelist-v1",
    code: `(define-map whitelists uint (list 100 principal))
(define-map whitelist-enabled uint bool)
(define-data-var whitelist-counter uint u0)
(define-read-only (get-whitelist (id uint)) (map-get? whitelists id))
(define-read-only (is-enabled (id uint)) (default-to false (map-get? whitelist-enabled id)))
(define-public (create-whitelist)
  (let ((id (var-get whitelist-counter)))
    (map-set whitelists id (list))
    (map-set whitelist-enabled id true)
    (var-set whitelist-counter (+ id u1))
    (ok id)))
(define-public (toggle-whitelist (id uint) (enabled bool))
  (begin
    (map-set whitelist-enabled id enabled)
    (ok true)))`
  },
  {
    name: "nm-governance-v1",
    code: `(define-map proposals uint {title: (string-ascii 100), creator: principal, yes-votes: uint, no-votes: uint, end-block: uint, executed: bool})
(define-map votes {proposal-id: uint, voter: principal} bool)
(define-data-var proposal-counter uint u0)
(define-read-only (get-proposal (id uint)) (map-get? proposals id))
(define-read-only (get-proposal-count) (var-get proposal-counter))
(define-public (create-proposal (title (string-ascii 100)) (duration uint))
  (let ((id (var-get proposal-counter)))
    (map-set proposals id {title: title, creator: tx-sender, yes-votes: u0, no-votes: u0, end-block: (+ block-height duration), executed: false})
    (var-set proposal-counter (+ id u1))
    (ok id)))
(define-public (vote (proposal-id uint) (vote-yes bool))
  (let ((prop (unwrap! (get-proposal proposal-id) (err u1))))
    (asserts! (< block-height (get end-block prop)) (err u2))
    (asserts! (is-none (map-get? votes {proposal-id: proposal-id, voter: tx-sender})) (err u3))
    (map-set votes {proposal-id: proposal-id, voter: tx-sender} vote-yes)
    (if vote-yes
      (map-set proposals proposal-id (merge prop {yes-votes: (+ (get yes-votes prop) u1)}))
      (map-set proposals proposal-id (merge prop {no-votes: (+ (get no-votes prop) u1)})))
    (ok true)))`
  },
  {
    name: "nm-analytics-v1",
    code: `(define-map daily-volume uint uint)
(define-map daily-sales uint uint)
(define-map user-stats principal {total-bought: uint, total-sold: uint, volume: uint})
(define-data-var total-volume uint u0)
(define-data-var total-sales uint u0)
(define-read-only (get-daily-volume (day uint)) (default-to u0 (map-get? daily-volume day)))
(define-read-only (get-daily-sales (day uint)) (default-to u0 (map-get? daily-sales day)))
(define-read-only (get-user-stats (user principal)) (map-get? user-stats user))
(define-read-only (get-totals) {volume: (var-get total-volume), sales: (var-get total-sales)})
(define-public (record-sale (amount uint))
  (let ((day (/ block-height u144)))
    (map-set daily-volume day (+ (get-daily-volume day) amount))
    (map-set daily-sales day (+ (get-daily-sales day) u1))
    (var-set total-volume (+ (var-get total-volume) amount))
    (var-set total-sales (+ (var-get total-sales) u1))
    (ok true)))`
  },
  {
    name: "nm-badges-v1",
    code: `(define-map user-badges principal (list 20 uint))
(define-map badge-info uint {name: (string-ascii 32), description: (string-ascii 100)})
(define-data-var badge-counter uint u0)
(define-read-only (get-user-badges (user principal)) (default-to (list) (map-get? user-badges user)))
(define-read-only (get-badge (id uint)) (map-get? badge-info id))
(define-public (create-badge (name (string-ascii 32)) (description (string-ascii 100)))
  (let ((id (var-get badge-counter)))
    (map-set badge-info id {name: name, description: description})
    (var-set badge-counter (+ id u1))
    (ok id)))`
  },
  {
    name: "nm-referral-v1",
    code: `(define-map referrals principal principal)
(define-map referral-counts principal uint)
(define-map referral-earnings principal uint)
(define-data-var referral-bonus uint u500)
(define-read-only (get-referrer (user principal)) (map-get? referrals user))
(define-read-only (get-referral-count (user principal)) (default-to u0 (map-get? referral-counts user)))
(define-read-only (get-earnings (user principal)) (default-to u0 (map-get? referral-earnings user)))
(define-public (set-referrer (referrer principal))
  (begin
    (asserts! (is-none (get-referrer tx-sender)) (err u1))
    (asserts! (not (is-eq tx-sender referrer)) (err u2))
    (map-set referrals tx-sender referrer)
    (map-set referral-counts referrer (+ (get-referral-count referrer) u1))
    (ok true)))
(define-public (set-bonus (bonus uint))
  (begin (var-set referral-bonus bonus) (ok true)))`
  },
  {
    name: "nm-favorites-v1",
    code: `(define-map user-favorites principal (list 50 uint))
(define-map nft-like-count uint uint)
(define-read-only (get-favorites (user principal)) (default-to (list) (map-get? user-favorites user)))
(define-read-only (get-like-count (nft-id uint)) (default-to u0 (map-get? nft-like-count nft-id)))
(define-public (increment-likes (nft-id uint))
  (begin
    (map-set nft-like-count nft-id (+ (get-like-count nft-id) u1))
    (ok true)))`
  },
  {
    name: "nm-offers-v1",
    code: `(define-map offers uint {nft-id: uint, offerer: principal, amount: uint, expiry: uint, accepted: bool})
(define-data-var offer-counter uint u0)
(define-read-only (get-offer (id uint)) (map-get? offers id))
(define-read-only (get-offer-count) (var-get offer-counter))
(define-public (make-offer (nft-id uint) (amount uint) (duration uint))
  (let ((id (var-get offer-counter)))
    (map-set offers id {nft-id: nft-id, offerer: tx-sender, amount: amount, expiry: (+ block-height duration), accepted: false})
    (var-set offer-counter (+ id u1))
    (ok id)))
(define-public (accept-offer (id uint))
  (let ((offer (unwrap! (get-offer id) (err u1))))
    (asserts! (< block-height (get expiry offer)) (err u2))
    (map-set offers id (merge offer {accepted: true}))
    (ok true)))`
  },
  {
    name: "nm-activity-v1",
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

async function deployContracts() {
  console.log("Starting deployment of 20 contracts...\n");
  let nonce = 608;
  const deployedContracts = [];

  for (const contract of contracts) {
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
      deployedContracts.push({ name: contract.name, txid: result.txid, nonce });
      nonce++;
      await sleep(1500);
    } catch (e) {
      console.log(`  Error: ${e.message}`);
    }
  }

  console.log("\n=== Deployed Contracts ===");
  deployedContracts.forEach(c => console.log(`${c.name}: ${c.txid}`));
  console.log(`\nNext nonce: ${nonce}`);
  return nonce;
}

async function interactWithContracts(startNonce) {
  console.log("\n\nStarting contract interactions...\n");
  let nonce = startNonce;
  const interactions = [];

  const ops = [
    { contract: "nm-rewards-v1", fn: "add-rewards", args: [principalCV(ADDRESS), uintCV(1000000)] },
    { contract: "nm-rewards-v1", fn: "set-reward-rate", args: [uintCV(150)] },
    { contract: "nm-staking-v1", fn: "set-min-stake", args: [uintCV(500000)] },
    { contract: "nm-auction-v1", fn: "create-auction", args: [uintCV(100000), uintCV(1008)] },
    { contract: "nm-escrow-v1", fn: "create-escrow", args: [principalCV("SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7"), uintCV(50000)] },
    { contract: "nm-royalties-v1", fn: "set-royalty", args: [uintCV(1), uintCV(500)] },
    { contract: "nm-royalties-v1", fn: "set-platform-fee", args: [uintCV(200)] },
    { contract: "nm-collection-v1", fn: "create-collection", args: [stringAsciiCV("Cyber Genesis")] },
    { contract: "nm-collection-v1", fn: "create-collection", args: [stringAsciiCV("Neural Dreams")] },
    { contract: "nm-whitelist-v1", fn: "create-whitelist", args: [] },
    { contract: "nm-whitelist-v1", fn: "toggle-whitelist", args: [uintCV(0), boolCV(true)] },
    { contract: "nm-governance-v1", fn: "create-proposal", args: [stringAsciiCV("Enable staking rewards"), uintCV(1008)] },
    { contract: "nm-governance-v1", fn: "vote", args: [uintCV(0), boolCV(true)] },
    { contract: "nm-analytics-v1", fn: "record-sale", args: [uintCV(250000000)] },
    { contract: "nm-analytics-v1", fn: "record-sale", args: [uintCV(180000000)] },
    { contract: "nm-badges-v1", fn: "create-badge", args: [stringAsciiCV("Early Adopter"), stringAsciiCV("Joined during beta phase")] },
    { contract: "nm-badges-v1", fn: "create-badge", args: [stringAsciiCV("Top Seller"), stringAsciiCV("Sold over 100 NFTs")] },
    { contract: "nm-referral-v1", fn: "set-bonus", args: [uintCV(750)] },
    { contract: "nm-favorites-v1", fn: "increment-likes", args: [uintCV(1)] },
    { contract: "nm-favorites-v1", fn: "increment-likes", args: [uintCV(2)] },
    { contract: "nm-offers-v1", fn: "make-offer", args: [uintCV(1), uintCV(200000000), uintCV(144)] },
    { contract: "nm-offers-v1", fn: "make-offer", args: [uintCV(2), uintCV(150000000), uintCV(288)] },
    { contract: "nm-activity-v1", fn: "log-activity", args: [stringAsciiCV("mint"), uintCV(1), uintCV(0)] },
    { contract: "nm-activity-v1", fn: "log-activity", args: [stringAsciiCV("list"), uintCV(1), uintCV(250000000)] },
    { contract: "nm-activity-v1", fn: "log-activity", args: [stringAsciiCV("sale"), uintCV(1), uintCV(250000000)] },
    { contract: "nm-pricing-v1", fn: "set-floor-price", args: [stringAsciiCV("Cyber Genesis"), uintCV(150000000)] },
    { contract: "nm-pricing-v1", fn: "set-floor-price", args: [stringAsciiCV("Neural Dreams"), uintCV(85000000)] },
    { contract: "nm-verification-v1", fn: "verify-creator", args: [principalCV(ADDRESS)] },
    { contract: "nm-verification-v1", fn: "verify-collection", args: [uintCV(0)] },
    { contract: "nm-notifications-v1", fn: "create-notification", args: [principalCV(ADDRESS), stringAsciiCV("Welcome to NeuralMint!")] },
    { contract: "nm-metadata-v1", fn: "set-metadata", args: [uintCV(1), stringAsciiCV("Cyber Genesis #001"), stringUtf8CV("A unique AI-generated artwork"), stringAsciiCV("ipfs://QmExample"), stringUtf8CV('{"rarity":"legendary","style":"cyberpunk"}')] },
    { contract: "nm-settings-v1", fn: "set-setting", args: [stringAsciiCV("max-royalty"), uintCV(1000)] },
    { contract: "nm-settings-v1", fn: "set-feature", args: [stringAsciiCV("auctions"), boolCV(true)] },
    { contract: "nm-settings-v1", fn: "set-feature", args: [stringAsciiCV("lazy-mint"), boolCV(true)] },
    { contract: "nm-auction-v1", fn: "place-bid", args: [uintCV(0), uintCV(110000)] },
    { contract: "nm-collection-v1", fn: "update-floor-price", args: [uintCV(0), uintCV(160000000)] },
    { contract: "nm-rewards-v1", fn: "add-rewards", args: [principalCV("SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7"), uintCV(500000)] },
    { contract: "nm-analytics-v1", fn: "record-sale", args: [uintCV(520000000)] },
    { contract: "nm-governance-v1", fn: "create-proposal", args: [stringAsciiCV("Reduce platform fee to 1.5%"), uintCV(2016)] },
    { contract: "nm-activity-v1", fn: "log-activity", args: [stringAsciiCV("bid"), uintCV(5), uintCV(360000000)] },
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
      interactions.push({ contract: op.contract, fn: op.fn, txid: result.txid, nonce });
      nonce++;
      await sleep(1200);
    } catch (e) {
      console.log(`  Error: ${e.message}`);
    }
  }

  console.log("\n=== Interactions Complete ===");
  console.log(`Total interactions: ${interactions.length}`);
  console.log(`Final nonce: ${nonce}`);
}

async function main() {
  const nextNonce = await deployContracts();
  await sleep(3000);
  await interactWithContracts(nextNonce);
}

main().catch(console.error);
