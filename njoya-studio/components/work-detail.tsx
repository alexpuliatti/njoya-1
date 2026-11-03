import type { ContentImage, GalleryEntry } from "@/lib/content/types";
import type { NjoyaCarouselMetadata } from "@/lib/njoya-carousel-types";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import Image from "./studio-image";
import StudioVideo from "./studio-video";
import MediaGallery from "./media-gallery";

import { assetPath } from "@/lib/asset-path";
import { muxPlaybackUrl } from "@/lib/mux";

export default function WorkDetail({
  title,
  subtitle,
  backHref,
  backLabel,
  cover,
  heroVideoPlaybackId,
  gallery,
  metadata,
}: {
  title: string;
  subtitle?: string;
  backHref: string;
  backLabel: string;
  cover: ContentImage;
  heroVideoPlaybackId?: string;
  gallery: GalleryEntry[];
  metadata: NjoyaCarouselMetadata[];
}) {
  return (
    <article className="work-detail-page">
      <Link className="project-back text-button" href={backHref}>
        <ArrowLeft size={16} />
        {backLabel}
      </Link>
      <section className="project-hero">
        <div className="project-hero-media">
          {heroVideoPlaybackId ? (
            <StudioVideo
              controls
              loop
              muted
              playsInline
              aria-label={title}
              poster={assetPath(cover.src)}
              preload="metadata"
              src={muxPlaybackUrl(heroVideoPlaybackId)}
            />
          ) : (
            <Image
              priority
              alt={cover.alt}
              height={cover.height}
              image={cover}
              sizes="(max-width: 767px) 92vw, 52vw"
              src={assetPath(cover.src)}
              width={cover.width}
            />
          )}
        </div>
        <div className="project-information">
          <p className="eyebrow">{subtitle}</p>
          <h1>{title}</h1>
          <dl>
            {metadata.map((entry, index) => (
              <div key={`${entry.label}-${index}`}>
                <dt>{entry.label}</dt>
                <dd>{entry.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>
      <MediaGallery entries={gallery} />
    </article>
  );
}
