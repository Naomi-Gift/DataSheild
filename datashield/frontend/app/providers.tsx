"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { Toaster } from "sonner";
import { OG_CHAIN } from "@/lib/contracts";

const config = createConfig({
  chains: [OG_CHAIN],
  connectors: [injected()],
  transports: {
    [OG_CHAIN.id]: http(process.env.NEXT_PUBLIC_OG_CHAIN_RPC),
  },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    </WagmiProvider>
  );
}

