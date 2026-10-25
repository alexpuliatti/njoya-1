"use client";

import type { ContentImage, LabEntry } from "@/lib/content/types";

import { useId } from "react";

import { coverSize } from "@/lib/image-sources";

import styles from "./lab-project-dialog.module.css";
import MediaGallery from "./media-gallery";
import {
  StudioDialog,
  StudioDialogClose,
  StudioDialogPanel,
} from "./ui/studio-dialog";

function LabImageGallery({
  images,
  sketches = false,
}: {
  images: ContentImage[];
  sketches?: boolean;
}) {
  const mobileWidth = "calc(100vw - 58px)";
  const desktopWidth = "min(calc((100vw - 130px) / 2), 553px)";
  const imageSize = (width: string, image: ContentImage) =>
    sketches
      ? width
      : coverSize(width, `min(calc((${width}) * 0.75), 360px)`, image);

  return (
    <div className={`${styles.imageGrid} ${sketches ? styles.sketches : ""}`}>
      {images.map((image) => (
        <MediaGallery
          key={image.src}
          entries={[image]}
          sizes={`(max-width: 767px) ${imageSize(mobileWidth, image)}, ${imageSize(desktopWidth, image)}`}
        />
      ))}
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
            <LabImageGallery sketches images={project.sketches} />
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
