// ============================================
// NeuralMint — Mock Data for Landing Page
// ============================================

export interface MockNFT {
    id: string;
    tokenId: number;
    name: string;
    imageUrl: string;
    creator: { address: string; bnsName: string; avatarUrl: string };
    owner: { address: string; bnsName: string };
    priceStx: number;
    usdEquivalent: number;
    aiModel: "dall-e-3" | "stable-diffusion";
    rarity: number;
    likeCount: number;
    isLiked: boolean;
    category: string;
    collection?: string;
    isAuction: boolean;
    blocksRemaining?: number;
    currentBidStx?: number;
}

export interface MockCollection {
    id: string;
    slug: string;
    name: string;
    bannerUrl: string;
    avatarUrl: string;
    creator: { address: string; bnsName: string };
    floorPriceStx: number;
    volumeStx: number;
    change24h: number;
    itemCount: number;
    uniqueOwners: number;
}

export interface MockCreator {
    address: string;
    bnsName: string;
    avatarUrl: string;
    totalSalesStx: number;
    nftCount: number;
    followers: number;
    isVerified: boolean;
}

// Placeholder gradients as image URLs (CSS gradients simulating NFT artwork)
const nftImages = [
    "https://picsum.photos/seed/nft1/600/600",
    "https://picsum.photos/seed/nft2/600/600",
    "https://picsum.photos/seed/nft3/600/600",
    "https://picsum.photos/seed/nft4/600/600",
    "https://picsum.photos/seed/nft5/600/600",
    "https://picsum.photos/seed/nft6/600/600",
    "https://picsum.photos/seed/nft7/600/600",
    "https://picsum.photos/seed/nft8/600/600",
    "https://picsum.photos/seed/nft9/600/600",
    "https://picsum.photos/seed/nft10/600/600",
    "https://picsum.photos/seed/nft11/600/600",
    "https://picsum.photos/seed/nft12/600/600",
];

const collectionBanners = [
    "https://picsum.photos/seed/col1/1200/400",
    "https://picsum.photos/seed/col2/1200/400",
    "https://picsum.photos/seed/col3/1200/400",
    "https://picsum.photos/seed/col4/1200/400",
    "https://picsum.photos/seed/col5/1200/400",
    "https://picsum.photos/seed/col6/1200/400",
];

const avatars = [
    "https://picsum.photos/seed/avatar1/200/200",
    "https://picsum.photos/seed/avatar2/200/200",
    "https://picsum.photos/seed/avatar3/200/200",
    "https://picsum.photos/seed/avatar4/200/200",
    "https://picsum.photos/seed/avatar5/200/200",
    "https://picsum.photos/seed/avatar6/200/200",
    "https://picsum.photos/seed/avatar7/200/200",
    "https://picsum.photos/seed/avatar8/200/200",
];

export const mockNFTs: MockNFT[] = [
    {
        id: "1", tokenId: 1, name: "Cyber Genesis #001",
        imageUrl: nftImages[0],
        creator: { address: "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7", bnsName: "satoshi.btc", avatarUrl: avatars[0] },
        owner: { address: "SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE", bnsName: "collector.btc" },
        priceStx: 250, usdEquivalent: 375, aiModel: "dall-e-3", rarity: 92,
        likeCount: 142, isLiked: false, category: "Art", collection: "Cyber Genesis",
        isAuction: false,
    },
    {
        id: "2", tokenId: 2, name: "Neural Dream #042",
        imageUrl: nftImages[1],
        creator: { address: "SP1P72Z3704VMT3DMHPP2CB8TGQWGDBHD3RPR9GZS", bnsName: "neural.btc", avatarUrl: avatars[1] },
        owner: { address: "SP1P72Z3704VMT3DMHPP2CB8TGQWGDBHD3RPR9GZS", bnsName: "neural.btc" },
        priceStx: 180, usdEquivalent: 270, aiModel: "stable-diffusion", rarity: 78,
        likeCount: 89, isLiked: true, category: "Abstract", collection: "Neural Dreams",
        isAuction: true, blocksRemaining: 42, currentBidStx: 195,
    },
    {
        id: "3", tokenId: 3, name: "Bitcoin Punk #137",
        imageUrl: nftImages[2],
        creator: { address: "SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS", bnsName: "punk.btc", avatarUrl: avatars[2] },
        owner: { address: "SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE", bnsName: "collector.btc" },
        priceStx: 520, usdEquivalent: 780, aiModel: "dall-e-3", rarity: 95,
        likeCount: 312, isLiked: false, category: "PFP", collection: "Bitcoin Punks AI",
        isAuction: false,
    },
    {
        id: "4", tokenId: 4, name: "Stacks Horizon",
        imageUrl: nftImages[3],
        creator: { address: "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7", bnsName: "satoshi.btc", avatarUrl: avatars[0] },
        owner: { address: "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7", bnsName: "satoshi.btc" },
        priceStx: 75, usdEquivalent: 112, aiModel: "stable-diffusion", rarity: 45,
        likeCount: 34, isLiked: false, category: "Photography",
        isAuction: false,
    },
    {
        id: "5", tokenId: 5, name: "Neon Samurai",
        imageUrl: nftImages[4],
        creator: { address: "SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9", bnsName: "samurai.btc", avatarUrl: avatars[3] },
        owner: { address: "SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9", bnsName: "samurai.btc" },
        priceStx: 340, usdEquivalent: 510, aiModel: "dall-e-3", rarity: 88,
        likeCount: 256, isLiked: true, category: "Art", collection: "Neon Warriors",
        isAuction: true, blocksRemaining: 108, currentBidStx: 360,
    },
    {
        id: "6", tokenId: 6, name: "Digital Flora #008",
        imageUrl: nftImages[5],
        creator: { address: "SP1SRV0GPKMT5GCNMGQA44HNPQG6GH08JERVTQKR4", bnsName: "flora.btc", avatarUrl: avatars[4] },
        owner: { address: "SP3FBR2AGK5H9QBDH3EEN6DF8EK8JY7RX8QJ5SVTE", bnsName: "collector.btc" },
        priceStx: 120, usdEquivalent: 180, aiModel: "stable-diffusion", rarity: 62,
        likeCount: 78, isLiked: false, category: "Art",
        isAuction: false,
    },
    {
        id: "7", tokenId: 7, name: "Quantum Ghost",
        imageUrl: nftImages[6],
        creator: { address: "SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS", bnsName: "punk.btc", avatarUrl: avatars[2] },
        owner: { address: "SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS", bnsName: "punk.btc" },
        priceStx: 890, usdEquivalent: 1335, aiModel: "dall-e-3", rarity: 98,
        likeCount: 567, isLiked: false, category: "Abstract", collection: "Quantum Series",
        isAuction: false,
    },
    {
        id: "8", tokenId: 8, name: "Clarity Vision #023",
        imageUrl: nftImages[7],
        creator: { address: "SP1P72Z3704VMT3DMHPP2CB8TGQWGDBHD3RPR9GZS", bnsName: "neural.btc", avatarUrl: avatars[1] },
        owner: { address: "SP1P72Z3704VMT3DMHPP2CB8TGQWGDBHD3RPR9GZS", bnsName: "neural.btc" },
        priceStx: 45, usdEquivalent: 67, aiModel: "stable-diffusion", rarity: 33,
        likeCount: 22, isLiked: false, category: "Gaming",
        isAuction: false,
    },
];

export const mockCollections: MockCollection[] = [
    {
        id: "1", slug: "cyber-genesis", name: "Cyber Genesis",
        bannerUrl: collectionBanners[0], avatarUrl: avatars[0],
        creator: { address: "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7", bnsName: "satoshi.btc" },
        floorPriceStx: 150, volumeStx: 45000, change24h: 12.5, itemCount: 200, uniqueOwners: 89,
    },
    {
        id: "2", slug: "neural-dreams", name: "Neural Dreams",
        bannerUrl: collectionBanners[1], avatarUrl: avatars[1],
        creator: { address: "SP1P72Z3704VMT3DMHPP2CB8TGQWGDBHD3RPR9GZS", bnsName: "neural.btc" },
        floorPriceStx: 85, volumeStx: 28000, change24h: -3.2, itemCount: 500, uniqueOwners: 210,
    },
    {
        id: "3", slug: "bitcoin-punks-ai", name: "Bitcoin Punks AI",
        bannerUrl: collectionBanners[2], avatarUrl: avatars[2],
        creator: { address: "SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS", bnsName: "punk.btc" },
        floorPriceStx: 420, volumeStx: 120000, change24h: 24.8, itemCount: 1000, uniqueOwners: 456,
    },
    {
        id: "4", slug: "neon-warriors", name: "Neon Warriors",
        bannerUrl: collectionBanners[3], avatarUrl: avatars[3],
        creator: { address: "SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9", bnsName: "samurai.btc" },
        floorPriceStx: 250, volumeStx: 67000, change24h: 8.1, itemCount: 333, uniqueOwners: 178,
    },
    {
        id: "5", slug: "quantum-series", name: "Quantum Series",
        bannerUrl: collectionBanners[4], avatarUrl: avatars[2],
        creator: { address: "SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS", bnsName: "punk.btc" },
        floorPriceStx: 600, volumeStx: 200000, change24h: 15.3, itemCount: 100, uniqueOwners: 72,
    },
    {
        id: "6", slug: "digital-flora", name: "Digital Flora",
        bannerUrl: collectionBanners[5], avatarUrl: avatars[4],
        creator: { address: "SP1SRV0GPKMT5GCNMGQA44HNPQG6GH08JERVTQKR4", bnsName: "flora.btc" },
        floorPriceStx: 55, volumeStx: 12000, change24h: -1.5, itemCount: 150, uniqueOwners: 45,
    },
];

export const mockCreators: MockCreator[] = [
    { address: "SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7", bnsName: "satoshi.btc", avatarUrl: avatars[0], totalSalesStx: 45000, nftCount: 200, followers: 1250, isVerified: true },
    { address: "SP2ZNGJ85ENDY6QRHQ5P2D4FXKGZWCKTB2T0Z55KS", bnsName: "punk.btc", avatarUrl: avatars[2], totalSalesStx: 320000, nftCount: 1100, followers: 3400, isVerified: true },
    { address: "SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9", bnsName: "samurai.btc", avatarUrl: avatars[3], totalSalesStx: 67000, nftCount: 333, followers: 890, isVerified: true },
    { address: "SP1P72Z3704VMT3DMHPP2CB8TGQWGDBHD3RPR9GZS", bnsName: "neural.btc", avatarUrl: avatars[1], totalSalesStx: 28000, nftCount: 500, followers: 670, isVerified: false },
    { address: "SP1SRV0GPKMT5GCNMGQA44HNPQG6GH08JERVTQKR4", bnsName: "flora.btc", avatarUrl: avatars[4], totalSalesStx: 12000, nftCount: 150, followers: 320, isVerified: false },
    { address: "SP38P9VK5W5RC31M4BFNG4K2C0F0BAQXWA8TJA19Z", bnsName: "vortex.btc", avatarUrl: avatars[5], totalSalesStx: 8500, nftCount: 75, followers: 210, isVerified: false },
];

export const platformStats = {
    totalNftsMinted: 12847,
    totalVolumeStx: 2450000,
    activeCreators: 1893,
    floorPriceStx: 15,
    stxPriceUsd: 1.50,
};
