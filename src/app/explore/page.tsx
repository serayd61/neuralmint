import type { Metadata } from "next";
import ExploreClient from "./ExploreClient";

export const metadata: Metadata = {
  title: "Explore NFTs",
  description: "Discover AI-generated NFTs scored by prompt quality on the NeuralMint marketplace. Filter by price, rarity, AI model, and more.",
};

export default function ExplorePage() {
  return <ExploreClient />;
}
