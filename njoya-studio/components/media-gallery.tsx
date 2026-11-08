import type { GalleryEntry } from "@/lib/content/types";
import type { CSSProperties } from "react";

import Image from "./studio-image";
import GalleryFilm from "./gallery-film";

import { assetPath } from "@/lib/asset-path";
import { muxPlaybackUrl, muxThumbnail } from "@/lib/mux";

export default function MediaGallery({
  entries,
  maxWidth = 780,
  sizes = `(max-width: 767px) calc(100vw - 48px), ${maxWidth}px`,
  autoplayPreviews = false,
}: {
  entries: GalleryEntry[];
  maxWidth?: number;
  sizes?: string;
  autoplayPreviews?: boolean;
}) {
  if (!entries.length) return null;
  const filmsOnly = entries.every((entry) => entry.type === "video");

  return (
    <div
      className={[
        "media-gallery",
        entries.length === 1 ? "media-gallery-single" : "",
        filmsOnly ? "media-gallery-films" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={
        filmsOnly
          ? ({ "--film-columns": Math.min(entries.length, 3) } as CSSProperties)
          : undefined
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
            <GalleryFilm
              aria-label={entry.alt}
              autoplayPreview={autoplayPreviews}
              height={"src" in entry ? entry.poster.height : undefined}
              poster={
                "src" in entry
                  ? assetPath(entry.poster.src)
                  : muxThumbnail(entry.playbackId)
              }
              previewSrc={
                "src" in entry && entry.previewVideoSrc
                  ? assetPath(entry.previewVideoSrc)
                  : undefined
              }
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
