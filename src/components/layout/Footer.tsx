import Link from "next/link";
import { APP_NAME, SOCIAL_LINKS, NAV_LINKS } from "@/lib/constants";
import { Github, Twitter, MessageCircle } from "lucide-react";

export function Footer() {
    return (
        <footer className="border-t border-white/5 bg-bg-secondary/50" id="main-footer">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div className="md:col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
                                <span className="text-white font-bold text-sm">N</span>
                            </div>
                            <span className="font-display text-lg font-bold neon-text-cyan tracking-wider">
                                {APP_NAME}
                            </span>
                        </div>
                        <p className="text-sm text-text-muted leading-relaxed mb-4">
                            AI-Powered NFT Marketplace built on Stacks. Every transaction is secured by Bitcoin.
                        </p>
                        <div className="flex items-center gap-3">
                            <a href={SOCIAL_LINKS.twitter} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg text-text-muted hover:text-neon-cyan hover:bg-white/5 transition-colors">
                                <Twitter size={18} />
                            </a>
                            <a href={SOCIAL_LINKS.discord} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg text-text-muted hover:text-neon-purple hover:bg-white/5 transition-colors">
                                <MessageCircle size={18} />
                            </a>
                            <a href={SOCIAL_LINKS.github} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/5 transition-colors">
                                <Github size={18} />
                            </a>
                        </div>
                    </div>

                    {/* Marketplace */}
                    <div>
                        <h3 className="font-heading text-sm font-semibold text-text-primary mb-4 uppercase tracking-wider">Marketplace</h3>
                        <ul className="space-y-2.5">
                            {NAV_LINKS.map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href} className="text-sm text-text-muted hover:text-neon-cyan transition-colors">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h3 className="font-heading text-sm font-semibold text-text-primary mb-4 uppercase tracking-wider">Resources</h3>
                        <ul className="space-y-2.5">
                            <li><Link href="/about" className="text-sm text-text-muted hover:text-neon-cyan transition-colors">About</Link></li>
                            <li><Link href="/faq" className="text-sm text-text-muted hover:text-neon-cyan transition-colors">FAQ</Link></li>
                            <li><Link href="/api-docs" className="text-sm text-text-muted hover:text-neon-cyan transition-colors">API Docs</Link></li>
                            <li><a href="https://docs.stacks.co" target="_blank" rel="noopener noreferrer" className="text-sm text-text-muted hover:text-neon-cyan transition-colors">Stacks Docs</a></li>
                        </ul>
                    </div>

                    {/* Legal + Newsletter */}
                    <div>
                        <h3 className="font-heading text-sm font-semibold text-text-primary mb-4 uppercase tracking-wider">Stay Updated</h3>
                        <p className="text-sm text-text-muted mb-3">Get the latest drops and updates.</p>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                placeholder="Your email"
                                className="flex-1 px-3 py-2 bg-bg-card border border-white/10 rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-neon-cyan/50 transition-colors"
                                id="newsletter-email"
                            />
                            <button className="btn-primary text-xs px-4 py-2" id="newsletter-submit">
                                Join
                            </button>
                        </div>
                        <div className="mt-4 space-y-2">
                            <Link href="/terms" className="block text-xs text-text-muted hover:text-text-secondary transition-colors">Terms of Service</Link>
                            <Link href="/privacy" className="block text-xs text-text-muted hover:text-text-secondary transition-colors">Privacy Policy</Link>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-10 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-text-muted">
                        © {new Date().getFullYear()} {APP_NAME}. Powered by Stacks.
                    </p>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-bg-card border border-white/5">
                            <div className="w-1.5 h-1.5 rounded-full bg-neon-green" />
                            <span className="text-[10px] text-text-muted font-medium">Built on Stacks</span>
                            <span className="text-[10px] text-text-muted">•</span>
                            <span className="text-[10px] text-text-muted font-medium">Secured by Bitcoin</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
