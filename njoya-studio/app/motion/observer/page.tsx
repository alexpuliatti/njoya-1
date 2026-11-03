import type { Metadata } from "next";

import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

import styles from "../motion.module.css";
import local from "./observer.module.css";

import ObserverStudy from "@/components/observer-study";
import { getLabEntries } from "@/lib/content/repository";

export const metadata: Metadata = {
  title: "The observer — Motion study",
  robots: { index: false, follow: false },
};

export default async function ObserverMotionPage() {
  const entries = await getLabEntries();
  const project =
    entries.find((entry) => entry.slug === "brides-de-galaxy") ?? entries[0];
  const image = project?.gallery.find((media) => media.type === "image");

  return (
    <div className={styles.page}>
      <div className={styles.topline}>
        <Link className={styles.back} href="/motion/explorer">
          <ArrowLeft aria-hidden="true" size={14} /> Back to the explorer
        </Link>
        <span className={styles.study}>Motion study / 03</span>
      </div>
      <div className={styles.layout}>
        <section
          aria-label="Observer peeking around a project"
          className={`${styles.stage} ${local.stage}`}
        >
          <div className={`${styles.stageTopline} ${local.topline}`}>
            <span>Njoya Studios</span>
            <span className={styles.stageLabel}>Work in motion</span>
          </div>
          <div className={styles.composition}>
            {project && image ? (
              <ObserverStudy
                href={`/lab/${project.slug}`}
                image={image}
                title={project.title}
              />
            ) : (
              <h1>A closer look.</h1>
            )}
          </div>
          <p className={styles.stageFooter}>
            Space. Image. Objects. Experiences.
          </p>
        </section>
        <aside className={styles.notes}>
          <p className={styles.eyebrow}>03 / The observer</p>
          <h2>
            A little curiosity.
            <br />A different perspective.
          </h2>
          <p className={styles.description}>
            A quiet companion at the edge of the work. A slow blink, a second
            look, then room for the project to speak.
          </p>
          <div className={styles.detail}>
            <span className={styles.detailNumber}>01</span>
            <p>Something catches an eye.</p>
          </div>
          <div className={styles.detail}>
            <span className={styles.detailNumber}>02</span>
            <p>Pause for a closer look.</p>
          </div>
          <div className={styles.detail}>
            <span className={styles.detailNumber}>03</span>
            <p>Leave the work centre stage.</p>
          </div>
          <Link className={styles.studyLink} href="/about">
            <span>See the observer on About</span>
            <ArrowUpRight aria-hidden="true" size={16} />
          </Link>
          <Link className={styles.studyLink} href="/motion">
            <span>01 / The builder</span>
            <ArrowUpRight aria-hidden="true" size={16} />
          </Link>
        </aside>
      </div>
    </div>
  );
}
