"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

interface Props {
  title: string;
}

export default function MobilePageHeading({ title }: Props) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(
      ref.current,
      { opacity: 0, y: -6 },
      { opacity: 1, y: 0, duration: 0.7, ease: "expo.out", delay: 1.0 },
    );
  }, [title]);

  return (
    <h1
      ref={ref}
      className="pointer-events-none fixed left-1/2 top-[120px] z-[80] -translate-x-1/2 whitespace-nowrap text-center text-xs font-medium uppercase tracking-[0.22em] text-white/75 md:hidden"
      style={{ opacity: 0 }}
    >
      {title}
    </h1>
  );
}
