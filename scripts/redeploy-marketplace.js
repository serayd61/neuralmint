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

const PRIVATE_KEY = '4c664d1c1c36f56063823b6a7cbc8185ab9bcd84d4b291500667bc7ad5e3054b01';
const ADDRESS = 'SP2PEBKJ2W1ZDDF2QQ6Y4FXKZEDPT9J9R2NKD9WJB';
const network = STACKS_MAINNET;

async function getCurrentNonce() {
  const response = await fetch(`https://api.mainnet.hiro.so/extended/v1/address/${ADDRESS}/nonces`);
  const data = await response.json();
  return BigInt(data.possible_next_nonce);
}

async function main() {
  const contractsDir = path.join(__dirname, '..', 'clarity', 'contracts');
  
  // Deploy with new names since originals might have failed
  const contracts = [
    { name: 'neuralmint-market-v1', file: 'neuralmint-marketplace.clar' },
    { name: 'neuralmint-lazymint-v1', file: 'neuralmint-lazy-mint.clar' },
  ];
  
  let nonce = await getCurrentNonce();
  console.log(`Starting nonce: ${nonce}\n`);
  
  for (const c of contracts) {
    const code = fs.readFileSync(path.join(contractsDir, c.file), 'utf-8');
    
    try {
      const tx = await makeContractDeploy({
        contractName: c.name,
        codeBody: code,
        senderKey: PRIVATE_KEY,
        network,
        anchorMode: AnchorMode.Any,
        fee: 15000n,
        nonce: nonce++
      });
      
      const result = await broadcastTransaction({ transaction: tx, network });
      
      if (result.error) {
        console.log(`❌ ${c.name}: ${result.reason}`);
      } else {
        console.log(`✓ ${c.name}: ${result.txid}`);
      }
    } catch (e) {
      console.log(`❌ ${c.name}: ${e.message.slice(0, 60)}`);
    }
    
    await new Promise(r => setTimeout(r, 500));
  }
}

main().catch(console.error);
