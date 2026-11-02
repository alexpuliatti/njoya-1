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
  return `(max-width: 767px) ${coverSize("calc(100vw - 56px)", "calc((100vw - 56px) * 1.25)", image)}, ${coverSize("min(52vw, 620px)", "min(70svh, 760px)", image)}`;
}
export function preferredImageSrc(image?: ContentImage, fallback = "") {
  return assetPath(
    image?.responsive?.variants.at(-1)?.src ?? image?.src ?? fallback,
  );
}
