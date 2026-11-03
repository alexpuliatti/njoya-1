import type { Metadata } from "next";

import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

import styles from "../motion.module.css";

import ExplorerLetterStudy from "@/components/explorer-letter-study";
import { getSite } from "@/lib/content/repository";

export const metadata: Metadata = {
  title: "The explorer — Motion study",
  robots: { index: false, follow: false },
};

export default async function ExplorerMotionPage() {
  const site = await getSite();

  return (
    <div className={styles.page}>
      <div className={styles.topline}>
        <Link className={styles.back} href="/motion">
          <ArrowLeft aria-hidden="true" size={14} />
          Back to the builder
        </Link>
        <span className={styles.study}>Motion study / 02</span>
      </div>

      <div className={styles.layout}>
        <section
          aria-label="Explorer and rolling letter animation"
          className={styles.stage}
        >
          <div className={styles.stageTopline}>
            <span>Njoya Studios</span>
            <span className={styles.stageLabel}>Work in motion</span>
          </div>
          <div className={styles.composition}>
            <ExplorerLetterStudy />
            <p className={styles.statement}>{site.statement}</p>
          </div>
          <p className={styles.stageFooter}>
            Space. Image. Objects. Experiences.
          </p>
        </section>

        <aside className={styles.notes}>
          <p className={styles.eyebrow}>02 / The explorer</p>
          <h2>
            A world
            <br />
            finding its feet.
          </h2>
          <p className={styles.description}>
            Curious, nimble, and a little mischievous. A second character brings
            the O home, then steps back to stay beside the S.
          </p>
          <div className={styles.detail}>
            <span className={styles.detailNumber}>01</span>
            <p>Find a little momentum.</p>
          </div>
          <div className={styles.detail}>
            <span className={styles.detailNumber}>02</span>
            <p>Steady the last wobble.</p>
          </div>
          <div className={styles.detail}>
            <span className={styles.detailNumber}>03</span>
            <p>A place beside the S.</p>
          </div>
          <Link className={styles.studyLink} href="/motion">
            <span>01 / The builder</span>
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
