import type { Metadata } from "next";

import { ArrowLeft, ArrowUpRight } from "lucide-react";

import styles from "./motion.module.css";

import Link from "@/components/transition-link";
import WorldBuilderHeadline from "@/components/world-builder-headline";
import { getSite } from "@/lib/content/repository";

export const metadata: Metadata = {
  title: "Motion study",
  robots: { index: false, follow: false },
};

export default async function MotionPage() {
  const site = await getSite();

  return (
    <div className={styles.page}>
      <div className={styles.topline}>
        <Link className={styles.back} href="/">
          <ArrowLeft aria-hidden="true" size={14} />
          Back to the studio
        </Link>
        <span className={styles.study}>Motion study / 01</span>
      </div>

      <div className={styles.layout}>
        <section
          aria-label="Character and typography animation"
          className={styles.stage}
        >
          <div className={styles.stageTopline}>
            <span>Njoya Studios</span>
            <span className={styles.stageLabel}>Work in motion</span>
          </div>
          <div className={styles.composition}>
            <WorldBuilderHeadline controls />
            <p className={styles.statement}>{site.statement}</p>
          </div>
          <p className={styles.stageFooter}>
            Space. Image. Objects. Experiences.
          </p>
        </section>

        <aside className={styles.notes}>
          <p className={styles.eyebrow}>01 / The first letter</p>
          <h2>
            A little effort.
            <br />A world taking shape.
          </h2>
          <p className={styles.description}>
            An original character, a single letter, and a first test of how they
            might build together.
          </p>
          <div className={styles.detail}>
            <span className={styles.detailNumber}>01</span>
            <p>Find a grip.</p>
          </div>
          <div className={styles.detail}>
            <span className={styles.detailNumber}>02</span>
            <p>Put a little weight into it.</p>
          </div>
          <div className={styles.detail}>
            <span className={styles.detailNumber}>03</span>
            <p>Everything falls into place.</p>
          </div>
          <Link className={styles.studyLink} href="/motion/explorer">
            <span>02 / The explorer</span>
            <ArrowUpRight aria-hidden="true" size={16} />
          </Link>
          <Link className={styles.studyLink} href="/motion/observer">
            <span>03 / The observer</span>
            <ArrowUpRight aria-hidden="true" size={16} />
          </Link>
        </aside>
      </div>
    </div>
  );
}
