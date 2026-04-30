import * as React from "react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative bg-bg-surface overflow-hidden" style={{ borderTop: "1px solid rgba(123,110,246,0.12)" }}>
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(123,110,246,0.5) 30%, rgba(29,217,160,0.5) 70%, transparent)" }} />

      <div className="mx-auto max-w-[1200px] px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <svg width="24" height="24" viewBox="0 0 28 28" fill="none">
                <path d="M14 2L4 6.5V13c0 5.5 4.2 10.6 10 12 5.8-1.4 10-6.5 10-12V6.5L14 2z"
                  fill="url(#footerShield)"/>
                <path d="M10 13.5l2.5 2.5 5.5-5.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="footerShield" x1="4" y1="2" x2="24" y2="26" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#7B6EF6"/>
                    <stop offset="1" stopColor="#1DD9A0"/>
                  </linearGradient>
                </defs>
              </svg>
            <span className="text-[15px] font-bold text-white">Data<span className="text-purple-400">Shield</span></span>
            </div>
            <p className="text-[13px] text-text-secondary leading-relaxed max-w-[220px]">
              The trust layer for AI training data. Certified on-chain, enforced by economics.
            </p>
            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <span className="text-[11px] text-purple-400 font-medium">Built on 0G Modular AI Infrastructure</span>
            </div>
          </div>

          {/* Links */}
          <div>
            <div className="text-[12px] font-semibold text-text-muted uppercase tracking-wider mb-4">Navigation</div>
            <div className="flex flex-col gap-2.5">
              {[
                { href: "/",            label: "Home" },
                { href: "/marketplace", label: "Marketplace" },
                { href: "/upload",      label: "Upload" },
                { href: "/verify",      label: "Verify" },
                { href: "https://docs.0g.ai", label: "Docs ↗", external: true },
              ].map((l) => (
                <Link key={l.href} href={l.href}
                  target={l.external ? "_blank" : undefined}
                  rel={l.external ? "noreferrer" : undefined}
                  className="text-[13px] text-text-secondary hover:text-text-primary transition-colors w-fit">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Info */}
          <div>
            <div className="text-[12px] font-semibold text-text-muted uppercase tracking-wider mb-4">Protocol</div>
            <div className="flex flex-col gap-2.5">
              <span className="text-[13px] text-text-secondary">Built on 0G Chain (ID: 16600)</span>
              <a href="https://chainscan-galileo.0g.ai" target="_blank" rel="noreferrer"
                className="text-[13px] text-text-secondary hover:text-text-primary transition-colors w-fit">
                Smart Contract ↗
              </a>
              <a href="https://github.com" target="_blank" rel="noreferrer"
                className="text-[13px] text-text-secondary hover:text-text-primary transition-colors w-fit">
                GitHub ↗
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-[12px] text-text-muted">© 2026 DataShield. All rights reserved.</span>
          <span className="text-[12px] text-text-muted">Powered by 0G Modular AI Infrastructure</span>
        </div>
      </div>
    </footer>
  );
}
