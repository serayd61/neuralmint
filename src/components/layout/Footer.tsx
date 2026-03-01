import Link from "next/link";
import { APP_NAME, SOCIAL_LINKS, NAV_LINKS } from "@/lib/constants";
import { Github, Twitter, MessageCircle, Zap, Bitcoin, ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="relative border-t border-white/5 overflow-hidden">
      {/* Background atmosphere */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -left-32 top-0 w-64 h-64 rounded-full opacity-30" style={{ background: "radial-gradient(circle, rgba(0,229,255,0.08), transparent 70%)" }} />
        <div className="absolute -right-32 bottom-0 w-64 h-64 rounded-full opacity-30" style={{ background: "radial-gradient(circle, rgba(168,85,247,0.06), transparent 70%)" }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Brand Column */}
          <div className="md:col-span-4">
            <div className="flex items-center gap-3 mb-5">
              <div className="relative">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, #00E5FF, #A855F7, #EC4899)",
                    boxShadow: "0 4px 20px rgba(0,229,255,0.25)",
                  }}
                >
                  <span className="text-white font-black text-sm">N</span>
                </div>
                <div
                  className="absolute -inset-1 rounded-xl blur-md opacity-40"
                  style={{ background: "linear-gradient(135deg, #00E5FF, #A855F7)" }}
                />
              </div>
              <div>
                <span
                  className="font-display text-lg font-bold tracking-wider block"
                  style={{
                    background: "linear-gradient(135deg, #00E5FF, #A855F7)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {APP_NAME}
                </span>
              </div>
            </div>
            <p className="text-sm text-text-muted leading-relaxed mb-5 max-w-xs">
              AI-Powered NFT Marketplace built on Stacks. Every transaction is anchored to Bitcoin&apos;s security through Proof of Transfer.
            </p>
            <div className="flex items-center gap-2">
              {[
                { icon: Twitter, href: SOCIAL_LINKS.twitter, hoverColor: "hover:text-neon-cyan hover:bg-neon-cyan/10 hover:border-neon-cyan/20" },
                { icon: MessageCircle, href: SOCIAL_LINKS.discord, hoverColor: "hover:text-neon-purple hover:bg-neon-purple/10 hover:border-neon-purple/20" },
                { icon: Github, href: SOCIAL_LINKS.github, hoverColor: "hover:text-text-primary hover:bg-white/10 hover:border-white/20" },
              ].map(({ icon: Icon, href, hoverColor }) => (
                <a
                  key={href}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-9 h-9 rounded-xl border border-white/[0.06] bg-white/[0.02] flex items-center justify-center text-text-muted transition-all ${hoverColor}`}
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Marketplace */}
          <div className="md:col-span-2">
            <h3 className="text-[11px] font-bold text-text-secondary mb-4 uppercase tracking-[0.12em]">
              Marketplace
            </h3>
            <ul className="space-y-3">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-text-muted hover:text-neon-cyan transition-colors inline-flex items-center gap-1"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className="md:col-span-2">
            <h3 className="text-[11px] font-bold text-text-secondary mb-4 uppercase tracking-[0.12em]">
              Resources
            </h3>
            <ul className="space-y-3">
              {[
                { label: "About", href: "/about" },
                { label: "FAQ", href: "/faq" },
                { label: "API Docs", href: "/api-docs" },
                { label: "Stacks Docs", href: "https://docs.stacks.co", external: true },
              ].map((link) => (
                <li key={link.href}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-text-muted hover:text-neon-cyan transition-colors inline-flex items-center gap-1"
                    >
                      {link.label} <ExternalLink size={10} />
                    </a>
                  ) : (
                    <Link href={link.href} className="text-sm text-text-muted hover:text-neon-cyan transition-colors">
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="md:col-span-4">
            <h3 className="text-[11px] font-bold text-text-secondary mb-4 uppercase tracking-[0.12em]">
              Stay Updated
            </h3>
            <p className="text-sm text-text-muted mb-3">Get the latest drops and platform updates.</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Your email"
                className="flex-1 px-3.5 py-2.5 bg-bg-card/80 border border-white/[0.08] rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-cyan/40 focus:shadow-[0_0_15px_rgba(0,229,255,0.1)] transition-all"
              />
              <button
                className="px-5 py-2.5 rounded-xl text-xs font-bold transition-all"
                style={{
                  background: "linear-gradient(135deg, #00E5FF, #A855F7)",
                  color: "white",
                  boxShadow: "0 4px 15px rgba(0,229,255,0.25)",
                }}
              >
                Join
              </button>
            </div>
            <div className="mt-5 flex gap-4">
              <Link href="/terms" className="text-[11px] text-text-muted hover:text-text-secondary transition-colors">
                Terms of Service
              </Link>
              <Link href="/privacy" className="text-[11px] text-text-muted hover:text-text-secondary transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-white/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[11px] text-text-muted">
            © {new Date().getFullYear()} {APP_NAME}. Powered by Stacks.
          </p>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full"
              style={{
                background: "rgba(0,229,255,0.05)",
                border: "1px solid rgba(0,229,255,0.1)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "#22C55E", boxShadow: "0 0 8px rgba(34,197,94,0.5)" }}
              />
              <span className="text-[10px] text-text-muted font-semibold">Built on Stacks</span>
              <span className="text-[10px] text-text-muted">·</span>
              <Bitcoin size={10} className="text-neon-orange" />
              <span className="text-[10px] text-text-muted font-semibold">Secured by Bitcoin</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
