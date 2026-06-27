/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // react-globe.gl / three ship ESM that Next can transpile cleanly.
  transpilePackages: ["react-globe.gl", "three"],
  experimental: {
    // Enables instrumentation.ts (used by Sentry server/edge init).
    instrumentationHook: true,
  },
};

// Apply Sentry only when a DSN is configured, so pre-deploy builds stay clean.
let finalConfig = nextConfig;
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  const { withSentryConfig } = require("@sentry/nextjs");
  finalConfig = withSentryConfig(nextConfig, {
    silent: true,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    // Source map upload only runs when an auth token is present.
    authToken: process.env.SENTRY_AUTH_TOKEN,
    widenClientFileUpload: true,
    disableLogger: true,
  });
}

module.exports = finalConfig;
