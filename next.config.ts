import type { NextConfig } from "next";

type NextCommandMode =
  | "default"
  | "typegen"
  | "runtime-smoke"
  | "production-build";

const requestedMode = process.env.HSE_NEXT_COMMAND_MODE?.trim() || "default";
const supportedModes = new Set<NextCommandMode>([
  "default",
  "typegen",
  "runtime-smoke",
  "production-build"
]);

if (!supportedModes.has(requestedMode as NextCommandMode)) {
  throw new Error(
    "HSE_NEXT_COMMAND_MODE must be default, typegen, runtime-smoke or production-build."
  );
}

const commandMode = requestedMode as NextCommandMode;

const commandBoundary: Partial<NextConfig> =
  commandMode === "runtime-smoke"
    ? {
        distDir: ".next-runtime-smoke",
        typescript: {
          tsconfigPath: ".hse-next/tsconfig.runtime-smoke.json"
        }
      }
    : commandMode === "production-build"
      ? {
          typescript: {
            tsconfigPath: ".hse-next/tsconfig.production.json"
          }
        }
      : commandMode === "typegen"
        ? {
            distDir: ".next-typecheck",
            typescript: {
              tsconfigPath: ".hse-next/tsconfig.typecheck.json"
            }
          }
        : {};

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  output: "standalone",
  deploymentId: process.env.HSE_DEPLOYMENT_ID || process.env.HSE_RELEASE_SHA,
  serverExternalPackages: ["@electric-sql/pglite"],
  ...commandBoundary,
  experimental: {
    serverActions: {
      bodySizeLimit: "1mb"
    }
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()"
          }
        ]
      }
    ];
  }
};

export default nextConfig;
