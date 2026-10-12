import type { Metadata } from "next";

import { ArrowUpRight } from "lucide-react";

import NewsletterForm from "@/components/newsletter-form";
import AnimatedContent from "@/components/react-bits/animated-content";
import { getAbout, getSite } from "@/lib/content/repository";

export const metadata: Metadata = { title: "About" };
export default async function AboutPage() {
  const [about, site] = await Promise.all([getAbout(), getSite()]);

  return (
    <div className="about-page">
      <section aria-labelledby="about-heading" className="studio-biography">
        <div>
          <p className="eyebrow">A multidisciplinary creative practice</p>
          <h1 id="about-heading">
            We build
            <br />
            worlds.
          </h1>
        </div>
        <p className="biography-copy">{about.biography}</p>
      </section>
      <section aria-labelledby="inquiries-heading" className="contact-section">
        <div>
          <p className="eyebrow">Start a conversation</p>
          <h2 id="inquiries-heading">
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
                  <ArrowUpRight aria-hidden="true" size={19} />
                </a>
              ))}
            </div>
          ))}
        </div>
      </section>
      <section aria-labelledby="newsletter-heading" className="newsletter-section">
        <div>
          <p className="eyebrow">Notes from Njoya</p>
          <h2 id="newsletter-heading">Stay in the loop.</h2>
          <p className="newsletter-copy">
            Occasional notes on new projects, ideas and happenings at the studio.
          </p>
        </div>
        <AnimatedContent className="newsletter-signup">
          <NewsletterForm />
        </AnimatedContent>
      </section>
    </div>
  );
}
