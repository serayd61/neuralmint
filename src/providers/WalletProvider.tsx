"use client";

import { createContext, useContext, useEffect, useCallback, useState, type ReactNode } from "react";
import { useWalletStore } from "@/stores/wallet-store";

interface WalletContextType {
    checkConnection: () => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function useWalletContext() {
    const ctx = useContext(WalletContext);
    if (!ctx) throw new Error("useWalletContext must be used within WalletProvider");
    return ctx;
}

export function WalletProvider({ children }: { children: ReactNode }) {
    const { setWalletConnected, setDisconnected, network } = useWalletStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const checkConnection = useCallback(() => {
        if (typeof window === "undefined") return;
        try {
            // Dynamic import to prevent SSR issues with @stacks/connect
            import("@stacks/connect").then(({ isConnected, getLocalStorage }) => {
                const connected = isConnected();
                if (connected) {
                    const storage = getLocalStorage();
                    const addresses = storage?.addresses;
                    if (addresses?.stx && addresses.stx.length > 0) {
                        const stxAddresses = addresses.stx;
                        const address = stxAddresses.find(a =>
                            network === "mainnet" ? a.address.startsWith("SP") : a.address.startsWith("ST")
                        )?.address;
                        if (address) {
                            setWalletConnected(address);
                            return;
                        }
                    }
                }
                setDisconnected();
            }).catch(() => {
                setDisconnected();
            });
        } catch {
            setDisconnected();
        }
    }, [network, setWalletConnected, setDisconnected]);

    // Restore session on mount (client-side only)
    useEffect(() => {
        if (mounted) {
            checkConnection();
        }
    }, [mounted, checkConnection]);

    return (
        <WalletContext.Provider value={{ checkConnection }}>
            {children}
        </WalletContext.Provider>
    );
}
