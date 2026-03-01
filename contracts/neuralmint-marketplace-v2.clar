;; NeuralMint Marketplace V2 - With Platform Fees
;; Platform fee: 1% on all sales
;; Royalty support for creators

(define-constant CONTRACT-OWNER 'SP2PEBKJ2W1ZDDF2QQ6Y4FXKZEDPT9J9R2NKD9WJB)
(define-constant PLATFORM-WALLET 'SP2PEBKJ2W1ZDDF2QQ6Y4FXKZEDPT9J9R2NKD9WJB)
(define-constant PLATFORM-FEE-BPS u100) ;; 1% = 100 basis points

(define-constant ERR-NOT-AUTHORIZED (err u401))
(define-constant ERR-NOT-FOUND (err u404))
(define-constant ERR-LISTING-EXPIRED (err u410))
(define-constant ERR-WRONG-PRICE (err u411))
(define-constant ERR-NOT-LISTED (err u412))
(define-constant ERR-ALREADY-LISTED (err u413))

;; Listing data
(define-map listings
  { nft-contract: principal, token-id: uint }
  {
    seller: principal,
    price: uint,
    royalty-recipient: principal,
    royalty-bps: uint,
    expiry: uint
  }
)

;; Platform stats
(define-data-var total-volume uint u0)
(define-data-var total-fees-collected uint u0)
(define-data-var total-sales uint u0)

;; List NFT for sale
(define-public (list-nft 
    (nft-contract <nft-trait>) 
    (token-id uint) 
    (price uint)
    (royalty-recipient principal)
    (royalty-bps uint)
    (duration-blocks uint))
  (let (
    (owner (unwrap! (contract-call? nft-contract get-owner token-id) ERR-NOT-FOUND))
  )
    (asserts! (is-eq (some tx-sender) owner) ERR-NOT-AUTHORIZED)
    (asserts! (is-none (map-get? listings { nft-contract: (contract-of nft-contract), token-id: token-id })) ERR-ALREADY-LISTED)
    (asserts! (<= royalty-bps u1000) ERR-NOT-AUTHORIZED) ;; Max 10% royalty
    
    ;; Transfer NFT to marketplace (escrow)
    (try! (contract-call? nft-contract transfer token-id tx-sender (as-contract tx-sender)))
    
    (map-set listings
      { nft-contract: (contract-of nft-contract), token-id: token-id }
      {
        seller: tx-sender,
        price: price,
        royalty-recipient: royalty-recipient,
        royalty-bps: royalty-bps,
        expiry: (+ block-height duration-blocks)
      }
    )
    (ok true)
  )
)

;; Buy listed NFT
(define-public (buy-nft (nft-contract <nft-trait>) (token-id uint))
  (let (
    (listing (unwrap! (map-get? listings { nft-contract: (contract-of nft-contract), token-id: token-id }) ERR-NOT-LISTED))
    (price (get price listing))
    (seller (get seller listing))
    (royalty-recipient (get royalty-recipient listing))
    (royalty-bps (get royalty-bps listing))
    (expiry (get expiry listing))
    
    ;; Calculate fees
    (platform-fee (/ (* price PLATFORM-FEE-BPS) u10000))
    (royalty-fee (/ (* price royalty-bps) u10000))
    (seller-amount (- price (+ platform-fee royalty-fee)))
  )
    ;; Check expiry
    (asserts! (<= block-height expiry) ERR-LISTING-EXPIRED)
    
    ;; Transfer STX payments
    (try! (stx-transfer? platform-fee tx-sender PLATFORM-WALLET))
    (if (> royalty-fee u0)
      (try! (stx-transfer? royalty-fee tx-sender royalty-recipient))
      true
    )
    (try! (stx-transfer? seller-amount tx-sender seller))
    
    ;; Transfer NFT to buyer
    (try! (as-contract (contract-call? nft-contract transfer token-id tx-sender tx-sender)))
    
    ;; Update stats
    (var-set total-volume (+ (var-get total-volume) price))
    (var-set total-fees-collected (+ (var-get total-fees-collected) platform-fee))
    (var-set total-sales (+ (var-get total-sales) u1))
    
    ;; Remove listing
    (map-delete listings { nft-contract: (contract-of nft-contract), token-id: token-id })
    
    (ok { price: price, platform-fee: platform-fee, royalty-fee: royalty-fee, seller-amount: seller-amount })
  )
)

;; Cancel listing
(define-public (cancel-listing (nft-contract <nft-trait>) (token-id uint))
  (let (
    (listing (unwrap! (map-get? listings { nft-contract: (contract-of nft-contract), token-id: token-id }) ERR-NOT-LISTED))
    (seller (get seller listing))
  )
    (asserts! (is-eq tx-sender seller) ERR-NOT-AUTHORIZED)
    
    ;; Return NFT to seller
    (try! (as-contract (contract-call? nft-contract transfer token-id tx-sender seller)))
    
    ;; Remove listing
    (map-delete listings { nft-contract: (contract-of nft-contract), token-id: token-id })
    
    (ok true)
  )
)

;; Read-only functions
(define-read-only (get-listing (nft-contract principal) (token-id uint))
  (map-get? listings { nft-contract: nft-contract, token-id: token-id })
)

(define-read-only (get-platform-stats)
  {
    total-volume: (var-get total-volume),
    total-fees-collected: (var-get total-fees-collected),
    total-sales: (var-get total-sales),
    platform-fee-bps: PLATFORM-FEE-BPS
  }
)

(define-read-only (calculate-fees (price uint) (royalty-bps uint))
  (let (
    (platform-fee (/ (* price PLATFORM-FEE-BPS) u10000))
    (royalty-fee (/ (* price royalty-bps) u10000))
    (seller-amount (- price (+ platform-fee royalty-fee)))
  )
    { platform-fee: platform-fee, royalty-fee: royalty-fee, seller-amount: seller-amount }
  )
)

;; NFT Trait
(define-trait nft-trait
  (
    (get-owner (uint) (response (optional principal) uint))
    (transfer (uint principal principal) (response bool uint))
  )
)
