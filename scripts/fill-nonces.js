import txPkg from '@stacks/transactions';
const { makeSTXTokenTransfer, broadcastTransaction, AnchorMode } = txPkg;
import netPkg from '@stacks/network';
const { STACKS_MAINNET } = netPkg;

const PRIVATE_KEY = process.env.STACKS_PRIVATE_KEY || process.env.STACKS_DEPLOYER_KEY;
const BURN_ADDRESS = 'SP000000000000000000002Q6VF78';
const network = STACKS_MAINNET;

if (!PRIVATE_KEY) {
  console.error('Missing STACKS_PRIVATE_KEY or STACKS_DEPLOYER_KEY');
  process.exit(1);
}

async function main() {
  for (const nonce of [601, 602]) {
    const tx = await makeSTXTokenTransfer({
      recipient: BURN_ADDRESS,
      amount: 1n,
      senderKey: PRIVATE_KEY,
      network,
      anchorMode: AnchorMode.Any,
      fee: 5000n,
      nonce: BigInt(nonce)
    });
    const res = await broadcastTransaction({ transaction: tx, network });
    console.log(`Nonce ${nonce}:`, res.error ? res.reason : 'OK');
  }
}

main();
