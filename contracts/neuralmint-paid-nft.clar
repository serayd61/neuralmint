;; NeuralMint Paid NFT Collection Template
;; Mint fee goes to platform wallet

(impl-trait 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9.nft-trait.nft-trait)

(define-constant CONTRACT-OWNER tx-sender)
(define-constant PLATFORM-WALLET 'SP2PEBKJ2W1ZDDF2QQ6Y4FXKZEDPT9J9R2NKD9WJB)
(define-constant MINT-PRICE u5000000) ;; 5 STX per mint

(define-constant ERR-NOT-AUTHORIZED (err u401))
(define-constant ERR-NOT-FOUND (err u404))
(define-constant ERR-SOLD-OUT (err u500))
(define-constant ERR-INSUFFICIENT-FUNDS (err u501))

(define-constant COLLECTION-NAME "NeuralMint Premium")
(define-constant COLLECTION-SYMBOL "NMPREM")
(define-constant MAX-SUPPLY u500)

(define-non-fungible-token neuralmint-premium uint)

(define-data-var last-token-id uint u0)
(define-data-var base-uri (string-ascii 200) "https://neuralmint.vercel.app/api/metadata/premium/")
(define-data-var total-revenue uint u0)

;; Read-only functions
(define-read-only (get-last-token-id)
  (ok (var-get last-token-id)))

(define-read-only (get-token-uri (token-id uint))
  (ok (some (concat (var-get base-uri) (int-to-ascii token-id)))))

(define-read-only (get-owner (token-id uint))
  (ok (nft-get-owner? neuralmint-premium token-id)))

(define-read-only (get-mint-price)
  MINT-PRICE)

(define-read-only (get-collection-info)
  {
    name: COLLECTION-NAME, 
    symbol: COLLECTION-SYMBOL, 
    max-supply: MAX-SUPPLY, 
    minted: (var-get last-token-id),
    mint-price: MINT-PRICE,
    total-revenue: (var-get total-revenue)
  })

;; Transfer NFT
(define-public (transfer (token-id uint) (sender principal) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender sender) ERR-NOT-AUTHORIZED)
    (nft-transfer? neuralmint-premium token-id sender recipient)))

;; Paid mint - fee goes to platform wallet
(define-public (mint (recipient principal))
  (let (
    (token-id (+ (var-get last-token-id) u1))
  )
    (asserts! (<= token-id MAX-SUPPLY) ERR-SOLD-OUT)
    
    ;; Transfer mint fee to platform wallet
    (try! (stx-transfer? MINT-PRICE tx-sender PLATFORM-WALLET))
    
    ;; Mint NFT
    (try! (nft-mint? neuralmint-premium token-id recipient))
    (var-set last-token-id token-id)
    (var-set total-revenue (+ (var-get total-revenue) MINT-PRICE))
    
    (ok token-id)
  ))

;; Free mint for owner (airdrops)
(define-public (mint-free (recipient principal))
  (let (
    (token-id (+ (var-get last-token-id) u1))
  )
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (asserts! (<= token-id MAX-SUPPLY) ERR-SOLD-OUT)
    
    (try! (nft-mint? neuralmint-premium token-id recipient))
    (var-set last-token-id token-id)
    
    (ok token-id)
  ))

;; Update base URI (owner only)
(define-public (set-base-uri (new-uri (string-ascii 200)))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (var-set base-uri new-uri)
    (ok true)
  ))
