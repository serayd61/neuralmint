"use client";

import { connect, disconnect, isConnected, getLocalStorage } from "@stacks/connect";
import { useWalletStore } from "@/stores/wallet-store";
import { truncateAddress } from "@/lib/utils";
import { Wallet, LogOut, User, ChevronDown, X } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const WALLETS = [
    {
        id: "leather",
        name: "Leather",
        description: "The most popular Stacks wallet",
        logo: "/wallets/leather.svg",
        downloadUrl: "https://leather.io/install-extension",
        bgColor: "#12100F",
    },
    {
        id: "xverse",
        name: "Xverse",
        description: "Bitcoin & Stacks wallet",
        logo: "/wallets/xverse.svg",
        downloadUrl: "https://www.xverse.app/download",
        bgColor: "#EE7A30",
    },
];

export function ConnectWalletButton() {
    const { stxAddress, bnsName, isConnected: storeConnected, setWalletConnected, setDisconnected, network } =
        useWalletStore();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Check connection status on mount
    useEffect(() => {
        const checkConnection = async () => {
            try {
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
                        }
                    }
                }
            } catch (error) {
                console.error("Error checking connection:", error);
            }
        };
        checkConnection();
    }, [network, setWalletConnected]);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    const handleConnect = async (walletId?: string) => {
        setLoading(true);
        setSelectedWallet(walletId || null);
        try {
            const response = await connect({
                forceWalletSelect: !walletId,
            });
            
            // Handle response - addresses can be in different formats
            const addresses = response?.addresses;
            if (addresses) {
                // Check if it's the new format with stx/btc arrays
                const stxAddresses = (addresses as { stx?: Array<{ address: string }> }).stx;
                if (stxAddresses && stxAddresses.length > 0) {
                    const address = stxAddresses.find((a: { address: string }) => 
                        network === "mainnet" ? a.address.startsWith("SP") : a.address.startsWith("ST")
                    )?.address;
                    if (address) {
                        setWalletConnected(address);
                        setModalOpen(false);
                        return;
                    }
                }
                
                // Fallback: check if addresses is an array directly
                if (Array.isArray(addresses)) {
                    const stxAddr = addresses.find((a: { address?: string }) => {
                        const addr = a.address || '';
                        return network === "mainnet" ? addr.startsWith("SP") : addr.startsWith("ST");
                    });
                    if (stxAddr?.address) {
                        setWalletConnected(stxAddr.address);
                        setModalOpen(false);
                    }
                }
            }
        } catch (error) {
            console.error("Wallet connection error:", error);
        } finally {
            setLoading(false);
            setSelectedWallet(null);
        }
    };

    const handleDisconnect = () => {
        disconnect();
        setDisconnected();
        setDropdownOpen(false);
    };

    if (!storeConnected) {
        return (
            <>
                <button
                    onClick={() => setModalOpen(true)}
                    className="btn-primary flex items-center gap-2 text-sm px-5 py-2.5"
                    id="connect-wallet-btn"
                >
                    <Wallet size={16} />
                    <span>Connect Wallet</span>
                </button>

                {/* Wallet Selection Modal */}
                {modalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center">
                        {/* Backdrop */}
                        <div 
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                            onClick={() => setModalOpen(false)}
                        />
                        
                        {/* Modal */}
                        <div className="relative w-full max-w-md mx-4 bg-bg-primary border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-fade-in">
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-white/10">
                                <h2 className="text-lg font-semibold text-text-primary">Connect Wallet</h2>
                                <button
                                    onClick={() => setModalOpen(false)}
                                    className="p-2 text-text-muted hover:text-text-primary transition-colors rounded-lg hover:bg-white/5"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Wallet Options */}
                            <div className="p-4 space-y-3">
                                {WALLETS.map((wallet) => (
                                    <button
                                        key={wallet.id}
                                        onClick={() => handleConnect(wallet.id)}
                                        disabled={loading}
                                        className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-bg-card hover:border-neon-cyan/50 hover:bg-neon-cyan/5 transition-all disabled:opacity-50 group"
                                    >
                                        <div 
                                            className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden"
                                            style={{ backgroundColor: wallet.bgColor }}
                                        >
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={wallet.logo}
                                                alt={wallet.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className="font-semibold text-text-primary group-hover:text-neon-cyan transition-colors">
                                                {wallet.name}
                                            </p>
                                            <p className="text-xs text-text-muted">
                                                {wallet.description}
                                            </p>
                                        </div>
                                        {loading && selectedWallet === wallet.id && (
                                            <div className="w-5 h-5 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
                                        )}
                                    </button>
                                ))}

                                {/* Divider */}
                                <div className="flex items-center gap-3 py-2">
                                    <div className="flex-1 h-px bg-white/10" />
                                    <span className="text-xs text-text-muted">or</span>
                                    <div className="flex-1 h-px bg-white/10" />
                                </div>

                                {/* Auto-detect button */}
                                <button
                                    onClick={() => handleConnect()}
                                    disabled={loading}
                                    className="w-full p-3 rounded-xl border border-white/10 text-sm text-text-secondary hover:text-text-primary hover:border-white/20 transition-all disabled:opacity-50"
                                >
                                    {loading && !selectedWallet ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin" />
                                            Connecting...
                                        </span>
                                    ) : (
                                        "Auto-detect wallet"
                                    )}
                                </button>
                            </div>

                            {/* Footer */}
                            <div className="p-4 border-t border-white/10 bg-bg-card/50">
                                <p className="text-xs text-text-muted text-center">
                                    Don&apos;t have a wallet?{" "}
                                    <a
                                        href="https://leather.io/install-extension"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-neon-cyan hover:underline"
                                    >
                                        Get Leather
                                    </a>
                                    {" "}or{" "}
                                    <a
                                        href="https://www.xverse.app/download"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-neon-cyan hover:underline"
                                    >
                                        Get Xverse
                                    </a>
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-bg-card border border-neon-cyan/20 hover:border-neon-cyan/50 transition-all text-sm"
                id="wallet-dropdown-btn"
            >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple" />
                <span className="font-mono text-neon-cyan">
                    {bnsName || truncateAddress(stxAddress || "")}
                </span>
                <ChevronDown size={14} className={`text-text-secondary transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl bg-bg-card border border-neon-cyan/20 shadow-lg shadow-black/50 overflow-hidden z-50 animate-fade-in">
                    <div className="p-3 border-b border-white/5">
                        <p className="text-xs text-text-muted">Connected</p>
                        <p className="text-sm font-mono text-text-primary truncate">{stxAddress}</p>
                    </div>
                    <a
                        href={`/profile/${stxAddress}`}
                        className="flex items-center gap-2 px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
                    >
                        <User size={14} />
                        My Profile
                    </a>
                    <button
                        onClick={handleDisconnect}
                        className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-neon-red hover:bg-bg-hover transition-colors"
                    >
                        <LogOut size={14} />
                        Disconnect
                    </button>
                </div>
            )}
        </div>
    );
}
