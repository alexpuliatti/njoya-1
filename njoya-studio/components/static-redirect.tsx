"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { assetPath } from "@/lib/asset-path";

export default function StaticRedirect({ href }: { href: string }) {
  const router = useRouter();

  useEffect(() => router.replace(href), [href, router]);

  return (
    <div className="empty-state">
      <meta content={`0;url=${assetPath(href)}`} httpEquiv="refresh" />
      <p>This page has moved.</p>
      <Link className="text-button" href={href}>
        Continue to the page →
      </Link>
    </div>
  );
}
