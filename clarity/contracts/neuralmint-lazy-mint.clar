;; NeuralMint lazy mint
(define-constant ERR-ALREADY-REDEEMED (err u431))
(define-constant ERR-PRICE-TOO-LOW (err u432))
(define-constant PLATFORM-FEE-BPS u100)

(define-map voucher-redeemed (buff 32) bool)

(define-read-only (is-voucher-redeemed (voucher-hash (buff 32)))
  (ok (default-to false (map-get? voucher-redeemed voucher-hash)))
)

(define-public
  (redeem-voucher
    (voucher-hash (buff 32))
    (creator principal)
    (uri (string-ascii 256))
    (min-price uint)
    (royalty-bps uint)
    (ai-model (string-ascii 50))
    (prompt-hash (buff 32))
    (payment uint)
  )
  (let (
      (platform-wallet (unwrap-panic (contract-call? .neuralmint-marketplace get-platform-wallet)))
      (platform-fee (/ (* payment PLATFORM-FEE-BPS) u10000))
      (creator-amount (- payment platform-fee))
    )
    (asserts! (is-none (map-get? voucher-redeemed voucher-hash)) ERR-ALREADY-REDEEMED)
    (asserts! (>= payment min-price) ERR-PRICE-TOO-LOW)

    (try! (stx-transfer? creator-amount tx-sender creator))
    (try! (stx-transfer? platform-fee tx-sender platform-wallet))

    (try! (contract-call? .neuralmint-nft mint tx-sender uri creator royalty-bps ai-model prompt-hash "lazy-mint"))
    (map-set voucher-redeemed voucher-hash true)
    (ok true)
  )
)
