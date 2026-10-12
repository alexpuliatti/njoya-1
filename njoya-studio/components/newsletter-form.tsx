"use client";

import type { FormEvent } from "react";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";

import { StudioButton } from "@/components/ui/studio-button";

export default function NewsletterForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Placeholder only: do not send or store email addresses.
    setSubmitted(true);
  }

  return (
    <form className="newsletter-form" onSubmit={handleSubmit}>
      <label className="eyebrow" htmlFor="newsletter-email">
        Email address
      </label>
      <div className="newsletter-field">
        <input
          required
          aria-describedby="newsletter-status"
          autoComplete="email"
          autoCapitalize="none"
          id="newsletter-email"
          name="email"
          placeholder="Your email address"
          spellCheck={false}
          type="email"
          onChange={() => setSubmitted(false)}
        />
        <StudioButton type="submit" variant="solid">
          Subscribe
          <ArrowUpRight aria-hidden="true" size={16} strokeWidth={1.5} />
        </StudioButton>
      </div>
      <p
        aria-atomic="true"
        className="newsletter-status"
        id="newsletter-status"
        role="status"
      >
        {submitted
          ? "Thanks for your interest. Sign-ups are coming soon; your email hasn’t been saved."
          : "Coming soon. Subscriptions aren’t open yet."}
      </p>
    </form>
  );
}
