import txPkg from '@stacks/transactions';
const { 
  makeContractCall,
  broadcastTransaction, 
  AnchorMode,
  PostConditionMode,
  uintCV,
  principalCV,
  stringAsciiCV,
  bufferCV
} = txPkg;
import netPkg from '@stacks/network';
const { STACKS_MAINNET } = netPkg;

const PRIVATE_KEY = process.env.STACKS_PRIVATE_KEY || process.env.STACKS_DEPLOYER_KEY;
const ADDRESS = process.env.STACKS_ADDRESS;
const network = STACKS_MAINNET;

if (!PRIVATE_KEY || !ADDRESS) {
  console.error('Missing STACKS_PRIVATE_KEY/STACKS_DEPLOYER_KEY or STACKS_ADDRESS');
  process.exit(1);
}

async function getCurrentNonce() {
  const response = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${ADDRESS}/nonces`);
  const data = await response.json();
  return BigInt(data.possible_next_nonce);
}

async function call(contractName, functionName, functionArgs, nonce) {
  try {
    const tx = await makeContractCall({
      contractAddress: ADDRESS,
      contractName,
      functionName,
      functionArgs,
      senderKey: PRIVATE_KEY,
      network,
      anchorMode: AnchorMode.Any,
      postConditionMode: PostConditionMode.Allow,
      fee: 10000n,
      nonce
    });
    const res = await broadcastTransaction({ transaction: tx, network });
    if (res.error) {
      console.log(`  ✗ ${contractName}.${functionName}: ${res.reason}`);
      return false;
    }
    console.log(`  ✓ ${contractName}.${functionName}: ${res.txid.slice(0, 16)}...`);
    return true;
  } catch (e) {
    console.log(`  ✗ ${contractName}.${functionName}: ${e.message.slice(0, 50)}`);
    return false;
  }
}

async function main() {
  console.log('═'.repeat(60));
  console.log('🧪 NeuralMint Contract Tests');
  console.log('═'.repeat(60));
  
  let nonce = await getCurrentNonce();
  console.log(`Starting nonce: ${nonce}\n`);
  let count = 0;

  // Test neuralmint-nft: mint
  console.log('📦 neuralmint-nft');
  const promptHash = Buffer.alloc(32);
  Buffer.from('test-prompt-hash-neuralmint').copy(promptHash);
  
  for (let i = 0; i < 3; i++) {
    if (await call('neuralmint-nft', 'mint', [
      principalCV(ADDRESS),
      stringAsciiCV(`ipfs://QmNeuralMint${i}/metadata.json`),
      principalCV(ADDRESS),
      uintCV(500), // 5% royalty
      stringAsciiCV('dall-e-3'),
      bufferCV(promptHash),
      stringAsciiCV(`{"size":"1024x1024","style":"vivid","id":${i}}`)
    ], nonce++)) count++;
    await new Promise(r => setTimeout(r, 200));
  }

  // Test neuralmint-marketplace: set-platform-wallet
  console.log('\n🏪 neuralmint-marketplace');
  if (await call('neuralmint-marketplace', 'set-platform-wallet', [
    principalCV(ADDRESS)
  ], nonce++)) count++;

  // Test neuralmint-marketplace: set-paused (false)
  if (await call('neuralmint-marketplace', 'set-paused', [
    txPkg.falseCV()
  ], nonce++)) count++;

  // Test neuralmint-nft: set-contract-paused (false)
  console.log('\n⚙️ neuralmint-nft settings');
  if (await call('neuralmint-nft', 'set-contract-paused', [
    txPkg.falseCV()
  ], nonce++)) count++;

  console.log('\n' + '═'.repeat(60));
  console.log(`✅ Successful calls: ${count}`);
  console.log('═'.repeat(60));
}

main().catch(console.error);
