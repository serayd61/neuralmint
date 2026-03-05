#!/usr/bin/env node
/* eslint-disable no-console */
const { makeSTXTokenTransfer, broadcastTransaction, AnchorMode, getAddressFromPrivateKey } = require("@stacks/transactions");
const { STACKS_MAINNET } = require("@stacks/network");

const HIRO_API = process.env.HIRO_API || "https://api.mainnet.hiro.so";
const PRIVATE_KEY = process.env.STACKS_PRIVATE_KEY || process.env.STACKS_DEPLOYER_KEY;
const SOURCE_ADDRESS = process.env.STACKS_ADDRESS;
const SAFE_ADDRESS = process.env.SAFE_ADDRESS;

const POLL_MS = Number(process.env.POLL_MS || 2500);
const MIN_BALANCE_MICROSTX = BigInt(process.env.MIN_BALANCE_MICROSTX || "100000");
const FEE_MICROSTX = BigInt(process.env.FEE_MICROSTX || "100000");
const SAFETY_BUFFER_MICROSTX = BigInt(process.env.SAFETY_BUFFER_MICROSTX || "50000");
const EXIT_AFTER_SUCCESS = process.env.EXIT_AFTER_SUCCESS !== "false";

function requireEnv() {
  const missing = [];
  if (!PRIVATE_KEY) missing.push("STACKS_PRIVATE_KEY or STACKS_DEPLOYER_KEY");
  if (!SOURCE_ADDRESS) missing.push("STACKS_ADDRESS");
  if (!SAFE_ADDRESS) missing.push("SAFE_ADDRESS");
  if (missing.length) {
    console.error(`Missing required env vars: ${missing.join(", ")}`);
    process.exit(1);
  }
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

async function getBalanceMicrostx(address) {
  const data = await fetchJson(`${HIRO_API}/extended/v1/address/${address}/stx`);
  return BigInt(data.balance || "0");
}

async function getNextNonce(address) {
  const data = await fetchJson(`${HIRO_API}/extended/v1/address/${address}/nonces`);
  return BigInt(data.possible_next_nonce || 0);
}

function calcSweepAmount(balance) {
  const amount = balance - FEE_MICROSTX - SAFETY_BUFFER_MICROSTX;
  return amount > 0n ? amount : 0n;
}

async function trySweepOnce() {
  const [balance, nonce] = await Promise.all([
    getBalanceMicrostx(SOURCE_ADDRESS),
    getNextNonce(SOURCE_ADDRESS),
  ]);

  if (balance < MIN_BALANCE_MICROSTX) {
    console.log(`[${new Date().toISOString()}] balance=${balance} below trigger=${MIN_BALANCE_MICROSTX}`);
    return false;
  }

  const amount = calcSweepAmount(balance);
  if (amount <= 0n) {
    console.log(`[${new Date().toISOString()}] balance=${balance} not enough after fee/buffer`);
    return false;
  }

  console.log(`[${new Date().toISOString()}] trying sweep amount=${amount} nonce=${nonce} fee=${FEE_MICROSTX}`);
  const tx = await makeSTXTokenTransfer({
    recipient: SAFE_ADDRESS,
    amount,
    senderKey: PRIVATE_KEY,
    network: STACKS_MAINNET,
    anchorMode: AnchorMode.Any,
    fee: FEE_MICROSTX,
    nonce,
  });

  const result = await broadcastTransaction({ transaction: tx, network: STACKS_MAINNET });
  if (result && result.txid) {
    console.log(`[SUCCESS] txid=${result.txid} amount=${amount} -> ${SAFE_ADDRESS}`);
    return true;
  }

  console.log(`[FAILED] ${JSON.stringify(result)}`);
  return false;
}

async function main() {
  requireEnv();

  try {
    const derived = getAddressFromPrivateKey(PRIVATE_KEY, STACKS_MAINNET);
    if (derived !== SOURCE_ADDRESS) {
      console.error(`Address mismatch. key=>${derived} but STACKS_ADDRESS=>${SOURCE_ADDRESS}`);
      process.exit(1);
    }
  } catch (err) {
    console.error(`Could not verify private key/address match: ${err.message}`);
    process.exit(1);
  }

  console.log("Emergency sweeper started.");
  console.log(`Watching: ${SOURCE_ADDRESS}`);
  console.log(`Safe address: ${SAFE_ADDRESS}`);
  console.log(`Poll: ${POLL_MS}ms | min trigger: ${MIN_BALANCE_MICROSTX} | fee: ${FEE_MICROSTX}`);

  while (true) {
    try {
      const success = await trySweepOnce();
      if (success && EXIT_AFTER_SUCCESS) process.exit(0);
    } catch (err) {
      console.log(`[ERROR] ${err.message}`);
    }
    await new Promise(resolve => setTimeout(resolve, POLL_MS));
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
