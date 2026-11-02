"use client";

import type { NjoyaClickPayload } from "@/lib/njoya-carousel-types";

import { useId } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUpRight } from "lucide-react";

import Image from "./studio-image";
import MediaGallery from "./media-gallery";
import StudioVideo from "./studio-video";
import { StudioButton } from "./ui/studio-button";
import {
  StudioDialog,
  StudioDialogClose,
  StudioDialogHero,
  StudioDialogPanel,
} from "./ui/studio-dialog";

import { assetPath } from "@/lib/asset-path";
import { panelImageSize } from "@/lib/image-sources";
import { muxPlaybackUrl } from "@/lib/mux";

export default function ProjectDialog({
  clickPayload,
  onClose,
}: {
  clickPayload: NjoyaClickPayload | null;
  onClose: () => void;
}) {
  const titleId = useId();

  if (!clickPayload) return null;
  const { item, imgEl, instant } = clickPayload;
  const gallery = item.gallery ?? [];

  return (
    <StudioDialog
      key={item.id}
      aria-labelledby={titleId}
      className="project-dialog"
      source={{ image: imgEl, instant }}
      onClose={onClose}
    >
      <StudioDialogPanel className="project-dialog-panel">
        <header className="project-dialog-toolbar">
          <span className="eyebrow">
            Njoya Studios <span aria-hidden="true">/</span> Selected work
          </span>
          <StudioDialogClose label="Close project" />
        </header>
        <div className="project-dialog-overview">
          <StudioDialogHero>
            <Image
              fill
              priority
              alt={item.imageAlt ?? item.title}
              image={item.cover}
              sizes={panelImageSize(item.cover)}
              src={assetPath(item.heroImageUrl ?? item.imageUrl)}
            />
            {item.coverVideoPlaybackId && (
              <StudioVideo
                autoPlay
                loop
                muted
                playsInline
                className="project-dialog-video"
                src={muxPlaybackUrl(item.coverVideoPlaybackId)}
              />
            )}
          </StudioDialogHero>
          <aside className="project-dialog-information">
            <div>
              <p className="eyebrow">{item.category}</p>
              <h2 id={titleId}>{item.title}</h2>
              {item.subtitle && item.subtitle !== item.title && (
                <p className="project-dialog-subtitle">{item.subtitle}</p>
              )}
            </div>
            {item.metadata.length > 0 && (
              <details open className="project-credits">
                <summary>
                  Project credits{" "}
                  <span>{String(item.metadata.length).padStart(2, "0")}</span>
                </summary>
                <dl>
                  {item.metadata.map((credit, index) => (
                    <div key={`${credit.label}-${index}`}>
                      <dt>{credit.label}</dt>
                      <dd>{credit.value}</dd>
                    </div>
                  ))}
                </dl>
              </details>
            )}
            <div className="project-dialog-links">
              {gallery.length > 0 && (
                <span className="project-gallery-cue">
                  <ArrowDown size={14} /> Explore the project below
                </span>
              )}
              {item.href && (
                <StudioButton asChild variant="outline">
                  <Link href={item.href}>
                    Project page <ArrowUpRight size={15} />
                  </Link>
                </StudioButton>
              )}
            </div>
          </aside>
        </div>
        {gallery.length > 0 && (
          <section
            aria-label="Project gallery"
            className="project-dialog-gallery"
          >
            <div className="project-dialog-gallery-heading">
              <span className="eyebrow">Inside the project</span>
              <span className="eyebrow">
                {String(gallery.length).padStart(2, "0")} entries
              </span>
            </div>
            <MediaGallery entries={gallery} maxWidth={780} />
          </section>
        )}
      </StudioDialogPanel>
    </StudioDialog>
  );
}
