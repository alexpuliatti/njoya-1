import { headers } from "next/headers";
import { permanentRedirect, redirect } from "next/navigation";

import StaticRedirect from "./static-redirect";

export default function LegacyRedirect({
  href,
  permanent = true,
}: {
  href: string;
  permanent?: boolean;
}) {
  if (process.env.NEXT_PUBLIC_STATIC_EXPORT !== "true") {
    // Keep HTTP redirects on Node hosts, without forcing dynamic Pages output.
    headers();
    if (permanent) permanentRedirect(href);
    redirect(href);
  }

  return <StaticRedirect href={href} />;
}
