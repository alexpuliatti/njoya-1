import type { LabEntry } from "@/lib/content/types";

import styles from "./lab-case-study.module.css";

import Image from "@/components/studio-image";

export default function LabCaseStudy({
  entry,
  heading = "h2",
}: {
  entry: LabEntry;
  heading?: "h1" | "h2";
}) {
  const Heading = heading;
  const image = entry.gallery[0];

  return (
    <article
      aria-labelledby={`case-study-${entry.slug}`}
      className={styles.study}
    >
      {image ? (
        <Image
          alt={image.alt}
          className={styles.image}
          height={image.height}
          image={image}
          sizes="(max-width: 767px) calc(100vw - 90px), (max-width: 1500px) 45vw, 690px"
          src={image.src}
          width={image.width}
        />
      ) : null}
      <div className={styles.copy}>
        <Heading className={styles.title} id={`case-study-${entry.slug}`}>
          {entry.title}
        </Heading>
        <p className={styles.summary}>{entry.summary}</p>
        {entry.paragraphs.map((paragraph, index) => (
          <p key={index} className={styles.paragraph}>
            {paragraph}
          </p>
        ))}
      </div>
    </article>
  );
}
