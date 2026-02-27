"use client";

import Link from "next/link";
import { useState } from "react";
import { Search, Bell, Menu, X, Globe } from "lucide-react";
import { NAV_LINKS, LANGUAGES, APP_NAME } from "@/lib/constants";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";
import { platformStats } from "@/lib/mock-data";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
    const [searchOpen, setSearchOpen] = useState(false);
    const [langOpen, setLangOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [currentLang, setCurrentLang] = useState("en");

    return (
        <>
            <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/5" id="main-nav">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2 shrink-0" id="logo-link">
                            <div className="relative">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">N</span>
                                </div>
                                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple opacity-50 blur-md" />
                            </div>
                            <span className="font-display text-lg font-bold neon-text-cyan tracking-wider hidden sm:block">
                                {APP_NAME}
                            </span>
                        </Link>

                        {/* Desktop Nav Links */}
                        <div className="hidden lg:flex items-center gap-1">
                            {NAV_LINKS.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="px-4 py-2 text-sm text-text-secondary hover:text-neon-cyan transition-colors rounded-lg hover:bg-white/5"
                                    id={`nav-${link.label.toLowerCase().replace(/\s/g, "-")}`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>

                        {/* Right Section */}
                        <div className="flex items-center gap-3">
                            {/* Search Toggle */}
                            <button
                                onClick={() => setSearchOpen(!searchOpen)}
                                className="p-2 text-text-secondary hover:text-neon-cyan transition-colors rounded-lg hover:bg-white/5"
                                id="search-toggle"
                            >
                                <Search size={18} />
                            </button>

                            {/* STX Price */}
                            <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-bg-card border border-white/5 text-xs">
                                <span className="text-neon-orange font-bold">STX</span>
                                <span className="font-mono text-text-primary">
                                    ${platformStats.stxPriceUsd.toFixed(2)}
                                </span>
                            </div>

                            {/* Language Switcher */}
                            <div className="relative hidden md:block">
                                <button
                                    onClick={() => setLangOpen(!langOpen)}
                                    className="flex items-center gap-1 p-2 text-text-secondary hover:text-neon-cyan transition-colors rounded-lg hover:bg-white/5"
                                    id="lang-switcher"
                                >
                                    <Globe size={16} />
                                    <span className="text-xs font-medium uppercase">{currentLang}</span>
                                </button>
                                {langOpen && (
                                    <div className="absolute right-0 top-full mt-1 w-32 rounded-xl bg-bg-card border border-neon-cyan/20 shadow-lg shadow-black/50 overflow-hidden z-50 animate-fade-in">
                                        {LANGUAGES.map((lang) => (
                                            <button
                                                key={lang.code}
                                                onClick={() => {
                                                    setCurrentLang(lang.code);
                                                    setLangOpen(false);
                                                }}
                                                className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-bg-hover ${currentLang === lang.code ? "text-neon-cyan" : "text-text-secondary hover:text-text-primary"}`}
                                            >
                                                {lang.label} — {lang.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Notifications */}
                            <button className="relative p-2 text-text-secondary hover:text-neon-cyan transition-colors rounded-lg hover:bg-white/5" id="notifications-btn">
                                <Bell size={18} />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-neon-pink rounded-full" />
                            </button>

                            {/* Wallet */}
                            <div className="hidden sm:block">
                                <ConnectWalletButton />
                            </div>

                            {/* Mobile Menu Toggle */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="lg:hidden p-2 text-text-secondary hover:text-neon-cyan transition-colors"
                                id="mobile-menu-toggle"
                            >
                                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Search Bar (expandable) */}
                <AnimatePresence>
                    {searchOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border-t border-white/5 overflow-hidden"
                        >
                            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
                                <div className="relative">
                                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                                    <input
                                        type="text"
                                        placeholder="Search NFTs, collections, creators..."
                                        className="w-full pl-10 pr-4 py-2.5 bg-bg-card border border-white/10 rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-cyan/50 transition-colors"
                                        autoFocus
                                        id="search-input"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "tween", duration: 0.3 }}
                        className="fixed inset-y-0 right-0 w-72 z-40 glass border-l border-white/10 pt-20 px-6 lg:hidden"
                    >
                        <div className="flex flex-col gap-2">
                            {NAV_LINKS.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="px-4 py-3 text-text-secondary hover:text-neon-cyan transition-colors rounded-lg hover:bg-white/5 text-lg"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                        <div className="mt-6 pt-6 border-t border-white/10">
                            <ConnectWalletButton />
                        </div>
                        <div className="mt-4 flex items-center gap-2 px-4">
                            <span className="text-neon-orange font-bold text-sm">STX</span>
                            <span className="font-mono text-text-primary text-sm">
                                ${platformStats.stxPriceUsd.toFixed(2)}
                            </span>
                        </div>
                        <div className="mt-4 flex gap-2 px-4">
                            {LANGUAGES.map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => {
                                        setCurrentLang(lang.code);
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${currentLang === lang.code ? "border-neon-cyan/50 text-neon-cyan bg-neon-cyan/10" : "border-white/10 text-text-muted hover:text-text-secondary"}`}
                                >
                                    {lang.label}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Backdrop for mobile menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setMobileMenuOpen(false)}
                        className="fixed inset-0 bg-black/60 z-30 lg:hidden"
                    />
                )}
            </AnimatePresence>
        </>
    );
}
