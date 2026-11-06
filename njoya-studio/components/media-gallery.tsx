import type { GalleryEntry } from "@/lib/content/types";
import type { CSSProperties } from "react";

import Image from "./studio-image";
import StudioVideo from "./studio-video";

import { assetPath } from "@/lib/asset-path";
import { muxPlaybackUrl, muxThumbnail } from "@/lib/mux";

export default function MediaGallery({
  entries,
  maxWidth = 780,
  sizes = `(max-width: 767px) calc(100vw - 48px), ${maxWidth}px`,
}: {
  entries: GalleryEntry[];
  maxWidth?: number;
  sizes?: string;
}) {
  if (!entries.length) return null;

  return (
    <div
      className={
        entries.length === 1
          ? "media-gallery media-gallery-single"
          : "media-gallery"
      }
    >
      {entries.map((entry, index) => (
        <figure
          key={`${entry.type}-${index}`}
          className={
            entry.type === "synopsis"
              ? "synopsis-media"
              : entry.type === "video" && "src" in entry
                ? entry.poster.width > entry.poster.height
                  ? "film-media landscape-film"
                  : "film-media"
                : undefined
          }
          style={
            entry.type === "video" && "src" in entry
              ? ({
                  "--film-aspect-ratio":
                    entry.poster.width / entry.poster.height,
                } as CSSProperties)
              : undefined
          }
        >
          {entry.type === "video" ? (
            <StudioVideo
              controls
              playsInline
              aria-label={entry.alt}
              height={"src" in entry ? entry.poster.height : undefined}
              muted={false}
              poster={
                "src" in entry
                  ? assetPath(entry.poster.src)
                  : muxThumbnail(entry.playbackId)
              }
              preload="none"
              src={
                "src" in entry
                  ? assetPath(entry.src)
                  : muxPlaybackUrl(entry.playbackId)
              }
              width={"src" in entry ? entry.poster.width : undefined}
            />
          ) : (
            <>
              <Image
                alt={entry.alt}
                height={entry.height}
                image={entry}
                sizes={sizes}
                src={assetPath(entry.src)}
                width={entry.width}
              />
              {entry.type === "synopsis" && entry.text && (
                <figcaption className="synopsis-text">{entry.text}</figcaption>
              )}
              {entry.caption && <figcaption>{entry.caption}</figcaption>}
            </>
          )}
        </figure>
      ))}
    </div>
  );
}
