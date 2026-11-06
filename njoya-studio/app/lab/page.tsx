import type { Metadata } from "next";

import styles from "./lab.module.css";

import LabCaseStudy from "@/components/lab-case-study";
import { getLabEntries } from "@/lib/content/repository";
export const metadata: Metadata = {
  title: "Lab",
  description: "Research, materials and ideas in progress at Njoya Studios.",
};
export default async function LabPage() {
  const entries = await getLabEntries();

  return (
    <div className="lab-page">
      <header className="lab-introduction">
        <p className="eyebrow">Research & exploration</p>
        <h1>
          Before a world,
          <br />
          an idea.
        </h1>
        <p>
          Our studio explores the creative direction of worlds where ideas come
          to life. The process always begins with a narrative - a story that
          engages our thoughts and feelings. From this foundation, we use memory,
          colour, texture, materials, forms, and sound to shape the identity and
          atmosphere of each project. Here, we share a glimpse into our process,
          creative explorations, and final outcomes.
        </p>
      </header>
      {entries.length ? (
        <div className={styles.studies}>
          {entries.map((entry, index) => (
            <LabCaseStudy key={entry.id} entry={entry} priority={index === 0} />
          ))}
        </div>
      ) : (
        <div className="lab-empty">
          <span aria-hidden="true" className="lab-symbol">
            *
          </span>
          <p>In the making.</p>
          <span>
            Research and explorations from the studio.
            <br />
            Coming soon.
          </span>
        </div>
      )}
    </div>
  );
}
