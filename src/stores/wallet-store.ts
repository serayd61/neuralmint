"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WalletState {
    // State
    stxAddress: string | null;
    bnsName: string | null;
    isConnected: boolean;
    network: "mainnet" | "testnet";

    // Actions
    setWalletConnected: (address: string, bnsName?: string | null) => void;
    setDisconnected: () => void;
    setBnsName: (name: string | null) => void;
    setNetwork: (network: "mainnet" | "testnet") => void;
}

export const useWalletStore = create<WalletState>()(
    persist(
        (set) => ({
            stxAddress: null,
            bnsName: null,
            isConnected: false,
            network: (process.env.NEXT_PUBLIC_STACKS_NETWORK as "mainnet" | "testnet") || "mainnet",

            setWalletConnected: (address, bnsName = null) =>
                set({ stxAddress: address, bnsName, isConnected: true }),

            setDisconnected: () =>
                set({ stxAddress: null, bnsName: null, isConnected: false }),

            setBnsName: (name) => set({ bnsName: name }),

            setNetwork: (network) => set({ network }),
        }),
        {
            name: "neuralmint-wallet",
            partialize: (state) => ({
                stxAddress: state.stxAddress,
                bnsName: state.bnsName,
                isConnected: state.isConnected,
                network: state.network,
            }),
        }
    )
);
