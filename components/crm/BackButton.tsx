"use client";

import { useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-slate-100"
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
        <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Back
    </button>
  );
}
