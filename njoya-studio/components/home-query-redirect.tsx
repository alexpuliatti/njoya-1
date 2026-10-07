"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function HomeQueryRedirect() {
  const query = useSearchParams().get("q");
  const router = useRouter();

  useEffect(() => {
    if (query) router.replace(`/search?q=${encodeURIComponent(query)}`);
  }, [query, router]);

  return null;
}
