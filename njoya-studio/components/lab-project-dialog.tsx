"use client";

import type { CSSProperties } from "react";
import type { ContentImage, LabEntry } from "@/lib/content/types";

import { useId } from "react";

import styles from "./lab-project-dialog.module.css";
import MediaGallery from "./media-gallery";
import {
  StudioDialog,
  StudioDialogClose,
  StudioDialogPanel,
} from "./ui/studio-dialog";

function LabImageGallery({ images }: { images: ContentImage[] }) {
  const rows = Array.from(
    { length: Math.ceil(images.length / 2) },
    (_, index) => images.slice(index * 2, index * 2 + 2),
  );

  return (
    <div className={styles.imageRows}>
      {rows.map((row) => {
        const ratios = row.map((image) => image.width / image.height);
        const total = ratios.reduce((sum, ratio) => sum + ratio, 0);

        return (
          <div
            key={row[0].src}
            className={styles.imageRow}
            style={
              {
                "--image-columns": ratios
                  .map((ratio) => `${ratio}fr`)
                  .join(" "),
              } as CSSProperties
            }
          >
            {row.map((image, index) => {
              const fraction = ratios[index] / total;
              const available = row.length === 1 ? 1130 : 1106;
              const inset = row.length === 1 ? 106 : 130;
              const sizes = `(max-width: 767px) calc(100vw - 58px), min(calc((100vw - ${inset}px) * ${fraction}), ${available * fraction}px)`;

              return (
                <MediaGallery key={image.src} entries={[image]} sizes={sizes} />
              );
            })}
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
            <h3 className={styles.sectionTitle} id={sketchesTitleId}>
              Conceptual sketches
            </h3>
            <LabImageGallery images={project.sketches} />
          </section>
        ) : null}
        {project.making?.length ? (
          <section
            aria-labelledby={makingTitleId}
            className={`${styles.gallery} ${styles.processSection}`}
          >
            <h3 className={styles.sectionTitle} id={makingTitleId}>
              The Making
            </h3>
            <LabImageGallery images={project.making} />
          </section>
        ) : null}
        {result.length > 0 ? (
          <section aria-labelledby={resultTitleId} className={styles.gallery}>
            <h3 className={styles.sectionTitle} id={resultTitleId}>
              The result
            </h3>
            <LabImageGallery images={result} />
          </section>
        ) : null}
      </StudioDialogPanel>
    </StudioDialog>
  );
}
