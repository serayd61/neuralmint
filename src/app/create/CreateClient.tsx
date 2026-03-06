"use client";

import { useState, useEffect, useMemo, useDeferredValue } from "react";
import { useSearchParams } from "next/navigation";
import { Sparkles, Wand2, ImagePlus, Zap, Coins, Loader2, Check, Wallet, Cloud, Server, RotateCcw, Bot } from "lucide-react";
import { useWalletStore } from "@/stores/wallet-store";
import { AI_MODELS } from "@/lib/constants";
import { scorePrompt } from "@/lib/prompt-scoring";
import { PromptScoreBadge } from "@/components/shared/PromptScoreBadge";
import { PROMPT_TIER_CONFIG, getPromptTier, getSuggestedMintPrice } from "@/lib/prompt-utils";
import { PromptBotPanel } from "@/components/prompt-bot/PromptBotPanel";

type GenerationState = "idle" | "generating" | "generated" | "paying" | "uploading" | "minting" | "success";

interface ProviderAvailability {
  openai: boolean;
  openclaw: boolean;
  stableDiffusion: boolean;
}

interface SessionImage {
  url: string;
  prompt: string;
  model: string;
  timestamp: number;
}

export default function CreateClient() {
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
  const [enhancing, setEnhancing] = useState(false);
  const [providers, setProviders] = useState<ProviderAvailability | null>(null);
  const [sessionImages, setSessionImages] = useState<SessionImage[]>([]);

  const [promptBotOpen, setPromptBotOpen] = useState(false);

  // URL params from Prompt Vault
  const searchParams = useSearchParams();
  useEffect(() => {
    const prefilledPrompt = searchParams.get("prompt");
    const prefilledModel = searchParams.get("model");
    if (prefilledPrompt) setPrompt(decodeURIComponent(prefilledPrompt));
    if (prefilledModel && AI_MODELS.some((m) => m.id === prefilledModel)) {
      setSelectedModel(prefilledModel);
    }
  }, [searchParams]);

  // Live prompt scoring
  const deferredPrompt = useDeferredValue(prompt);
  const promptScoreBreakdown = useMemo(
    () => scorePrompt(deferredPrompt, selectedModel),
    [deferredPrompt, selectedModel]
  );
  const promptTier = getPromptTier(promptScoreBreakdown.overall);
  const tierConfig = PROMPT_TIER_CONFIG[promptTier];

  // Fetch available providers on mount
  useEffect(() => {
    fetch("/api/v1/providers")
      .then((res) => res.json())
      .then((data) => setProviders(data))
      .catch(() => setProviders({ openai: false, openclaw: false, stableDiffusion: false }));
  }, []);

  // Load session history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("neuralmint-session-images");
      if (saved) setSessionImages(JSON.parse(saved));
    } catch {}
  }, []);

  // Save session history to localStorage
  const addSessionImage = (img: SessionImage) => {
    setSessionImages((prev) => {
      const updated = [img, ...prev].slice(0, 12);
      try { localStorage.setItem("neuralmint-session-images", JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  // Get selected model config
  const selectedModelConfig = AI_MODELS.find((m) => m.id === selectedModel);
  const generationFee = selectedModelConfig?.fee ?? 2.0;
  const selectedProvider = selectedModelConfig?.providerType ?? "openai";

  // Check if selected provider is available
  const isProviderAvailable = (providerType: string) => {
    if (!providers) return true;
    if (providerType === "openai") return providers.openai;
    if (providerType === "openclaw") return providers.openclaw || providers.stableDiffusion;
    return false;
  };

  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) return;
    setEnhancing(true);
    try {
      const res = await fetch("/api/v1/enhance-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, provider: selectedProvider }),
      });
      const data = await res.json();
      if (data.success && data.enhanced) {
        setPrompt(data.enhanced);
      }
    } catch (err) {
      console.error("Enhance failed:", err);
    } finally {
      setEnhancing(false);
    }
  };

  // Generate image for FREE — no payment required
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    setError(null);
    setState("generating");

    try {
      const response = await fetch("/api/v1/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          model: selectedModel,
          size,
          style,
          provider: selectedProvider,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Generation failed");
      }

      setGeneratedImage(data.imageUrl);
      setPromptHash(data.promptHash);
      setState("generated");

      // Add to session history
      addSessionImage({
        url: data.imageUrl,
        prompt: prompt.slice(0, 100),
        model: selectedModel,
        timestamp: Date.now(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
      setState("idle");
    }
  };

  // Mint NFT — payment happens HERE
  const handleMint = async () => {
    if (!isConnected || !stxAddress) {
      setError("Please connect your wallet first");
      return;
    }

    if (!generatedImage) {
      setError("Please generate an image first");
      return;
    }

    // Step 1: Pay minting fee
    setState("paying");
    setError(null);

    let paymentTxId: string;
    try {
      const { payGenerationFee } = await import("@/lib/fee-service");
      paymentTxId = await payGenerationFee(generationFee);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
      setState("generated");
      return;
    }

    // Step 2: Upload to IPFS
    setState("uploading");

    try {
      const uploadResponse = await fetch("/api/v1/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: generatedImage,
          name: nftName,
          description: nftDescription,
          attributes: [
            { trait_type: "AI Model", value: selectedModel },
            { trait_type: "AI Provider", value: selectedProvider },
            { trait_type: "Style", value: style },
          ],
          aiMetadata: {
            model: selectedModel,
            provider: selectedProvider,
            promptHash,
            txId: paymentTxId,
          },
        }),
      });

      const uploadData = await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(uploadData.error || "Upload failed");
      }

      // Step 3: Mint NFT
      setState("minting");

      const { mintNFT } = await import("@/lib/contracts");
      await mintNFT({
        recipient: stxAddress,
        uri: uploadData.metadataUri,
        royaltyRecipient: stxAddress,
        royaltyBps,
        aiModel: selectedModel,
        promptHash,
        generationParams: JSON.stringify({ size, style, provider: selectedProvider, prompt: prompt.slice(0, 100) }),
      });

      setState("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Minting failed");
      setState("generated");
    }
  };

  const getButtonText = () => {
    switch (state) {
      case "paying":
        return "Confirm Payment in Wallet...";
      case "uploading":
        return "Uploading to IPFS...";
      case "minting":
        return "Confirm in Wallet...";
      case "success":
        return "Minted Successfully!";
      default:
        return `Mint NFT (${generationFee.toFixed(2)} STX)`;
    }
  };

  const isMinting = ["paying", "uploading", "minting"].includes(state);
  const isGenerating = state === "generating";

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
            Connect wallet to mint (generation is free!)
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
              {AI_MODELS.map((model) => {
                const available = isProviderAvailable(model.providerType);
                return (
                  <button
                    key={model.id}
                    onClick={() => available && setSelectedModel(model.id)}
                    disabled={!available}
                    className={`rounded-lg border p-3 text-left transition-all ${
                      !available
                        ? "border-white/5 bg-bg-card/50 opacity-50 cursor-not-allowed"
                        : selectedModel === model.id
                          ? "border-neon-cyan/30 bg-neon-cyan/10"
                          : "border-white/10 bg-bg-card hover:border-neon-purple/30"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className={`text-xs font-semibold ${selectedModel === model.id ? "text-neon-cyan" : "text-text-primary"}`}>
                        {model.name}
                      </p>
                      {model.providerType === "openai" ? (
                        <Cloud size={12} className="text-text-muted" />
                      ) : (
                        <Server size={12} className="text-text-muted" />
                      )}
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-[11px] text-text-secondary">{model.provider}</p>
                      <p className={`text-[11px] font-mono ${selectedModel === model.id ? "text-neon-cyan" : "text-neon-orange"}`}>
                        {model.fee.toFixed(2)} STX
                      </p>
                    </div>
                    {!available && (
                      <p className="mt-1 text-[10px] text-neon-red">Not configured</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="neon-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-primary">2) Prompt</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setPromptBotOpen(true)}
                  className="inline-flex items-center gap-1 rounded-md border border-neon-cyan/30 bg-neon-cyan/10 px-2.5 py-1 text-[11px] text-neon-cyan hover:bg-neon-cyan/20 transition-colors"
                >
                  <Bot size={12} />
                  PromptGenius
                </button>
                <button
                  onClick={handleEnhancePrompt}
                  disabled={enhancing || !prompt.trim()}
                  className="inline-flex items-center gap-1 rounded-md border border-neon-purple/30 bg-neon-purple/10 px-2.5 py-1 text-[11px] text-neon-purple hover:bg-neon-purple/20 transition-colors disabled:opacity-50"
                >
                  {enhancing ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                  {enhancing ? "Enhancing..." : "Enhance with AI"}
                </button>
              </div>
            </div>
            <textarea
              rows={6}
              placeholder="Describe your vision..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-bg-card px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-neon-cyan/50 focus:outline-none"
            />
            {/* Live Prompt Score */}
            {prompt.trim().length > 0 && (
              <div
                className="mt-2 flex items-center justify-between rounded-lg p-2.5"
                style={{ background: tierConfig.bgColor, border: `1px solid ${tierConfig.borderColor}` }}
              >
                <div className="flex items-center gap-2">
                  <PromptScoreBadge score={promptScoreBreakdown.overall} size="sm" showLabel />
                  <span className="text-[10px] text-text-muted">
                    Suggested price: <span className="font-mono text-text-secondary">{getSuggestedMintPrice(promptScoreBreakdown.overall)}+ STX</span>
                  </span>
                </div>
                <div className="flex gap-3 text-[9px] text-text-muted">
                  <span>S:{promptScoreBreakdown.specificity}</span>
                  <span>T:{promptScoreBreakdown.technicalQuality}</span>
                  <span>C:{promptScoreBreakdown.creativity}</span>
                  <span>A:{promptScoreBreakdown.artisticDirection}</span>
                </div>
              </div>
            )}
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
              disabled={isGenerating || isMinting}
              className="btn-primary mt-3 inline-flex w-full items-center justify-center gap-2 text-sm disabled:opacity-50"
            >
              {isGenerating ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Sparkles size={15} />
              )}
              {isGenerating ? "Generating..." : "Generate Preview (Free)"}
            </button>
          </div>

          <div className="neon-card p-4">
            <h2 className="mb-3 text-sm font-semibold text-text-primary">3) Session History</h2>
            <div className="grid grid-cols-4 gap-2">
              {sessionImages.length > 0 ? (
                sessionImages.slice(0, 4).map((img, i) => (
                  <button
                    key={img.timestamp}
                    onClick={() => {
                      setGeneratedImage(img.url);
                      setState("generated");
                    }}
                    className="relative overflow-hidden rounded-md border border-white/10 hover:border-neon-cyan/40 transition-all group"
                    title={img.prompt}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={`Generated ${i + 1}`} className="h-16 w-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                      <RotateCcw size={14} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </button>
                ))
              ) : (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="shimmer h-16 rounded-md" />
                ))
              )}
            </div>
            {sessionImages.length === 0 && (
              <p className="mt-2 text-center text-[11px] text-text-muted">Generate images to see them here</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="neon-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-primary">Preview</h2>
              {generatedImage && (
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || isMinting}
                  className="rounded-md border border-white/10 bg-bg-card px-2.5 py-1 text-[11px] text-text-secondary disabled:opacity-50 hover:border-neon-purple/30"
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
                  <span className="inline-flex flex-col items-center gap-2 text-sm">
                    <ImagePlus size={24} />
                    <span>Generate a free preview first</span>
                    <span className="text-[11px] text-text-muted">No wallet needed to preview</span>
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
                  <Sparkles size={12} className="text-neon-green" />
                  AI generation preview
                </span>
                <span className="font-mono text-neon-green">FREE</span>
              </p>
              <p className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1">
                  <Zap size={12} className="text-neon-purple" />
                  Mint fee ({selectedModelConfig?.name ?? "DALL-E 3"})
                </span>
                <span className="font-mono">{generationFee.toFixed(2)} STX</span>
              </p>
              <p className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1">
                  <Coins size={12} className="text-neon-orange" />
                  TX fee estimate
                </span>
                <span className="font-mono">0.01 STX</span>
              </p>
              <p className="mt-2 flex items-center justify-between border-t border-white/10 pt-2 text-text-primary">
                <span>Total to mint</span>
                <span className="font-mono text-neon-cyan">{(generationFee + 0.01).toFixed(2)} STX</span>
              </p>
            </div>
            <button
              onClick={handleMint}
              disabled={!isConnected || !generatedImage || isMinting || state === "success"}
              className={`mt-3 w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                state === "success"
                  ? "bg-neon-green/20 text-neon-green"
                  : "btn-primary disabled:opacity-50"
              }`}
            >
              {isMinting && <Loader2 size={14} className="mr-2 inline animate-spin" />}
              {state === "success" && <Check size={14} className="mr-2 inline" />}
              {state === "paying" && <Wallet size={14} className="mr-2 inline animate-pulse" />}
              {getButtonText()}
            </button>
            {!generatedImage && (
              <p className="mt-2 text-center text-[11px] text-text-muted">Generate a preview first, then mint</p>
            )}
          </div>
        </div>
      </section>

      {/* PromptGenius Bot Panel */}
      {promptBotOpen && (
        <PromptBotPanel
          onClose={() => setPromptBotOpen(false)}
          onApplyPrompt={(p) => {
            setPrompt(p);
            setPromptBotOpen(false);
          }}
          selectedModel={selectedModel}
        />
      )}
    </div>
  );
}
