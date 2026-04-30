import * as React from "react";
import { Suspense } from "react";
import { ProofExplorer } from "@/components/verify/ProofExplorer";

export default function VerifyPage() {
  return (
    <main className="min-h-screen bg-bg-base">
      <Suspense fallback={
        <div className="mx-auto max-w-[1200px] px-6 py-10">
          <div className="skeleton h-10 w-64 rounded mb-4" />
          <div className="skeleton h-5 w-96 rounded mb-8" />
          <div className="skeleton h-16 w-full rounded-2xl" />
        </div>
      }>
        <ProofExplorer />
      </Suspense>
    </main>
  );
}
