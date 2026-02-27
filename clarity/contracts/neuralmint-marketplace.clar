;; NeuralMint marketplace (fixed price core)
(use-trait nft-trait .sip009-nft-trait.nft-trait)

(define-constant ERR-NOT-AUTHORIZED (err u401))
(define-constant ERR-NOT-FOUND (err u404))
(define-constant ERR-INVALID-AMOUNT (err u400))
(define-constant ERR-EXPIRED (err u410))
(define-constant ERR-PAUSED (err u503))

(define-constant PLATFORM-FEE-BPS u100) ;; 1%
(define-constant CONTRACT-OWNER tx-sender)

(define-data-var platform-wallet principal tx-sender)
(define-data-var contract-paused bool false)
(define-data-var last-listing-id uint u0)
(define-data-var total-platform-fees uint u0)

(define-map listings uint {
  seller: principal,
  nft-contract: principal,
  token-id: uint,
  price: uint,
  expiry: uint,
  active: bool
})

(define-read-only (get-platform-wallet)
  (ok (var-get platform-wallet))
)

(define-read-only (get-platform-fee)
  (ok PLATFORM-FEE-BPS)
)

(define-read-only (get-listing (listing-id uint))
  (ok (map-get? listings listing-id))
)

(define-read-only (get-total-fees-collected)
  (ok (var-get total-platform-fees))
)

(define-public (list-item (nft-contract <nft-trait>) (token-id uint) (price uint) (expiry uint))
  (let (
      (listing-id (+ (var-get last-listing-id) u1))
      (owner (unwrap! (contract-call? nft-contract get-owner token-id) ERR-NOT-FOUND))
    )
    (asserts! (not (var-get contract-paused)) ERR-PAUSED)
    (asserts! (is-eq owner (some tx-sender)) ERR-NOT-AUTHORIZED)
    (asserts! (> price u0) ERR-INVALID-AMOUNT)
    (asserts! (> expiry block-height) ERR-EXPIRED)
    ;; escrow NFT in marketplace contract principal
    (try! (contract-call? nft-contract transfer token-id tx-sender (as-contract tx-sender)))
    (map-set listings listing-id {
      seller: tx-sender,
      nft-contract: (contract-of nft-contract),
      token-id: token-id,
      price: price,
      expiry: expiry,
      active: true
    })
    (var-set last-listing-id listing-id)
    (ok listing-id)
  )
)

(define-public (buy-item (listing-id uint) (nft-contract <nft-trait>))
  (let (
      (listing (unwrap! (map-get? listings listing-id) ERR-NOT-FOUND))
      (price (get price listing))
      (seller (get seller listing))
      (token-id (get token-id listing))
      (platform-fee (/ (* price PLATFORM-FEE-BPS) u10000))
      (seller-amount (- price platform-fee))
    )
    (asserts! (not (var-get contract-paused)) ERR-PAUSED)
    (asserts! (get active listing) ERR-NOT-FOUND)
    (asserts! (<= block-height (get expiry listing)) ERR-EXPIRED)

    (try! (stx-transfer? seller-amount tx-sender seller))
    (try! (stx-transfer? platform-fee tx-sender (var-get platform-wallet)))

    ;; transfer NFT from escrow (marketplace) to buyer
    (try! (as-contract (contract-call? nft-contract transfer token-id (as-contract tx-sender) tx-sender)))

    (map-set listings listing-id (merge listing { active: false }))
    (var-set total-platform-fees (+ (var-get total-platform-fees) platform-fee))
    (ok true)
  )
)

(define-public (cancel-listing (listing-id uint) (nft-contract <nft-trait>))
  (let ((listing (unwrap! (map-get? listings listing-id) ERR-NOT-FOUND)))
    (asserts! (is-eq tx-sender (get seller listing)) ERR-NOT-AUTHORIZED)
    (asserts! (get active listing) ERR-NOT-FOUND)
    (try! (as-contract (contract-call? nft-contract transfer (get token-id listing) (as-contract tx-sender) (get seller listing))))
    (map-set listings listing-id (merge listing { active: false }))
    (ok true)
  )
)

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
