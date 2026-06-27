import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

// Inert until a DSN is provided (so local/dev and pre-deploy builds stay clean).
Sentry.init({
  dsn,
  enabled: !!dsn,
  tracesSampleRate: 0.2,
  // Session Replay on errors only, to keep it light.
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.0,
});
