"use client";
import * as React from "react";
import { useAccount, useConnect, useDisconnect } from "wagmi";
import { toast } from "sonner";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { formatAddress } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connectors, connectAsync, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  async function onConnect() {
    try {
      const connector = connectors[0];
      if (!connector) { toast.error("No wallet connector found"); return; }
      await connectAsync({ connector });
      toast.success("Wallet connected");
    } catch (e: any) {
      toast.error(e?.shortMessage || e?.message || "Failed to connect");
    }
  }

  async function copyAddress() {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      toast.success("Address copied");
    } catch { toast.error("Copy failed"); }
  }

  if (!isConnected || !address) {
    return (
      <button
        onClick={onConnect}
        disabled={isPending}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-[10px] text-[14px] font-medium transition-all duration-200",
          "border border-white/10 text-text-secondary bg-transparent",
          "hover:border-white/18 hover:text-text-primary",
          "disabled:opacity-50"
        )}
      >
        {isPending ? (
          <>
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Connecting...
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M16 12h.01" />
              <path d="M2 10h20" />
            </svg>
            Connect Wallet
          </>
        )}
      </button>
    );
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-[10px] text-[14px] font-medium transition-all duration-200",
          "bg-bg-elevated border border-white/10",
          "hover:border-white/18"
        )}>
          <span className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0" />
          <span className="text-text-primary">{formatAddress(address)}</span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className="text-text-muted">
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          </svg>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="glass border border-white/10 rounded-2xl p-1.5 min-w-[180px] z-50 shadow-purple-glow"
          sideOffset={8}
          align="end"
        >
          <DropdownMenu.Item
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] text-text-secondary hover:text-text-primary hover:bg-white/5 cursor-pointer outline-none transition-colors"
            onSelect={copyAddress}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M4 2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h5a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H4z"/>
            </svg>
            Copy Address
          </DropdownMenu.Item>
          <DropdownMenu.Item
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] text-text-secondary hover:text-text-primary hover:bg-white/5 cursor-pointer outline-none transition-colors"
            onSelect={() => window.open(`https://chainscan-galileo.0g.ai/address/${address}`, "_blank")}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M7 3H3a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1V9"/>
              <path d="M10 2h4v4M14 2l-6 6" strokeLinecap="round"/>
            </svg>
            View on Explorer
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 border-t border-white/6" />
          <DropdownMenu.Item
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-[13px] text-coral-400 hover:bg-coral-500/10 cursor-pointer outline-none transition-colors"
            onSelect={() => disconnect()}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M10 11l3-3-3-3M13 8H6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Disconnect
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
