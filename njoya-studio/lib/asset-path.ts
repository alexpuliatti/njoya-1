/** Public files need the project prefix when hosted under a GitHub Pages path. */
export function assetPath(src: string): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

  if (!basePath || !src.startsWith("/") || src.startsWith("//")) return src;
  if (src === basePath || src.startsWith(`${basePath}/`)) return src;

  return `${basePath}${src}`;
}
