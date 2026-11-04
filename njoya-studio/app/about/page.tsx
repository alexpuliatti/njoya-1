import type { Metadata } from "next";

import { ArrowUpRight } from "lucide-react";

import { GradientDivider } from "@/components/gradient-components/gradient-divider";
import NewsletterForm from "@/components/newsletter-form";
import ObserverCharacter from "@/components/observer-character";
import AnimatedContent from "@/components/react-bits/animated-content";
import { getAbout, getSite } from "@/lib/content/repository";

export const metadata: Metadata = { title: "About" };

const selectedClients = [
  "Hermès",
  "Gucci",
  "Lacoste",
  "Chanel",
  "Issey Miyake",
  "Audemars Piguet",
  "Louboutin",
  "Jaguar",
  "Balmain",
  "Potato Head",
  "Victoria and Albert Museum",
  "Vogue",
  "Dazed",
];

export default async function AboutPage() {
  const [about, site] = await Promise.all([getAbout(), getSite()]);

  return (
    <div className="about-page">
      <section aria-labelledby="about-heading" className="studio-biography">
        <h1 id="about-heading">
          <span>WE BUILD</span> <span>WORLDS</span>
        </h1>
        <p className="biography-copy">{about.biography}</p>
        <div aria-hidden="true" className="biography-observer">
          <ObserverCharacter autoPlay behavior="idle" />
        </div>
      </section>
      <GradientDivider className="about-gradient-divider" />
      <section aria-labelledby="clients-heading" className="selected-clients">
        <h2 className="eyebrow" id="clients-heading">
          Selected clients
        </h2>
        <ul className="selected-clients-list">
          {selectedClients.map((client) => (
            <li key={client}>{client}</li>
          ))}
        </ul>
      </section>
      <GradientDivider className="about-gradient-divider" />
      <section aria-labelledby="inquiries-heading" className="contact-section">
        <div>
          <p className="eyebrow">Start a conversation</p>
          <h2 id="inquiries-heading">Let&apos;s build something.</h2>
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
      <GradientDivider className="about-gradient-divider" />
      <section
        aria-labelledby="newsletter-heading"
        className="newsletter-section"
      >
        <div>
          <p className="eyebrow">Notes from Njoya</p>
          <h2 id="newsletter-heading">Stay in the loop.</h2>
          <p className="newsletter-copy">
            Occasional notes on new projects, ideas and happenings at the
            studio.
          </p>
        </div>
        <AnimatedContent className="newsletter-signup">
          <NewsletterForm />
        </AnimatedContent>
      </section>
    </div>
  );
}
