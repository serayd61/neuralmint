"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useState, useEffect } from "react";
import type { AIPromptScore } from "@/lib/types";

interface WalletState {
    // State
    stxAddress: string | null;
    bnsName: string | null;
    isConnected: boolean;
    network: "mainnet" | "testnet";

    // Prompt Scoring
    currentScore: AIPromptScore | null;
    isScoring: boolean;
    scoreHistory: AIPromptScore[];

    // Hydration
    _hasHydrated: boolean;
    setHasHydrated: (v: boolean) => void;

    // Actions
    setWalletConnected: (address: string, bnsName?: string | null) => void;
    setDisconnected: () => void;
    setBnsName: (name: string | null) => void;
    setNetwork: (network: "mainnet" | "testnet") => void;

    // Scoring Actions
    scorePrompt: (prompt: string, aiModel?: string) => Promise<AIPromptScore | null>;
    clearScore: () => void;
}

export const useWalletStore = create<WalletState>()(
    persist(
        (set, get) => ({
            stxAddress: null,
            bnsName: null,
            isConnected: false,
            network: (process.env.NEXT_PUBLIC_STACKS_NETWORK as "mainnet" | "testnet") || "mainnet",

            // Prompt Scoring
            currentScore: null,
            isScoring: false,
            scoreHistory: [],

            _hasHydrated: false,
            setHasHydrated: (v) => set({ _hasHydrated: v }),

            setWalletConnected: (address, bnsName = null) =>
                set({ stxAddress: address, bnsName, isConnected: true }),

            setDisconnected: () =>
                set({ stxAddress: null, bnsName: null, isConnected: false }),

            setBnsName: (name) => set({ bnsName: name }),

            setNetwork: (network) => set({ network }),

            scorePrompt: async (prompt: string, aiModel = "dall-e-3") => {
                set({ isScoring: true });
                try {
                    const res = await fetch("/api/v1/score-prompt", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ prompt, aiModel }),
                    });
                    if (!res.ok) throw new Error("Scoring failed");
                    const data: AIPromptScore = await res.json();
                    const history = [data, ...get().scoreHistory].slice(0, 20);
                    set({ currentScore: data, isScoring: false, scoreHistory: history });
                    return data;
                } catch (err) {
                    console.error("Score prompt error:", err);
                    set({ isScoring: false });
                    return null;
                }
            },

            clearScore: () => set({ currentScore: null }),
        }),
        {
            name: "neuralmint-wallet",
            partialize: (state) => ({
                stxAddress: state.stxAddress,
                bnsName: state.bnsName,
                isConnected: state.isConnected,
                network: state.network,
                scoreHistory: state.scoreHistory.slice(0, 10),
            }),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);

/**
 * Hook that returns true only after client-side mount.
 * Use this to prevent hydration mismatches.
 */
export function useHasMounted() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    return mounted;
}
