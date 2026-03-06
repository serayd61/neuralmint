"use client";

import dynamic from "next/dynamic";

const CreateClient = dynamic(() => import("./CreateClient"), {
  ssr: false,
  loading: () => (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-text-muted">AI Studio</p>
        <h1 className="font-heading text-2xl font-semibold text-text-primary">Create Your NFT</h1>
      </div>
      <div className="mt-8 flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neon-cyan border-t-transparent" />
      </div>
    </div>
  ),
});

export default function CreatePage() {
  return <CreateClient />;
}
