import type { Metadata } from "next";

import { ArrowUpRight } from "lucide-react";

import Image from "@/components/studio-image";
import { assetPath } from "@/lib/asset-path";
import { coverSize } from "@/lib/image-sources";
import { getAbout, getSite } from "@/lib/content/repository";

export const metadata: Metadata = { title: "About" };
export default async function AboutPage() {
  const [about, site] = await Promise.all([getAbout(), getSite()]);

  return (
    <div className="about-page">
      <section className="studio-biography">
        <div>
          <p className="eyebrow">A multidisciplinary creative practice</p>
          <h1>
            We build
            <br />
            worlds.
          </h1>
          <p className="biography-copy">{about.biography}</p>
        </div>
        {about.portrait && (
          <div className="studio-portrait">
            <Image
              fill
              priority
              alt={about.portrait.alt}
              image={about.portrait}
              sizes="(max-width: 767px) 80vw, 30vw"
              src={assetPath(about.portrait.src)}
            />
          </div>
        )}
      </section>
      <section className="team-section">
        <div className="section-title">
          <p className="eyebrow">The people behind the worlds</p>
          <h2>The studio.</h2>
        </div>
        <div className="team-grid">
          {about.team.map((person) => (
            <article key={person.email} className="team-card">
              {person.image && (
                <div className="team-portrait">
                  <Image
                    fill
                    alt={person.image.alt}
                    image={person.image}
                    sizes={`(max-width: 767px) ${coverSize("min(72vw, 300px)", "min(72vw, 300px)", person.image)}, ${coverSize("24vw", "24vw", person.image)}`}
                    src={assetPath(person.image.src)}
                  />
                </div>
              )}
              <h3>{person.name}</h3>
              <p className="eyebrow">{person.position}</p>
              <p className="team-description">{person.description}</p>
              <a className="text-button" href={`mailto:${person.email}`}>
                {person.email}
                <ArrowUpRight size={14} />
              </a>
            </article>
          ))}
        </div>
      </section>
      <section className="contact-section">
        <div>
          <p className="eyebrow">Start a conversation</p>
          <h2>
            Let&apos;s build
            <br />
            something.
          </h2>
        </div>
        <div className="contact-list">
          {site.contacts.map((contact) => (
            <div key={contact.label}>
              <h3 className="eyebrow">{contact.label}</h3>
              {contact.emails.map((email) => (
                <a key={email} href={`mailto:${email}`}>
                  {email}
                  <ArrowUpRight size={19} />
                </a>
              ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
