// ============================================
// NeuralMint — Constants & Configuration
// ============================================

export const APP_NAME = "NeuralMint";
export const APP_DESCRIPTION = "AI-Powered NFT Marketplace on Stacks — Secured by Bitcoin";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Stacks Network
export const STACKS_NETWORK = process.env.NEXT_PUBLIC_STACKS_NETWORK || "mainnet";
export const STACKS_MAINNET_API = "https://api.mainnet.hiro.so";
export const STACKS_TESTNET_API = "https://api.testnet.hiro.so";
export const STACKS_API_URL = STACKS_NETWORK === "mainnet" ? STACKS_MAINNET_API : STACKS_TESTNET_API;

// Deployer Address
export const DEPLOYER_ADDRESS = "SP2PEBKJ2W1ZDDF2QQ6Y4FXKZEDPT9J9R2NKD9WJB";

// Contract Addresses (deployer + contract name)
export const NFT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS || DEPLOYER_ADDRESS;
export const NFT_CONTRACT_NAME = process.env.NEXT_PUBLIC_NFT_CONTRACT_NAME || "neuralmint-nft";
export const MARKETPLACE_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS || DEPLOYER_ADDRESS;
export const MARKETPLACE_CONTRACT_NAME = process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_NAME || "neuralmint-marketplace";
export const LAZY_MINT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_LAZY_MINT_CONTRACT_ADDRESS || DEPLOYER_ADDRESS;
export const LAZY_MINT_CONTRACT_NAME = process.env.NEXT_PUBLIC_LAZY_MINT_CONTRACT_NAME || "neuralmint-lazy-mint";

// Deployed NFT Collections
export const NFT_COLLECTIONS = [
  { address: DEPLOYER_ADDRESS, name: "neuralmint-cyber-genesis", symbol: "CYBER", maxSupply: 1000 },
  { address: DEPLOYER_ADDRESS, name: "neuralmint-neural-dreams", symbol: "DREAM", maxSupply: 500 },
  { address: DEPLOYER_ADDRESS, name: "neuralmint-bitcoin-punks", symbol: "BPUNK", maxSupply: 2100 },
  { address: DEPLOYER_ADDRESS, name: "neuralmint-stacks-horizon", symbol: "HORZ", maxSupply: 750 },
  { address: DEPLOYER_ADDRESS, name: "neuralmint-neon-samurai", symbol: "NEON", maxSupply: 888 },
] as const;

// Platform
export const PLATFORM_FEE_BPS = 100; // 1%
export const MAX_ROYALTY_BPS = 1000; // 10%
export const MICRO_STX_PER_STX = 1_000_000;

// Block Time Estimates
export const BLOCKS_PER_HOUR = 6;
export const BLOCKS_PER_DAY = 144;
export const BLOCKS_PER_WEEK = 1008;
export const BLOCKS_PER_MONTH = 4320;

// Duration Presets (in blocks)
export const DURATION_PRESETS = [
    { label: "1 Day", blocks: 144 },
    { label: "3 Days", blocks: 432 },
    { label: "7 Days", blocks: 1008 },
    { label: "30 Days", blocks: 4320 },
] as const;

// Rarity Tiers
export const RARITY_TIERS = [
    { name: "Common", min: 0, max: 20, color: "#6B7280" },
    { name: "Uncommon", min: 21, max: 40, color: "#39FF14" },
    { name: "Rare", min: 41, max: 60, color: "#00F5FF" },
    { name: "Epic", min: 61, max: 80, color: "#BF00FF" },
    { name: "Legendary", min: 81, max: 100, color: "#FFE600" },
] as const;

// AI Models
export const AI_MODELS = [
    { id: "dall-e-3", name: "DALL-E 3", provider: "OpenAI" },
    { id: "stable-diffusion", name: "Stable Diffusion", provider: "Replicate" },
] as const;

// Categories
export const NFT_CATEGORIES = [
    "Art",
    "Photography",
    "Music",
    "Gaming",
    "PFP",
    "Abstract",
] as const;

// Navigation Links
export const NAV_LINKS = [
    { href: "/explore", label: "Explore" },
    { href: "/create", label: "AI Studio" },
    { href: "/collections", label: "Collections" },
    { href: "/dashboard", label: "Dashboard" },
] as const;

// Social Links
export const SOCIAL_LINKS = {
    twitter: "https://twitter.com/NeuralMint",
    discord: "https://discord.gg/neuralmint",
    github: "https://github.com/neuralmint",
    forum: "https://forum.stacks.org",
} as const;

// Supported Languages
export const LANGUAGES = [
    { code: "en", label: "EN", name: "English" },
    { code: "tr", label: "TR", name: "Türkçe" },
    { code: "de", label: "DE", name: "Deutsch" },
] as const;
