;; NeuralMint SIP-009 NFT Contract
(impl-trait .sip009-nft-trait.nft-trait)

(define-constant ERR-NOT-AUTHORIZED (err u401))
(define-constant ERR-NOT-FOUND (err u404))
(define-constant ERR-INVALID-ROYALTY (err u422))
(define-constant MAX-ROYALTY-BPS u1000)
(define-constant CONTRACT-OWNER tx-sender)

(define-data-var last-token-id uint u0)
(define-data-var contract-paused bool false)

(define-non-fungible-token neuralmint-nft uint)

(define-map token-uris uint (string-ascii 256))
(define-map token-royalties uint { recipient: principal, bps: uint })
(define-map token-ai-metadata uint {
  ai-model: (string-ascii 50),
  prompt-hash: (buff 32),
  generation-params: (string-ascii 500)
})

(define-read-only (get-last-token-id)
  (ok (var-get last-token-id))
)

(define-read-only (get-token-uri (token-id uint))
  (ok (map-get? token-uris token-id))
)

(define-read-only (get-owner (token-id uint))
  (ok (nft-get-owner? neuralmint-nft token-id))
)

(define-read-only (get-royalty-info (token-id uint))
  (ok (map-get? token-royalties token-id))
)

(define-read-only (get-ai-metadata (token-id uint))
  (ok (map-get? token-ai-metadata token-id))
)

(define-public (transfer (token-id uint) (sender principal) (recipient principal))
  (begin
    (asserts!
      (or (is-eq tx-sender sender) (is-eq contract-caller sender))
      ERR-NOT-AUTHORIZED
    )
    (nft-transfer? neuralmint-nft token-id sender recipient)
  )
)

(define-public
  (mint
    (recipient principal)
    (uri (string-ascii 256))
    (royalty-recipient principal)
    (royalty-bps uint)
    (ai-model (string-ascii 50))
    (prompt-hash (buff 32))
    (gen-params (string-ascii 500))
  )
  (let ((token-id (+ (var-get last-token-id) u1)))
    (asserts! (not (var-get contract-paused)) (err u503))
    (asserts! (<= royalty-bps MAX-ROYALTY-BPS) ERR-INVALID-ROYALTY)
    (try! (nft-mint? neuralmint-nft token-id recipient))
    (map-set token-uris token-id uri)
    (map-set token-royalties token-id { recipient: royalty-recipient, bps: royalty-bps })
    (map-set token-ai-metadata token-id {
      ai-model: ai-model,
      prompt-hash: prompt-hash,
      generation-params: gen-params
    })
    (var-set last-token-id token-id)
    (ok token-id)
  )
)

(define-public (burn (token-id uint))
  (let ((owner (unwrap! (nft-get-owner? neuralmint-nft token-id) ERR-NOT-FOUND)))
    (asserts! (is-eq owner tx-sender) ERR-NOT-AUTHORIZED)
    (nft-burn? neuralmint-nft token-id tx-sender)
  )
)

(define-public (set-contract-paused (paused bool))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (var-set contract-paused paused)
    (ok true)
  )
)
