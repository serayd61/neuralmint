"use client";

import { showConnect } from "@stacks/connect";
import { useWalletStore } from "@/stores/wallet-store";
import { useUserSession } from "@/providers/WalletProvider";
import { truncateAddress } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
import { Wallet, LogOut, User, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function ConnectWalletButton() {
    const { stxAddress, bnsName, isConnected, setWalletConnected, setDisconnected, network } =
        useWalletStore();
    const userSession = useUserSession();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

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

    const handleConnect = () => {
        const iconUrl = typeof window !== 'undefined' 
            ? `${window.location.origin}/logo.svg` 
            : '/logo.svg';
            
        showConnect({
            appDetails: {
                name: APP_NAME,
                icon: iconUrl,
            },
            onFinish: () => {
                const userData = userSession.loadUserData();
                const address =
                    network === "mainnet"
                        ? userData.profile?.stxAddress?.mainnet
                        : userData.profile?.stxAddress?.testnet;
                if (address) {
                    setWalletConnected(address);
                }
            },
            onCancel: () => {
                console.log('Wallet connection cancelled');
            },
            userSession,
        });
    };

    const handleDisconnect = () => {
        userSession.signUserOut();
        setDisconnected();
        setDropdownOpen(false);
    };

    if (!isConnected) {
        return (
            <button
                onClick={handleConnect}
                className="btn-primary flex items-center gap-2 text-sm px-5 py-2.5"
                id="connect-wallet-btn"
            >
                <Wallet size={16} />
                <span>Connect Wallet</span>
            </button>
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
