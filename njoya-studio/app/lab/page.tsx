import type { Metadata } from "next";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

import { assetPath } from "@/lib/asset-path";
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
          A space for the questions, materials, sketches and experiments that
          shape our practice.
        </p>
      </header>
      {entries.length ? (
        <div className="lab-grid">
          {entries.map((entry) => (
            <Link
              key={entry.id}
              className="lab-entry-card"
              href={`/lab/${entry.slug}`}
            >
              {entry.gallery[0] && (
                <Image
                  alt={entry.gallery[0].alt}
                  height={900}
                  src={assetPath(entry.gallery[0].previewSrc)}
                  width={720}
                />
              )}
              <p className="eyebrow">{entry.date}</p>
              <h2>
                {entry.title}
                <ArrowUpRight size={21} />
              </h2>
              <p>{entry.summary}</p>
            </Link>
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
