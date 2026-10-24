import type { GalleryEntry } from "@/lib/content/types";

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
    <div className="media-gallery">
      {entries.map((entry, index) => (
        <figure
          key={`${entry.type}-${index}`}
          className={entry.type === "synopsis" ? "synopsis-media" : undefined}
        >
          {entry.type === "video" ? (
            <StudioVideo
              controls
              playsInline
              aria-label={entry.alt}
              poster={muxThumbnail(entry.playbackId)}
              preload="none"
              src={muxPlaybackUrl(entry.playbackId)}
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
