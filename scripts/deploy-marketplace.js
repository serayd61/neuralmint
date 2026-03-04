import txPkg from '@stacks/transactions';
const { 
  makeContractDeploy,
  broadcastTransaction, 
  AnchorMode
} = txPkg;
import netPkg from '@stacks/network';
const { STACKS_MAINNET } = netPkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PRIVATE_KEY = process.env.STACKS_PRIVATE_KEY || process.env.STACKS_DEPLOYER_KEY;
const ADDRESS = process.env.STACKS_ADDRESS;
const network = STACKS_MAINNET;

if (!PRIVATE_KEY || !ADDRESS) {
  console.error('Missing STACKS_PRIVATE_KEY/STACKS_DEPLOYER_KEY or STACKS_ADDRESS');
  process.exit(1);
}

const CONTRACTS = [
  { name: 'neuralmint-marketplace', file: 'neuralmint-marketplace.clar' },
  { name: 'neuralmint-lazy-mint', file: 'neuralmint-lazy-mint.clar' },
];

async function getCurrentNonce() {
  const response = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${ADDRESS}/nonces`);
  const data = await response.json();
  return BigInt(data.possible_next_nonce);
}

async function deploy(name, codePath, nonce) {
  const contractsDir = path.join(__dirname, '..', 'clarity', 'contracts');
  const fullPath = path.join(contractsDir, codePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`  ❌ File not found: ${fullPath}`);
    return false;
  }
  
  const code = fs.readFileSync(fullPath, 'utf-8');
  
  try {
    const tx = await makeContractDeploy({
      contractName: name,
      codeBody: code,
      senderKey: PRIVATE_KEY,
      network,
      anchorMode: AnchorMode.Any,
      fee: 15000n,
      nonce
    });
    
    const result = await broadcastTransaction({ transaction: tx, network });
    
    if (result.error) {
      console.log(`  ❌ ${name}: ${result.reason}`);
      return false;
    }
    
    console.log(`  ✓ ${name}: ${result.txid}`);
    return true;
  } catch (e) {
    console.log(`  ❌ ${name}: ${e.message.slice(0, 60)}`);
    return false;
  }
}

async function main() {
  console.log('═'.repeat(60));
  console.log('🚀 NeuralMint Marketplace Deployment');
  console.log('═'.repeat(60));
  console.log(`\n📍 Deployer: ${ADDRESS}`);
  
  let nonce = await getCurrentNonce();
  console.log(`📊 Starting nonce: ${nonce}\n`);
  
  let deployed = 0;
  
  for (const contract of CONTRACTS) {
    console.log(`📦 Deploying ${contract.name}...`);
    if (await deploy(contract.name, contract.file, nonce++)) {
      deployed++;
    }
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log(`✅ Deployed: ${deployed}/${CONTRACTS.length}`);
  console.log('═'.repeat(60));
}

main().catch(console.error);
