import * as React from "react";
import Link from "next/link";
import { fetchListings } from "@/lib/api";
import { FilterBar } from "@/components/marketplace/FilterBar";
import { MarketplaceGrid } from "@/components/marketplace/MarketplaceGrid";
import { GradientText } from "@/components/ui/GradientText";

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: { modelType?: string; minScore?: string; sort?: string };
}) {
  const modelType = searchParams.modelType || "all";
  const minScore  = searchParams.minScore ? Number(searchParams.minScore) : 0;
  const sort      = (searchParams.sort as any) || "newest";

  let listings: any[] = [];
  let fetchError = false;

  try {
    const data = await fetchListings({
      modelType: modelType === "all" ? undefined : modelType,
      minScore: Number.isFinite(minScore) ? minScore : 0,
      sort,
    });
    listings = data.listings || [];
  } catch {
    fetchError = true;
  }

  const total      = listings.length;
  const avgScore   = total ? Math.round(listings.reduce((a: number, b: any) => a + (b.score || 0), 0) / total) : 0;
  const totalStake = total ? listings.reduce((a: number, b: any) => a + Number(b.stake || 0), 0).toFixed(0) : "0";

  return (
    <main className="min-h-screen bg-bg-base">
      <div className="mx-auto max-w-[1200px] px-6 py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="text-[28px] font-bold text-text-primary">Marketplace</h1>
            <p className="text-[14px] text-text-secondary mt-1">AI-verified training datasets</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12px] text-text-muted bg-bg-surface border border-white/8 px-3 py-1.5 rounded-full">
              {total} datasets
            </span>
            {total > 0 && (
              <>
                <span className="text-[12px] text-text-muted bg-bg-surface border border-white/8 px-3 py-1.5 rounded-full">
                  Avg score {avgScore}
                </span>
                <span className="text-[12px] text-text-muted bg-bg-surface border border-white/8 px-3 py-1.5 rounded-full">
                  {totalStake} $0G staked
                </span>
              </>
            )}
            <Link href="/upload"
              className="px-4 py-2 rounded-[10px] bg-purple-500 text-white text-[13px] font-semibold hover:bg-purple-400 hover:shadow-purple-glow transition-all duration-200">
              + Upload Dataset
            </Link>
          </div>
        </div>

        {/* Sticky filter bar */}
        <div className="sticky top-16 z-30 mb-6">
          <FilterBar />
        </div>

        {fetchError ? (
          <div className="glass rounded-2xl border border-coral-500/20 bg-coral-500/5 p-8 text-center">
            <div className="text-[17px] font-semibold text-coral-400 mb-2">Failed to load listings</div>
            <div className="text-[13px] text-text-secondary">Make sure the backend is running at {process.env.NEXT_PUBLIC_API_URL}</div>
          </div>
        ) : (
          <MarketplaceGrid listings={listings} />
        )}
      </div>
    </main>
  );
}
