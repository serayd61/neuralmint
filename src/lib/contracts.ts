import {
  makeContractCall,
  PostConditionMode,
  uintCV,
  stringAsciiCV,
  principalCV,
  bufferCV,
  AnchorMode,
} from '@stacks/transactions';
import { openContractCall } from '@stacks/connect';
import {
  NFT_CONTRACT_ADDRESS,
  NFT_CONTRACT_NAME,
  MARKETPLACE_CONTRACT_ADDRESS,
  MARKETPLACE_CONTRACT_NAME,
  LAZY_MINT_CONTRACT_ADDRESS,
  LAZY_MINT_CONTRACT_NAME,
  MICRO_STX_PER_STX,
} from './constants';

export interface MintParams {
  recipient: string;
  uri: string;
  royaltyRecipient: string;
  royaltyBps: number;
  aiModel: string;
  promptHash: string;
  generationParams: string;
}

export interface ListingParams {
  nftContract: string;
  tokenId: number;
  priceStx: number;
  durationBlocks: number;
}

export interface BuyParams {
  listingId: number;
  nftContract: string;
}

export async function mintNFT(params: MintParams) {
  const contractAddress = NFT_CONTRACT_ADDRESS;
  const contractName = NFT_CONTRACT_NAME;

  if (!contractAddress) {
    throw new Error('NFT contract address not configured');
  }

  const promptHashBuffer = Buffer.from(params.promptHash.padEnd(64, '0').slice(0, 64), 'hex');

  const functionArgs = [
    principalCV(params.recipient),
    stringAsciiCV(params.uri.slice(0, 256)),
    principalCV(params.royaltyRecipient),
    uintCV(params.royaltyBps),
    stringAsciiCV(params.aiModel.slice(0, 50)),
    bufferCV(promptHashBuffer),
    stringAsciiCV(params.generationParams.slice(0, 500)),
  ];

  return openContractCall({
    contractAddress,
    contractName,
    functionName: 'mint',
    functionArgs,
    postConditionMode: PostConditionMode.Allow,
    onFinish: (data) => {
      console.log('Mint transaction:', data.txId);
      return data;
    },
    onCancel: () => {
      console.log('Mint cancelled');
    },
  });
}

export async function listItem(params: ListingParams) {
  const contractAddress = MARKETPLACE_CONTRACT_ADDRESS;
  const contractName = MARKETPLACE_CONTRACT_NAME;

  if (!contractAddress) {
    throw new Error('Marketplace contract address not configured');
  }

  const priceInMicroStx = Math.floor(params.priceStx * MICRO_STX_PER_STX);

  return openContractCall({
    contractAddress,
    contractName,
    functionName: 'list-item',
    functionArgs: [
      principalCV(params.nftContract),
      uintCV(params.tokenId),
      uintCV(priceInMicroStx),
      uintCV(params.durationBlocks),
    ],
    postConditionMode: PostConditionMode.Allow,
    onFinish: (data) => {
      console.log('List transaction:', data.txId);
      return data;
    },
  });
}

export async function buyItem(params: BuyParams) {
  const contractAddress = MARKETPLACE_CONTRACT_ADDRESS;
  const contractName = MARKETPLACE_CONTRACT_NAME;

  if (!contractAddress) {
    throw new Error('Marketplace contract address not configured');
  }

  return openContractCall({
    contractAddress,
    contractName,
    functionName: 'buy-item',
    functionArgs: [
      uintCV(params.listingId),
      principalCV(params.nftContract),
    ],
    postConditionMode: PostConditionMode.Allow,
    onFinish: (data) => {
      console.log('Buy transaction:', data.txId);
      return data;
    },
  });
}

export async function cancelListing(listingId: number, nftContract: string) {
  const contractAddress = MARKETPLACE_CONTRACT_ADDRESS;
  const contractName = MARKETPLACE_CONTRACT_NAME;

  if (!contractAddress) {
    throw new Error('Marketplace contract address not configured');
  }

  return openContractCall({
    contractAddress,
    contractName,
    functionName: 'cancel-listing',
    functionArgs: [
      uintCV(listingId),
      principalCV(nftContract),
    ],
    postConditionMode: PostConditionMode.Allow,
    onFinish: (data) => {
      console.log('Cancel transaction:', data.txId);
      return data;
    },
  });
}

export async function redeemLazyMint(
  voucherHash: string,
  creator: string,
  uri: string,
  minPrice: number,
  royaltyBps: number,
  aiModel: string,
  promptHash: string,
  paymentStx: number
) {
  const contractAddress = LAZY_MINT_CONTRACT_ADDRESS;
  const contractName = LAZY_MINT_CONTRACT_NAME;

  if (!contractAddress) {
    throw new Error('Lazy mint contract address not configured');
  }

  const voucherHashBuffer = Buffer.from(voucherHash.padEnd(64, '0').slice(0, 64), 'hex');
  const promptHashBuffer = Buffer.from(promptHash.padEnd(64, '0').slice(0, 64), 'hex');

  return openContractCall({
    contractAddress,
    contractName,
    functionName: 'redeem-voucher',
    functionArgs: [
      bufferCV(voucherHashBuffer),
      principalCV(creator),
      stringAsciiCV(uri.slice(0, 256)),
      uintCV(Math.floor(minPrice * MICRO_STX_PER_STX)),
      uintCV(royaltyBps),
      stringAsciiCV(aiModel.slice(0, 50)),
      bufferCV(promptHashBuffer),
      uintCV(Math.floor(paymentStx * MICRO_STX_PER_STX)),
    ],
    postConditionMode: PostConditionMode.Allow,
    onFinish: (data) => {
      console.log('Lazy mint transaction:', data.txId);
      return data;
    },
  });
}
