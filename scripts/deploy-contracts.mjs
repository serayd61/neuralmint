#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  AnchorMode,
  broadcastTransaction,
  getAddressFromPrivateKey,
  makeContractDeploy,
} from "@stacks/transactions";
import { createNetwork } from "@stacks/network";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const networkName = process.env.STACKS_DEPLOY_NETWORK || process.env.NEXT_PUBLIC_STACKS_NETWORK || "testnet";
const privateKey = process.env.STACKS_DEPLOYER_KEY;

if (!privateKey) {
  console.error("STACKS_DEPLOYER_KEY eksik. .env.local veya shell env içine ekleyin.");
  process.exit(1);
}

const apiBase =
  networkName === "mainnet"
    ? "https://api.mainnet.hiro.so"
    : "https://api.testnet.hiro.so";

const network = createNetwork(networkName);
const deployerAddress = getAddressFromPrivateKey(privateKey, networkName);

const contracts = [
  { name: "sip009-nft-trait", file: "clarity/contracts/sip009-nft-trait.clar" },
  { name: "neuralmint-nft", file: "clarity/contracts/neuralmint-nft.clar" },
  { name: "neuralmint-marketplace", file: "clarity/contracts/neuralmint-marketplace.clar" },
  { name: "neuralmint-lazy-mint", file: "clarity/contracts/neuralmint-lazy-mint.clar" },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getAccountNonce(address) {
  const res = await fetch(`${apiBase}/v2/accounts/${address}?proof=0`);
  if (!res.ok) {
    throw new Error(`Nonce alınamadı: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return Number(data.nonce);
}

async function waitForTx(txid) {
  const maxAttempts = 80;
  for (let i = 0; i < maxAttempts; i += 1) {
    const res = await fetch(`${apiBase}/extended/v1/tx/${txid}`);
    if (res.ok) {
      const tx = await res.json();
      const status = tx.tx_status;
      if (status === "success") return tx;
      if (status?.startsWith("abort")) {
        throw new Error(`TX başarısız (${txid}): ${status}`);
      }
    }
    await sleep(15000);
  }
  throw new Error(`TX zaman aşımı: ${txid}`);
}

async function deployAll() {
  console.log(`Network: ${networkName}`);
  console.log(`Deployer: ${deployerAddress}`);

  let nonce = await getAccountNonce(deployerAddress);
  console.log(`Başlangıç nonce: ${nonce}`);

  for (const contract of contracts) {
    const fullPath = path.join(rootDir, contract.file);
    const codeBody = await readFile(fullPath, "utf8");
    console.log(`\nDeploying ${contract.name} ...`);

    const tx = await makeContractDeploy({
      contractName: contract.name,
      codeBody,
      senderKey: privateKey,
      network,
      anchorMode: AnchorMode.Any,
      nonce: BigInt(nonce),
      fee: BigInt(120000),
    });

    const result = await broadcastTransaction({ transaction: tx, network });
    if ("error" in result) {
      throw new Error(`${contract.name} broadcast failed: ${result.reason || result.error}`);
    }

    const txid = result.txid;
    console.log(`${contract.name} txid: ${txid}`);
    await waitForTx(txid);
    console.log(`${contract.name} deployed`);
    nonce += 1;
  }

  console.log("\nTüm kontratlar deploy edildi.");
  console.log("NFT Contract:", `${deployerAddress}.neuralmint-nft`);
  console.log("Marketplace Contract:", `${deployerAddress}.neuralmint-marketplace`);
  console.log("Lazy Mint Contract:", `${deployerAddress}.neuralmint-lazy-mint`);
}

deployAll().catch((err) => {
  console.error("\nDeploy hata:", err.message);
  process.exit(1);
});
