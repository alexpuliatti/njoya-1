/** @type {import('next').NextConfig} */
const staticExport = process.env.STATIC_EXPORT === "true";
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH || "").replace(/\/$/, "");
const nextConfig = {
  output: staticExport ? "export" : "standalone",
  basePath,
  trailingSlash: staticExport,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_STATIC_EXPORT: String(staticExport),
  },
  transpilePackages: ["three"],
  experimental: {
    outputFileTracingIncludes: { "/*": ["./content/**/*.json"] },
  },
  images: {
    unoptimized: staticExport,
    remotePatterns: [{ protocol: "https", hostname: "image.mux.com" }],
  },
};

module.exports = nextConfig;
