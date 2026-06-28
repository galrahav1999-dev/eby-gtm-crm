"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

// Reports unexpected render crashes to Sentry (when enabled) and shows a
// friendly fallback instead of a blank screen.
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body className="flex min-h-screen items-center justify-center bg-surface text-ink-soft">
        <div className="max-w-md p-8 text-center">
          <h1 className="text-lg font-semibold text-ink">Something went wrong</h1>
          <p className="mt-2 text-sm text-ink-muted">
            The team has been notified. Try reloading the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-ink"
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
