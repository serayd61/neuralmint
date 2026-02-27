"use client";

import { useState } from "react";
import { Sparkles, Wand2, ImagePlus, Zap, Coins, Loader2, Check } from "lucide-react";
import { useWalletStore } from "@/stores/wallet-store";
import { mintNFT } from "@/lib/contracts";
import { AI_MODELS } from "@/lib/constants";

type GenerationState = "idle" | "generating" | "generated" | "uploading" | "minting" | "success";

export default function CreatePage() {
  const { isConnected, stxAddress } = useWalletStore();
  const [state, setState] = useState<GenerationState>("idle");
  const [selectedModel, setSelectedModel] = useState("dall-e-3");
  const [prompt, setPrompt] = useState(
    "A cyberpunk fox shaman, neon runes, volumetric lights, high detail, futuristic Istanbul skyline."
  );
  const [size, setSize] = useState("1024x1024");
  const [style, setStyle] = useState("vivid");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [promptHash, setPromptHash] = useState<string>("");
  const [nftName, setNftName] = useState("Neon Fox Oracle");
  const [nftDescription, setNftDescription] = useState("AI generated cyberpunk artwork minted on Stacks.");
  const [listAfterMint, setListAfterMint] = useState(true);
  const [listingPrice, setListingPrice] = useState(85);
  const [royaltyBps, setRoyaltyBps] = useState(500); // 5%
  const [error, setError] = useState<string | null>(null);
  const [txId, setTxId] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    setState("generating");
    setError(null);

    try {
      const response = await fetch("/api/v1/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          model: selectedModel,
          size,
          style,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Generation failed");
      }

      setGeneratedImage(data.imageUrl);
      setPromptHash(data.promptHash);
      setState("generated");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
      setState("idle");
    }
  };

  const handleMint = async () => {
    if (!isConnected || !stxAddress) {
      setError("Please connect your wallet first");
      return;
    }

    if (!generatedImage) {
      setError("Please generate an image first");
      return;
    }

    setState("uploading");
    setError(null);

    try {
      // Upload to IPFS
      const uploadResponse = await fetch("/api/v1/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: generatedImage,
          name: nftName,
          description: nftDescription,
          attributes: [
            { trait_type: "AI Model", value: selectedModel },
            { trait_type: "Style", value: style },
          ],
          aiMetadata: {
            model: selectedModel,
            promptHash,
          },
        }),
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadData.error || "Upload failed");
      }

      setState("minting");

      // Mint NFT
      await mintNFT({
        recipient: stxAddress,
        uri: uploadData.metadataUri,
        royaltyRecipient: stxAddress,
        royaltyBps,
        aiModel: selectedModel,
        promptHash,
        generationParams: JSON.stringify({ size, style, prompt: prompt.slice(0, 100) }),
      });

      setState("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Minting failed");
      setState("generated");
    }
  };

  const getButtonText = () => {
    switch (state) {
      case "generating":
        return "Generating...";
      case "uploading":
        return "Uploading to IPFS...";
      case "minting":
        return "Confirm in Wallet...";
      case "success":
        return "Minted Successfully!";
      default:
        return "Mint NFT";
    }
  };

  const isProcessing = ["generating", "uploading", "minting"].includes(state);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-text-muted">AI Studio</p>
          <h1 className="font-heading text-2xl font-semibold text-text-primary">
            Create Your NFT
          </h1>
        </div>
        {!isConnected && (
          <div className="rounded-lg border border-neon-orange/20 bg-neon-orange/10 px-3 py-1.5 text-xs text-neon-orange">
            Connect wallet to mint
          </div>
        )}
      </header>

      {error && (
        <div className="rounded-lg border border-neon-red/30 bg-neon-red/10 px-4 py-3 text-sm text-neon-red">
          {error}
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="neon-card p-4">
            <h2 className="mb-3 text-sm font-semibold text-text-primary">1) AI Model</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {AI_MODELS.map((model) => (
                <button
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  className={`rounded-lg border p-3 text-left transition-all ${
                    selectedModel === model.id
                      ? "border-neon-cyan/30 bg-neon-cyan/10"
                      : "border-white/10 bg-bg-card hover:border-neon-purple/30"
                  }`}
                >
                  <p className={`text-xs font-semibold ${selectedModel === model.id ? "text-neon-cyan" : "text-text-primary"}`}>
                    {model.name}
                  </p>
                  <p className="mt-1 text-[11px] text-text-secondary">{model.provider}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="neon-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-primary">2) Prompt</h2>
              <button className="inline-flex items-center gap-1 rounded-md border border-neon-purple/30 bg-neon-purple/10 px-2.5 py-1 text-[11px] text-neon-purple">
                <Wand2 size={12} />
                Enhance with AI
              </button>
            </div>
            <textarea
              rows={6}
              placeholder="Describe your vision..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-bg-card px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-neon-cyan/50 focus:outline-none"
            />
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <select
                value={size}
                onChange={(e) => setSize(e.target.value)}
                className="rounded-lg border border-white/10 bg-bg-card px-3 py-2.5 text-xs text-text-secondary focus:border-neon-cyan/50 focus:outline-none"
              >
                <option value="1024x1024">Size: 1024x1024</option>
                <option value="1024x1792">Size: 1024x1792</option>
                <option value="1792x1024">Size: 1792x1024</option>
              </select>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="rounded-lg border border-white/10 bg-bg-card px-3 py-2.5 text-xs text-text-secondary focus:border-neon-cyan/50 focus:outline-none"
              >
                <option value="vivid">Style: Vivid</option>
                <option value="natural">Style: Natural</option>
              </select>
            </div>
            <button
              onClick={handleGenerate}
              disabled={isProcessing}
              className="btn-primary mt-3 inline-flex w-full items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {state === "generating" ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Sparkles size={15} />
              )}
              {state === "generating" ? "Generating..." : "Generate"}
            </button>
          </div>

          <div className="neon-card p-4">
            <h2 className="mb-3 text-sm font-semibold text-text-primary">3) Session History</h2>
            <div className="grid grid-cols-4 gap-2">
              {generatedImage ? (
                <div className="relative overflow-hidden rounded-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={generatedImage} alt="Generated" className="h-16 w-full object-cover" />
                </div>
              ) : null}
              {[...Array(generatedImage ? 3 : 4)].map((_, i) => (
                <div key={i} className="shimmer h-16 rounded-md" />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="neon-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-primary">Preview</h2>
              {generatedImage && (
                <button
                  onClick={handleGenerate}
                  disabled={isProcessing}
                  className="rounded-md border border-white/10 bg-bg-card px-2.5 py-1 text-[11px] text-text-secondary disabled:opacity-50"
                >
                  Regenerate
                </button>
              )}
            </div>
            <div className="overflow-hidden rounded-lg border border-white/10">
              {generatedImage ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={generatedImage}
                  alt="Generated NFT"
                  className="h-72 w-full object-cover"
                />
              ) : (
                <div className="flex h-72 items-center justify-center bg-bg-card text-text-muted">
                  <span className="inline-flex items-center gap-2 text-sm">
                    <ImagePlus size={16} />
                    Generated image preview
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="neon-card space-y-3 p-4">
            <h2 className="text-sm font-semibold text-text-primary">NFT Metadata</h2>
            <input
              type="text"
              value={nftName}
              onChange={(e) => setNftName(e.target.value)}
              placeholder="NFT Name"
              className="w-full rounded-lg border border-white/10 bg-bg-card px-3 py-2.5 text-sm text-text-primary focus:border-neon-cyan/50 focus:outline-none"
            />
            <textarea
              rows={3}
              value={nftDescription}
              onChange={(e) => setNftDescription(e.target.value)}
              placeholder="Description"
              className="w-full rounded-lg border border-white/10 bg-bg-card px-3 py-2.5 text-sm text-text-primary focus:border-neon-cyan/50 focus:outline-none"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <select
                value={listAfterMint ? "yes" : "no"}
                onChange={(e) => setListAfterMint(e.target.value === "yes")}
                className="rounded-lg border border-white/10 bg-bg-card px-3 py-2.5 text-xs text-text-secondary focus:border-neon-cyan/50 focus:outline-none"
              >
                <option value="yes">List after mint: Yes</option>
                <option value="no">List after mint: No</option>
              </select>
              <select className="rounded-lg border border-white/10 bg-bg-card px-3 py-2.5 text-xs text-text-secondary focus:border-neon-cyan/50 focus:outline-none">
                <option>Listing type: Fixed</option>
                <option>Listing type: Auction</option>
                <option>Listing type: Lazy Mint</option>
              </select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[11px] text-text-muted">Price (STX)</label>
                <input
                  type="number"
                  value={listingPrice}
                  onChange={(e) => setListingPrice(Number(e.target.value))}
                  className="w-full rounded-lg border border-white/10 bg-bg-card px-3 py-2.5 text-xs text-text-primary focus:border-neon-cyan/50 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] text-text-muted">Royalty (%)</label>
                <input
                  type="number"
                  value={royaltyBps / 100}
                  onChange={(e) => setRoyaltyBps(Number(e.target.value) * 100)}
                  max={10}
                  className="w-full rounded-lg border border-white/10 bg-bg-card px-3 py-2.5 text-xs text-text-primary focus:border-neon-cyan/50 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="neon-card p-4">
            <h2 className="mb-2 text-sm font-semibold text-text-primary">Cost Breakdown</h2>
            <div className="space-y-1.5 text-xs text-text-secondary">
              <p className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1">
                  <Zap size={12} className="text-neon-purple" />
                  AI generation
                </span>
                <span className="font-mono">2.00 STX</span>
              </p>
              <p className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1">
                  <Coins size={12} className="text-neon-orange" />
                  TX fee estimate
                </span>
                <span className="font-mono">0.01 STX</span>
              </p>
              <p className="mt-2 flex items-center justify-between border-t border-white/10 pt-2 text-text-primary">
                <span>Total</span>
                <span className="font-mono text-neon-cyan">2.01 STX</span>
              </p>
            </div>
            <button
              onClick={handleMint}
              disabled={!isConnected || !generatedImage || isProcessing || state === "success"}
              className={`mt-3 w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                state === "success"
                  ? "bg-neon-green/20 text-neon-green"
                  : "btn-primary disabled:opacity-50"
              }`}
            >
              {isProcessing && <Loader2 size={14} className="mr-2 inline animate-spin" />}
              {state === "success" && <Check size={14} className="mr-2 inline" />}
              {getButtonText()}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
