"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Search, Bell, Menu, X, Globe, TrendingUp, TrendingDown } from "lucide-react";
import { NAV_LINKS, LANGUAGES, APP_NAME } from "@/lib/constants";
import { ConnectWalletButton } from "@/components/wallet/ConnectWalletButton";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState("en");
  const [stxPrice, setStxPrice] = useState<number>(0);
  const [stxChange, setStxChange] = useState<number>(0);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    async function fetchPrice() {
      try {
        const res = await fetch("/api/price");
        if (res.ok) {
          const data = await res.json();
          setStxPrice(data.price || 0);
          setStxChange(data.change24h || 0);
        }
      } catch {
        /* silent */
      }
    }
    fetchPrice();
    const interval = setInterval(fetchPrice, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "glass border-b border-white/5 shadow-[0_4px_30px_rgba(0,0,0,0.5)]"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[68px]">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 shrink-0 group">
              <div className="relative">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center relative overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, #00E5FF, #A855F7, #EC4899)",
                    boxShadow: "0 4px 20px rgba(0,229,255,0.3)",
                  }}
                >
                  <span className="text-white font-black text-sm relative z-10">N</span>
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: "linear-gradient(135deg, rgba(255,255,255,0.2), transparent)",
                    }}
                  />
                </div>
                <div
                  className="absolute -inset-1 rounded-xl opacity-50 blur-lg group-hover:opacity-80 transition-opacity"
                  style={{ background: "linear-gradient(135deg, #00E5FF, #A855F7)" }}
                />
              </div>
              <div className="hidden sm:block">
                <span
                  className="font-display text-lg font-bold tracking-wider block leading-tight"
                  style={{
                    background: "linear-gradient(135deg, #00E5FF, #A855F7)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {APP_NAME}
                </span>
                <span className="text-[9px] font-mono text-text-muted tracking-widest uppercase">
                  AI · NFT · Stacks
                </span>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden lg:flex items-center gap-0.5">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative px-4 py-2 text-[13px] font-medium text-text-secondary hover:text-neon-cyan transition-colors rounded-lg hover:bg-white/[0.04] group"
                >
                  {link.label}
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-gradient-to-r from-neon-cyan to-neon-purple group-hover:w-3/4 transition-all duration-300 rounded-full" />
                </Link>
              ))}
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2.5 text-text-secondary hover:text-neon-cyan transition-all rounded-xl hover:bg-white/[0.04] hover:shadow-[0_0_20px_rgba(0,229,255,0.1)]"
              >
                <Search size={17} />
              </button>

              {/* STX Price Chip */}
              <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-bg-card/80 border border-white/[0.06] backdrop-blur-sm">
                <div
                  className="w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black"
                  style={{
                    background: "linear-gradient(135deg, #F97316, #EC4899)",
                  }}
                >
                  S
                </div>
                <span className="font-mono text-xs font-semibold text-text-primary">
                  ${stxPrice > 0 ? stxPrice.toFixed(2) : "—"}
                </span>
                {stxPrice > 0 && (
                  <span
                    className={`flex items-center gap-0.5 text-[10px] font-bold ${
                      stxChange >= 0 ? "text-neon-green" : "text-neon-red"
                    }`}
                  >
                    {stxChange >= 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                    {Math.abs(stxChange).toFixed(1)}%
                  </span>
                )}
              </div>

              {/* Language */}
              <div className="relative hidden md:block">
                <button
                  onClick={() => setLangOpen(!langOpen)}
                  className="flex items-center gap-1 p-2.5 text-text-secondary hover:text-neon-cyan transition-colors rounded-xl hover:bg-white/[0.04]"
                >
                  <Globe size={15} />
                  <span className="text-[10px] font-bold uppercase tracking-wide">{currentLang}</span>
                </button>
                <AnimatePresence>
                  {langOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-36 rounded-xl glass-light border border-white/10 shadow-[0_8px_40px_rgba(0,0,0,0.5)] overflow-hidden z-50"
                    >
                      {LANGUAGES.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => { setCurrentLang(lang.code); setLangOpen(false); }}
                          className={`w-full text-left px-3.5 py-2.5 text-sm transition-colors hover:bg-white/[0.06] ${
                            currentLang === lang.code
                              ? "text-neon-cyan"
                              : "text-text-secondary hover:text-text-primary"
                          }`}
                        >
                          {lang.label} — {lang.name}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Notifications */}
              <button className="relative p-2.5 text-text-secondary hover:text-neon-cyan transition-colors rounded-xl hover:bg-white/[0.04]">
                <Bell size={17} />
                <span
                  className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                  style={{
                    background: "#EC4899",
                    boxShadow: "0 0 8px rgba(236,72,153,0.6)",
                  }}
                />
              </button>

              {/* Wallet */}
              <div className="hidden sm:block ml-1">
                <ConnectWalletButton />
              </div>

              {/* Mobile Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 text-text-secondary hover:text-neon-cyan transition-colors"
              >
                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Search bar */}
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
                <div className="relative max-w-lg">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Search NFTs, collections, creators..."
                    className="w-full pl-10 pr-4 py-2.5 bg-bg-card/80 border border-white/10 rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-cyan/40 focus:shadow-[0_0_20px_rgba(0,229,255,0.1)] transition-all"
                    autoFocus
                    onKeyDown={(e) => e.key === "Escape" && setSearchOpen(false)}
                  />
                  <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 border border-white/10 text-text-muted">
                    ESC
                  </kbd>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="fixed inset-y-0 right-0 w-80 z-40 glass border-l border-white/10 pt-20 px-6 lg:hidden"
            >
              <div className="flex flex-col gap-1">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 text-text-secondary hover:text-neon-cyan transition-colors rounded-xl hover:bg-white/[0.04] text-lg font-medium"
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
                  ${stxPrice > 0 ? stxPrice.toFixed(2) : "—"}
                </span>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30 lg:hidden"
            />
          </>
        )}
      </AnimatePresence>
    </>
  );
}
