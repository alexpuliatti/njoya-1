"use client";

import type { ContentImage, LabEntry } from "@/lib/content/types";
import type { CSSProperties } from "react";

import { useId } from "react";

import styles from "./lab-project-dialog.module.css";
import LabWalkingDivider from "./lab-walking-divider";
import MediaGallery from "./media-gallery";
import {
  StudioDialog,
  StudioDialogClose,
  StudioDialogPanel,
} from "./ui/studio-dialog";

// Balance adjacent pairs and trios without changing the image order. A combined
// aspect ratio near 3 keeps rows comfortable for both drawings and photographs.
function galleryRows(images: ContentImage[]): ContentImage[][] {
  if (images.length < 2) return images.length ? [images] : [];

  const layouts = new Map<number, { cost: number; rows: ContentImage[][] }>([
    [images.length, { cost: 0, rows: [] }],
  ]);

  for (let start = images.length - 2; start >= 0; start--) {
    for (const count of [2, 3]) {
      const next = layouts.get(start + count);

      if (!next) continue;
      const row = images.slice(start, start + count);
      const ratio = row.reduce((sum, image) => sum + image.width / image.height, 0);
      const cost = (ratio - 3) ** 2 + next.cost;

      if (cost < (layouts.get(start)?.cost ?? Infinity)) {
        layouts.set(start, { cost, rows: [row, ...next.rows] });
      }
    }
  }

  return layouts.get(0)!.rows;
}

function LabImageGallery({ images }: { images: ContentImage[] }) {
  const rows = galleryRows(images);

  return (
    <div className={styles.imageGrid}>
      {rows.map((row) => {
        const ratios = row.map((image) => image.width / image.height);
        const totalRatio = ratios.reduce((sum, ratio) => sum + ratio, 0);
        const gaps = (row.length - 1) * 24;
        const availableWidth = `min(calc(100vw - ${106 + gaps}px), ${1130 - gaps}px)`;

        return (
          <div
            key={row[0].src}
            className={styles.imageRow}
            style={
              {
                "--gallery-columns": ratios.map((ratio) => `${ratio}fr`).join(" "),
              } as CSSProperties
            }
          >
            {row.map((image, index) => (
              <MediaGallery
                key={image.src}
                entries={[image]}
                sizes={`(max-width: 767px) calc(100vw - 58px), calc(${availableWidth} * ${(ratios[index] / totalRatio).toFixed(5)})`}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

export default function LabProjectDialog({
  entry,
  project,
  instant,
  onClose,
}: {
  entry: LabEntry;
  project: NonNullable<LabEntry["project"]>;
  instant: boolean;
  onClose: () => void;
}) {
  const titleId = useId();
  const sketchesTitleId = useId();
  const makingTitleId = useId();
  const resultTitleId = useId();
  const result = project.result ?? entry.gallery;

  return (
    <StudioDialog aria-labelledby={titleId} instant={instant} onClose={onClose}>
      <StudioDialogPanel className="project-dialog-panel">
        <header className="project-dialog-toolbar">
          <span className="eyebrow">
            Njoya Studios <span aria-hidden="true">/</span> Lab
          </span>
          <StudioDialogClose label="Close project" />
        </header>
        <div className={styles.introduction}>
          <h2 className={styles.title} id={titleId}>
            <span>{project.client}</span>
            <span>{project.title}</span>
          </h2>
          <p className={styles.brief}>{project.brief}</p>
        </div>
        {project.sketches?.length ? (
          <section
            aria-labelledby={sketchesTitleId}
            className={`${styles.gallery} ${styles.processSection}`}
          >
            <LabWalkingDivider action="build" />
            <h3 className={styles.sectionTitle} id={sketchesTitleId}>
              {project.sketchesTitle ?? "Conceptual sketches"}
            </h3>
            <LabImageGallery images={project.sketches} />
          </section>
        ) : null}
        {project.making?.length ? (
          <section
            aria-labelledby={makingTitleId}
            className={`${styles.gallery} ${styles.processSection}`}
          >
            <LabWalkingDivider action="dance" />
            <h3 className={styles.sectionTitle} id={makingTitleId}>
              The Making
            </h3>
            <LabImageGallery images={project.making} />
          </section>
        ) : null}
        {result.length > 0 ? (
          <section aria-labelledby={resultTitleId} className={styles.gallery}>
            <LabWalkingDivider />
            <h3 className={styles.sectionTitle} id={resultTitleId}>
              The result
            </h3>
            <LabImageGallery images={result} />
          </section>
        ) : null}
        {project.closingParagraphs?.length ? (
          <div className={`${styles.brief} ${styles.closing}`}>
            {project.closingParagraphs.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
        ) : null}
      </StudioDialogPanel>
    </StudioDialog>
  );
}
