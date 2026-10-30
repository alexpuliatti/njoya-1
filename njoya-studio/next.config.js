/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["three"],
  experimental: {
    outputFileTracingIncludes: { "/*": ["./content/**/*.json"] },
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "image.mux.com" }],
  },
};

module.exports = nextConfig;
