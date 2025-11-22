"use client";

import { Suspense } from "react";
import ComingSoonContent from "./coming-soon-content";

function LoadingFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-slate-600">Loading...</div>
    </div>
  );
}

export default function ComingSoonPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ComingSoonContent />
    </Suspense>
  );
}