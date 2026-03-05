;; NeuralMint Auction Contract
;; English-style open auction with auto-extend, min bid increments, and refund mechanism
;; Demonstrates block-height based timing (Proof of Transfer awareness)

(use-trait nft-trait .sip009-nft-trait.nft-trait)

;; -- Error Constants --
(define-constant ERR-NOT-AUTHORIZED (err u401))
(define-constant ERR-NOT-FOUND (err u404))
(define-constant ERR-INVALID-AMOUNT (err u400))
(define-constant ERR-AUCTION-ENDED (err u410))
(define-constant ERR-AUCTION-ACTIVE (err u411))
(define-constant ERR-BID-TOO-LOW (err u412))
(define-constant ERR-NO-BIDS (err u413))
(define-constant ERR-PAUSED (err u503))
(define-constant ERR-SELF-BID (err u414))

;; -- Configuration --
(define-constant CONTRACT-OWNER tx-sender)
(define-constant PLATFORM-FEE-BPS u100) ;; 1%
(define-constant MIN-DURATION u6)       ;; ~1 hour minimum (6 blocks)
(define-constant AUTO-EXTEND-BLOCKS u3) ;; ~30 min auto-extend if bid in last 30 min

;; -- State --
(define-data-var last-auction-id uint u0)
(define-data-var platform-wallet principal tx-sender)
(define-data-var contract-paused bool false)
(define-data-var total-auctions-settled uint u0)
(define-data-var total-volume uint u0)

;; -- Auction Data --
(define-map auctions uint {
  seller: principal,
  nft-contract: principal,
  token-id: uint,
  reserve-price: uint,
  min-bid-increment: uint,
  highest-bid: uint,
  highest-bidder: (optional principal),
  end-block: uint,
  settled: bool,
  cancelled: bool
})

;; -- Read-Only Functions --

(define-read-only (get-auction (auction-id uint))
  (ok (map-get? auctions auction-id))
)

(define-read-only (get-auction-status (auction-id uint))
  (let ((auction (unwrap! (map-get? auctions auction-id) ERR-NOT-FOUND)))
    (ok {
      is-active: (and
        (not (get settled auction))
        (not (get cancelled auction))
        (<= block-height (get end-block auction))
      ),
      blocks-remaining: (if (<= block-height (get end-block auction))
        (- (get end-block auction) block-height)
        u0
      ),
      highest-bid: (get highest-bid auction),
      highest-bidder: (get highest-bidder auction),
      bid-count: u0
    })
  )
)

(define-read-only (get-platform-stats)
  (ok {
    total-auctions: (var-get last-auction-id),
    total-settled: (var-get total-auctions-settled),
    total-volume: (var-get total-volume)
  })
)

;; -- Public Functions --

;; Create a new auction
(define-public (create-auction
  (nft-contract <nft-trait>)
  (token-id uint)
  (reserve-price uint)
  (min-bid-increment uint)
  (duration uint)
)
  (let (
    (auction-id (+ (var-get last-auction-id) u1))
    (owner (unwrap! (contract-call? nft-contract get-owner token-id) ERR-NOT-FOUND))
    (end-block (+ block-height duration))
  )
    (asserts! (not (var-get contract-paused)) ERR-PAUSED)
    (asserts! (is-eq owner (some tx-sender)) ERR-NOT-AUTHORIZED)
    (asserts! (> reserve-price u0) ERR-INVALID-AMOUNT)
    (asserts! (> min-bid-increment u0) ERR-INVALID-AMOUNT)
    (asserts! (>= duration MIN-DURATION) ERR-INVALID-AMOUNT)

    ;; Escrow NFT
    (try! (contract-call? nft-contract transfer token-id tx-sender (as-contract tx-sender)))

    (map-set auctions auction-id {
      seller: tx-sender,
      nft-contract: (contract-of nft-contract),
      token-id: token-id,
      reserve-price: reserve-price,
      min-bid-increment: min-bid-increment,
      highest-bid: u0,
      highest-bidder: none,
      end-block: end-block,
      settled: false,
      cancelled: false
    })

    (var-set last-auction-id auction-id)
    (ok auction-id)
  )
)

;; Place a bid - automatically refunds previous highest bidder
(define-public (place-bid (auction-id uint) (bid-amount uint))
  (let (
    (auction (unwrap! (map-get? auctions auction-id) ERR-NOT-FOUND))
    (min-required (if (> (get highest-bid auction) u0)
      (+ (get highest-bid auction) (get min-bid-increment auction))
      (get reserve-price auction)
    ))
  )
    (asserts! (not (var-get contract-paused)) ERR-PAUSED)
    (asserts! (not (get settled auction)) ERR-AUCTION-ENDED)
    (asserts! (not (get cancelled auction)) ERR-AUCTION-ENDED)
    (asserts! (<= block-height (get end-block auction)) ERR-AUCTION-ENDED)
    (asserts! (>= bid-amount min-required) ERR-BID-TOO-LOW)
    (asserts! (not (is-eq tx-sender (get seller auction))) ERR-SELF-BID)

    ;; Escrow new bid
    (try! (stx-transfer? bid-amount tx-sender (as-contract tx-sender)))

    ;; Refund previous highest bidder
    (match (get highest-bidder auction)
      prev-bidder (try! (as-contract (stx-transfer? (get highest-bid auction) tx-sender prev-bidder)))
      true
    )

    ;; Auto-extend if bid is placed near the end
    (let ((new-end-block (if (<= (- (get end-block auction) block-height) AUTO-EXTEND-BLOCKS)
          (+ (get end-block auction) AUTO-EXTEND-BLOCKS)
          (get end-block auction)
        )))
      (map-set auctions auction-id (merge auction {
        highest-bid: bid-amount,
        highest-bidder: (some tx-sender),
        end-block: new-end-block
      }))
    )

    (ok true)
  )
)

;; Settle auction - anyone can call after expiry
(define-public (settle-auction (auction-id uint) (nft-contract <nft-trait>))
  (let (
    (auction (unwrap! (map-get? auctions auction-id) ERR-NOT-FOUND))
    (winner (unwrap! (get highest-bidder auction) ERR-NO-BIDS))
    (final-price (get highest-bid auction))
    (platform-fee (/ (* final-price PLATFORM-FEE-BPS) u10000))
    (seller-amount (- final-price platform-fee))
  )
    (asserts! (not (get settled auction)) ERR-AUCTION-ENDED)
    (asserts! (not (get cancelled auction)) ERR-AUCTION-ENDED)
    (asserts! (> block-height (get end-block auction)) ERR-AUCTION-ACTIVE)

    ;; Pay seller from escrow
    (try! (as-contract (stx-transfer? seller-amount tx-sender (get seller auction))))
    ;; Pay platform fee
    (try! (as-contract (stx-transfer? platform-fee tx-sender (var-get platform-wallet))))

    ;; Transfer NFT to winner from escrow
    (try! (as-contract (contract-call? nft-contract transfer (get token-id auction) tx-sender winner)))

    ;; Update state
    (map-set auctions auction-id (merge auction { settled: true }))
    (var-set total-auctions-settled (+ (var-get total-auctions-settled) u1))
    (var-set total-volume (+ (var-get total-volume) final-price))

    (ok { winner: winner, price: final-price })
  )
)

;; Cancel auction - only seller, only if no bids
(define-public (cancel-auction (auction-id uint) (nft-contract <nft-trait>))
  (let ((auction (unwrap! (map-get? auctions auction-id) ERR-NOT-FOUND)))
    (asserts! (is-eq tx-sender (get seller auction)) ERR-NOT-AUTHORIZED)
    (asserts! (not (get settled auction)) ERR-AUCTION-ENDED)
    (asserts! (not (get cancelled auction)) ERR-AUCTION-ENDED)
    (asserts! (is-none (get highest-bidder auction)) ERR-AUCTION-ACTIVE)

    ;; Return NFT to seller from escrow
    (try! (as-contract (contract-call? nft-contract transfer (get token-id auction) tx-sender (get seller auction))))

    (map-set auctions auction-id (merge auction { cancelled: true }))
    (ok true)
  )
)

;; -- Admin Functions --

(define-public (set-platform-wallet (new-wallet principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (var-set platform-wallet new-wallet)
    (ok true)
  )
)

(define-public (set-paused (paused bool))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (var-set contract-paused paused)
    (ok true)
  )
)
