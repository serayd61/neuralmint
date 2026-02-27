import txPkg from '@stacks/transactions';
const { 
  makeContractDeploy,
  broadcastTransaction, 
  AnchorMode,
  PostConditionMode
} = txPkg;
import netPkg from '@stacks/network';
const { STACKS_MAINNET } = netPkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PRIVATE_KEY = process.env.STACKS_DEPLOYER_KEY;
const network = STACKS_MAINNET;

if (!PRIVATE_KEY) {
  console.error('❌ STACKS_DEPLOYER_KEY environment variable not set');
  process.exit(1);
}

const CONTRACTS = [
  { name: 'sip009-nft-trait', file: 'sip009-nft-trait.clar' },
  { name: 'neuralmint-nft', file: 'neuralmint-nft.clar' },
  { name: 'neuralmint-marketplace', file: 'neuralmint-marketplace.clar' },
  { name: 'neuralmint-lazy-mint', file: 'neuralmint-lazy-mint.clar' },
];

async function getAddress() {
  const { getAddressFromPrivateKey, TransactionVersion } = txPkg;
  return getAddressFromPrivateKey(PRIVATE_KEY, TransactionVersion.Mainnet);
}

async function getCurrentNonce(address) {
  const response = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${address}/nonces`);
  const data = await response.json();
  return BigInt(data.possible_next_nonce);
}

async function waitForConfirmation(txId) {
  console.log(`  ⏳ Waiting for confirmation...`);
  let attempts = 0;
  while (attempts < 60) {
    await new Promise(r => setTimeout(r, 10000));
    try {
      const response = await fetch(`https://api.mainnet.hiro.so/extended/v1/tx/${txId}`);
      const data = await response.json();
      if (data.tx_status === 'success') {
        console.log(`  ✅ Confirmed!`);
        return true;
      } else if (data.tx_status === 'abort_by_response') {
        console.log(`  ❌ Failed: ${data.tx_status}`);
        return false;
      }
    } catch (e) {
      // Continue waiting
    }
    attempts++;
  }
  console.log(`  ⚠️ Timeout waiting for confirmation`);
  return false;
}

async function deploy(name, codePath, nonce) {
  const contractsDir = path.join(__dirname, '..', 'clarity', 'contracts');
  const fullPath = path.join(contractsDir, codePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`  ❌ File not found: ${fullPath}`);
    return { success: false, txId: null };
  }
  
  const code = fs.readFileSync(fullPath, 'utf-8');
  
  try {
    const tx = await makeContractDeploy({
      contractName: name,
      codeBody: code,
      senderKey: PRIVATE_KEY,
      network,
      anchorMode: AnchorMode.Any,
      fee: 50000n, // Higher fee for faster confirmation
      nonce
    });
    
    const result = await broadcastTransaction({ transaction: tx, network });
    
    if (result.error) {
      console.log(`  ❌ ${name}: ${result.reason}`);
      return { success: false, txId: null };
    }
    
    console.log(`  📤 ${name}: ${result.txid}`);
    return { success: true, txId: result.txid };
  } catch (e) {
    console.log(`  ❌ ${name}: ${e.message.slice(0, 60)}`);
    return { success: false, txId: null };
  }
}

async function main() {
  console.log('═'.repeat(60));
  console.log('🚀 NeuralMint Contract Deployment - Mainnet');
  console.log('═'.repeat(60));
  
  const address = await getAddress();
  console.log(`\n📍 Deployer: ${address}`);
  
  let nonce = await getCurrentNonce(address);
  console.log(`📊 Starting nonce: ${nonce}\n`);
  
  const results = [];
  
  for (const contract of CONTRACTS) {
    console.log(`\n📦 Deploying ${contract.name}...`);
    const { success, txId } = await deploy(contract.name, contract.file, nonce);
    
    if (success && txId) {
      results.push({ name: contract.name, txId, status: 'pending' });
      nonce++;
      // Wait between deployments
      await new Promise(r => setTimeout(r, 2000));
    } else {
      results.push({ name: contract.name, txId: null, status: 'failed' });
    }
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('📋 Deployment Summary');
  console.log('═'.repeat(60));
  
  for (const r of results) {
    const status = r.status === 'pending' ? '⏳' : '❌';
    console.log(`${status} ${r.name}: ${r.txId || 'Failed'}`);
  }
  
  console.log('\n💡 Check transactions at: https://explorer.hiro.so/address/' + address);
}

main().catch(console.error);
