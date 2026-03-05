import { openSTXTransfer } from "@stacks/connect";
import { PLATFORM_WALLET, MICRO_STX_PER_STX, STACKS_API_URL } from "./constants";

/**
 * Trigger a wallet popup to pay the AI generation fee via STX transfer.
 * Returns a Promise that resolves with the txId on success.
 */
export function payGenerationFee(amountStx: number): Promise<string> {
  const amountMicroStx = Math.floor(amountStx * MICRO_STX_PER_STX);

  return new Promise((resolve, reject) => {
    openSTXTransfer({
      recipient: PLATFORM_WALLET,
      amount: BigInt(amountMicroStx),
      memo: "NeuralMint AI Generation Fee",
      onFinish: (data) => {
        resolve(data.txId);
      },
      onCancel: () => {
        reject(new Error("Payment cancelled by user"));
      },
    });
  });
}

/**
 * Server-side: verify that a given txId is a valid STX transfer
 * to the platform wallet with at least the expected amount.
 * Accepts both confirmed and pending (mempool) transactions.
 */
export async function verifyPayment(
  txId: string,
  expectedAmountStx: number
): Promise<{ valid: boolean; error?: string }> {
  const expectedMicroStx = Math.floor(expectedAmountStx * MICRO_STX_PER_STX);

  try {
    // Try confirmed tx first
    let res = await fetch(`${STACKS_API_URL}/extended/v1/tx/${txId}`);

    if (res.ok) {
      const tx = await res.json();

      if (tx.tx_type !== "token_transfer") {
        return { valid: false, error: "Transaction is not a token transfer" };
      }

      if (
        tx.tx_status !== "success" &&
        tx.tx_status !== "pending"
      ) {
        return { valid: false, error: `Transaction status: ${tx.tx_status}` };
      }

      const amount = Number(tx.token_transfer?.amount || 0);
      if (amount < expectedMicroStx) {
        return { valid: false, error: "Insufficient payment amount" };
      }

      const recipient = tx.token_transfer?.recipient_address;
      if (recipient !== PLATFORM_WALLET) {
        return { valid: false, error: "Payment sent to wrong address" };
      }

      return { valid: true };
    }

    // If not found, check mempool
    res = await fetch(`${STACKS_API_URL}/extended/v1/tx/mempool/${txId}`);

    if (res.ok) {
      const tx = await res.json();

      if (tx.tx_type !== "token_transfer") {
        return { valid: false, error: "Transaction is not a token transfer" };
      }

      const amount = Number(tx.token_transfer?.amount || 0);
      if (amount < expectedMicroStx) {
        return { valid: false, error: "Insufficient payment amount" };
      }

      const recipient = tx.token_transfer?.recipient_address;
      if (recipient !== PLATFORM_WALLET) {
        return { valid: false, error: "Payment sent to wrong address" };
      }

      return { valid: true };
    }

    return { valid: false, error: "Transaction not found" };
  } catch (err) {
    console.error("Payment verification error:", err);
    return { valid: false, error: "Failed to verify payment" };
  }
}
