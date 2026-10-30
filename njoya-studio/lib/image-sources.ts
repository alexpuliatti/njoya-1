import type { ContentImage } from "@/lib/content/types";

import { assetPath } from "./asset-path";

/** Account for pixels cropped by object-fit: cover, not just the visible width. */
export function coverSize(width: string, height: string, image?: ContentImage) {
  return image
    ? `max(${width}, calc((${height}) * ${(image.width / image.height).toFixed(5)}))`
    : width;
}
export function imageSrcSet(image?: ContentImage) {
  return image?.responsive?.variants
    .map((variant) => `${assetPath(variant.src)} ${variant.width}w`)
    .join(", ");
}
export function panelImageSize(image?: ContentImage) {
  return coverSize(
    "min(90vw, calc(min(85vh, 780px) * 0.69231))",
    "min(85vh, 780px)",
    image,
  );
}
export function preferredImageSrc(image?: ContentImage, fallback = "") {
  return assetPath(
    image?.responsive?.variants.at(-1)?.src ?? image?.src ?? fallback,
  );
}
