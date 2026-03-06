import type { Metadata } from "next";
import PromptVaultClient from "./PromptVaultClient";

export const metadata: Metadata = {
  title: "Prompt Vault",
  description: "Explore curated AI prompts and the on-chain leaderboard. The best prompts create the most valuable NFTs on NeuralMint.",
};

export default function PromptsPage() {
  return <PromptVaultClient />;
}
