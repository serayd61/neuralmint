import type { Metadata } from "next";
import { Suspense } from "react";
import CreateClient from "./CreateClient";

export const metadata: Metadata = {
  title: "AI Studio",
  description: "Create stunning NFTs with DALL-E 3 and Stable Diffusion. Score your prompts with AI, enhance them, and mint on Stacks blockchain.",
};

export default function CreatePage() {
  return (
    <Suspense>
      <CreateClient />
    </Suspense>
  );
}
