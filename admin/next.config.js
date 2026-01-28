const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone"
};

const sentryOptions = {
  silent: true
};

module.exports = withSentryConfig(nextConfig, sentryOptions);
