"use client";

import { AppConfig, UserSession } from "@stacks/connect";
import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useWalletStore } from "@/stores/wallet-store";

interface WalletContextType {
    userSession: UserSession;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function useUserSession() {
    const ctx = useContext(WalletContext);
    if (!ctx) throw new Error("useUserSession must be used within WalletProvider");
    return ctx.userSession;
}

export function WalletProvider({ children }: { children: ReactNode }) {
    const { setWalletConnected, setDisconnected, network } = useWalletStore();

    const userSession = useMemo(() => {
        const appConfig = new AppConfig(["store_write", "publish_data"]);
        return new UserSession({ appConfig });
    }, []);

    // Restore session on mount
    useEffect(() => {
        if (userSession.isUserSignedIn()) {
            try {
                const userData = userSession.loadUserData();
                const address =
                    network === "mainnet"
                        ? userData.profile?.stxAddress?.mainnet
                        : userData.profile?.stxAddress?.testnet;
                if (address) {
                    setWalletConnected(address);
                }
            } catch {
                setDisconnected();
            }
        }
    }, [userSession, network, setWalletConnected, setDisconnected]);

    return (
        <WalletContext.Provider value={{ userSession }}>
            {children}
        </WalletContext.Provider>
    );
}
