"use client";

import type { ComponentProps } from "react";

import Link from "next/link";
import { forwardRef } from "react";

import { usePageTransition } from "./page-transition-provider";

import { getTransitionDestination } from "@/lib/page-transition";

/** A real Next Link first: native clicks and no-JS navigation keep working. */
const TransitionLink = forwardRef<
  HTMLAnchorElement,
  ComponentProps<typeof Link>
>(function TransitionLink({ onClick, onPointerEnter, onFocus, ...props }, ref) {
  const transition = usePageTransition();
  const destination = (anchor: HTMLAnchorElement) =>
    getTransitionDestination(
      anchor.href,
      window.location.href,
      process.env.NEXT_PUBLIC_BASE_PATH,
    );
  const prepare = (anchor: HTMLAnchorElement) => {
    const target = destination(anchor);

    if (target) transition?.prepare(target.character);
  };

  return (
    <Link
      {...props}
      ref={ref}
      onClick={(event) => {
        onClick?.(event);
        const anchor = event.currentTarget;

        if (
          !transition ||
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          event.detail === 0 ||
          anchor.hasAttribute("download") ||
          (anchor.target && anchor.target !== "_self") ||
          props.as ||
          props.shallow ||
          props.legacyBehavior ||
          // Native dialogs live above fixed overlays. Their existing close /
          // shared-image choreography owns navigation from that top layer.
          anchor.closest("dialog[open]")
        )
          return;
        const target = destination(anchor);

        if (
          target &&
          transition.navigate(target, {
            replace: props.replace,
            scroll: props.scroll,
            prefetch: props.prefetch,
          })
        )
          event.preventDefault();
      }}
      onFocus={(event) => {
        onFocus?.(event);
        prepare(event.currentTarget);
      }}
      onPointerEnter={(event) => {
        onPointerEnter?.(event);
        prepare(event.currentTarget);
      }}
    />
  );
});

export default TransitionLink;
