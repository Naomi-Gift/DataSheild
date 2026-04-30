"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { WalletButton } from "@/components/ui/WalletButton";
import { cn } from "@/lib/utils";

const links = [
  { href: "/",            label: "Home" },
  { href: "/marketplace", label: "Market" },
  { href: "/upload",      label: "Upload" },
  { href: "/verify",      label: "Verify" },
];

const tickerItems = [
  "⚡ DataShield v1.0 live on 0G Testnet",
  "🛡 3 AI checks per dataset",
  "💎 100 $0G min stake",
  "🔗 Powered by 0G Compute + Storage + DA",
  "🚀 60s end-to-end certification",
  "✅ Cryptographic proof on every seal",
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  return (
    <>
      {/* Ticker tape */}
      <div className="fixed top-0 left-0 right-0 z-50 h-7 overflow-hidden bg-purple-500/10 border-b border-purple-500/20">
        <div className="ticker-inner h-full flex items-center">
          {[...tickerItems, ...tickerItems].map((t, i) => (
            <span key={i} className="text-[11px] font-mono text-purple-300 px-8 whitespace-nowrap opacity-80">
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Main nav */}
      <header
        className="fixed top-7 left-0 right-0 z-50 h-14"
        style={{
          background: "rgba(5,7,15,0.90)",
          backdropFilter: "blur(24px)",
          borderBottom: "1px solid rgba(123,110,246,0.12)",
        }}
      >
        <div className="mx-auto max-w-[1200px] px-6 h-full flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative w-7 h-7">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none"
                className="transition-all duration-300 group-hover:drop-shadow-[0_0_12px_rgba(123,110,246,1)]">
                <path d="M14 2L4 6.5V13c0 5.5 4.2 10.6 10 12 5.8-1.4 10-6.5 10-12V6.5L14 2z"
                  fill="url(#ng)" />
                <path d="M10 13.5l2.5 2.5 5.5-5.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="ng" x1="4" y1="2" x2="24" y2="26" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#7B6EF6"/>
                    <stop offset="1" stopColor="#1DD9A0"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="font-bold text-[15px] tracking-tight text-white">
              Data<span className="text-purple-400">Shield</span>
            </span>
            <span className="hidden sm:inline text-[10px] font-mono text-purple-500/70 border border-purple-500/20 px-1.5 py-0.5 rounded ml-1">
              BETA
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center">
            {links.map((l) => {
              const active = pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href));
              return (
                <Link key={l.href} href={l.href}
                  className={cn(
                    "relative px-4 py-1.5 text-[13px] font-semibold tracking-wide transition-all duration-150 uppercase",
                    active
                      ? "text-white"
                      : "text-text-secondary hover:text-white"
                  )}>
                  {l.label}
                  {active && (
                    <motion.span
                      layoutId="nav-bar"
                      className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full"
                      style={{ background: "linear-gradient(90deg, #7B6EF6, #1DD9A0)" }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            {/* Live indicator */}
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-mono text-teal-400">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
              LIVE
            </div>
            <WalletButton />
            <button
              className="md:hidden p-2 rounded-lg text-text-secondary hover:text-white transition-colors"
              onClick={() => setOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
                {open
                  ? <path fillRule="evenodd" d="M3.293 3.293a1 1 0 011.414 0L9 7.586l4.293-4.293a1 1 0 111.414 1.414L10.414 9l4.293 4.293a1 1 0 01-1.414 1.414L9 10.414l-4.293 4.293a1 1 0 01-1.414-1.414L7.586 9 3.293 4.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                  : <path fillRule="evenodd" d="M2 4a1 1 0 011-1h12a1 1 0 110 2H3a1 1 0 01-1-1zM2 9a1 1 0 011-1h12a1 1 0 110 2H3a1 1 0 01-1-1zM2 14a1 1 0 011-1h12a1 1 0 110 2H3a1 1 0 01-1-1z" clipRule="evenodd"/>
                }
              </svg>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="md:hidden absolute top-14 left-0 right-0 bg-bg-base border-b border-purple-500/10 px-6 py-3 flex flex-col gap-1"
            >
              {links.map((l) => {
                const active = pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href));
                return (
                  <Link key={l.href} href={l.href} onClick={() => setOpen(false)}
                    className={cn(
                      "px-4 py-2.5 rounded-xl text-[14px] font-semibold uppercase tracking-wide transition-colors",
                      active ? "text-white bg-purple-500/10" : "text-text-secondary hover:text-white hover:bg-white/5"
                    )}>
                    {l.label}
                  </Link>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
