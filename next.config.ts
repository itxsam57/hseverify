import type { NextConfig } from "next";

const configuredDistDir = process.env.HSE_NEXT_DIST_DIR?.trim();

if (
  configuredDistDir &&
  (configuredDistDir === "." ||
    configuredDistDir === ".." ||
    !/^[A-Za-z0-9._-]+$/.test(configuredDistDir))
) {
  throw new Error(
    "HSE_NEXT_DIST_DIR must be a project-local directory name containing only letters, numbers, dots, underscores or hyphens."
  );
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  output: "standalone",
  ...(configuredDistDir ? { distDir: configuredDistDir } : {}),
  deploymentId: process.env.HSE_DEPLOYMENT_ID || process.env.HSE_RELEASE_SHA,
  serverExternalPackages: ["@electric-sql/pglite"],
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
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
        ]
      }
    ];
  }
};

export default nextConfig;
