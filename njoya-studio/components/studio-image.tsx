"use client";

import type { ImgHTMLAttributes } from "react";
import type { ContentImage } from "@/lib/content/types";

import { forwardRef } from "react";

import { assetPath } from "@/lib/asset-path";
import { imageSrcSet } from "@/lib/image-sources";

type Props = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "src" | "srcSet" | "width" | "height"
> & {
  src: string;
  image?: ContentImage;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
};

const StudioImage = forwardRef<HTMLImageElement, Props>(function StudioImage(
  {
    image,
    src,
    fill,
    priority,
    loading,
    sizes = "100vw",
    style,
    width,
    height,
    ...props
  },
  ref,
) {
  const media = image?.responsive;
  const srcSet = imageSrcSet(image);

  return (
    <picture style={{ display: "contents" }}>
      {media?.format === "avif" && (
        <source sizes={sizes} srcSet={srcSet} type="image/avif" />
      )}
      <img
        {...props}
        ref={ref}
        alt={props.alt ?? image?.alt ?? ""}
        decoding="async"
        fetchPriority={priority ? "high" : "auto"}
        height={fill ? undefined : height}
        loading={priority ? "eager" : loading ?? "lazy"}
        sizes={sizes}
        src={assetPath(media?.fallback.src ?? src)}
        srcSet={media?.format === "webp" ? srcSet : undefined}
        style={{
          ...(fill
            ? ({
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
              } as const)
            : {}),
          ...style,
        }}
        width={fill ? undefined : width}
      />
    </picture>
  );
});

export default StudioImage;
