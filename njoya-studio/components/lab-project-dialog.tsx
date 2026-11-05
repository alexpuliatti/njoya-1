"use client";

import type { ContentImage, LabEntry } from "@/lib/content/types";
import type { CSSProperties } from "react";

import { useId } from "react";

import { GradientDivider } from "@/components/gradient-components/gradient-divider";

import styles from "./lab-project-dialog.module.css";
import MediaGallery from "./media-gallery";
import {
  StudioDialog,
  StudioDialogClose,
  StudioDialogPanel,
} from "./ui/studio-dialog";

function LabImageGallery({ images }: { images: ContentImage[] }) {
  const mobileWidth = "calc(100vw - 58px)";
  const desktopWidth = "min(calc((100vw - 130px) / 2), 553px)";

  return (
    <div className={styles.imageGrid}>
      {images.map((image) => {
        const ratio = image.width / image.height;
        // Preserve portraits; trim less than 3% vertically from landscapes.
        const frameRatio = ratio > 1 ? ratio * 1.03 : ratio;
        const maxWidth = `${360 * frameRatio}px`;

        return (
          <div
            key={image.src}
            className={styles.imageItem}
            style={
              {
                "--lab-image-ratio": frameRatio,
                "--lab-image-max-width": maxWidth,
              } as CSSProperties
            }
          >
            <MediaGallery
              entries={[image]}
              sizes={`(max-width: 767px) min(${mobileWidth}, ${maxWidth}), min(${desktopWidth}, ${maxWidth})`}
            />
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
            <GradientDivider
              animation="none"
              className={styles.sectionDivider}
              thickness="3px"
            />
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
            <GradientDivider
              animation="none"
              className={styles.sectionDivider}
              thickness="3px"
            />
            <h3 className={styles.sectionTitle} id={makingTitleId}>
              The Making
            </h3>
            <LabImageGallery images={project.making} />
          </section>
        ) : null}
        {result.length > 0 ? (
          <section aria-labelledby={resultTitleId} className={styles.gallery}>
            <GradientDivider
              animation="none"
              className={styles.sectionDivider}
              thickness="3px"
            />
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
