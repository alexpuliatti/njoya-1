export type TransitionCharacter = "builder" | "explorer" | "observer";

export type TransitionDestination = {
  href: string;
  pathname: string;
  character: TransitionCharacter;
  label: string;
};

export const transitionSprites: Record<TransitionCharacter, string[]> = {
  builder: ["/media/motion/world-builder-turn.webp"],
  explorer: ["/media/motion/explorer-turn.webp"],
  observer: [
    "/media/motion/observer-walk-right.webp",
    "/media/motion/observer-jump.webp",
  ],
};

const normalizePath = (pathname: string) => pathname.replace(/\/+$/, "") || "/";

/** Resolve only real, different app pages; leave native link behavior intact. */
export function getTransitionDestination(
  href: string,
  currentHref: string,
  basePath = "",
): TransitionDestination | null {
  const current = new URL(currentHref);
  let target: URL;

  try {
    target = new URL(href, current);
  } catch {
    return null;
  }
  if (target.origin !== current.origin || !/^https?:$/.test(target.protocol))
    return null;

  const prefix = normalizePath(basePath) === "/" ? "" : normalizePath(basePath);
  const stripPrefix = (pathname: string) => {
    const path = normalizePath(pathname);

    if (!prefix) return path;
    if (path === prefix) return "/";
    return path.startsWith(`${prefix}/`) ? path.slice(prefix.length) : null;
  };
  const pathname = stripPrefix(target.pathname);

  // Query changes, fragment jumps, and repeated clicks on the current page
  // should never wait for a pathname change that cannot happen.
  if (pathname === null || pathname === stripPrefix(current.pathname))
    return null;

  const section = pathname.split("/")[1];
  const scene =
    section === "about"
      ? { character: "observer" as const, label: "About" }
      : section === "lab" || section === "motion"
        ? {
            character: "explorer" as const,
            label: section === "lab" ? "Lab" : "Motion studies",
          }
        : ["work", "shoots", "design-projects"].includes(section)
          ? { character: "builder" as const, label: "Work" }
          : pathname === "/"
            ? { character: "builder" as const, label: "Home" }
            : section === "search"
              ? { character: "explorer" as const, label: "Search" }
              : null;

  if (!scene) return null;

  return {
    ...scene,
    pathname,
    // The App Router adds basePath itself. Preserve queries and fragments.
    href: `${pathname}${target.search}${target.hash}`,
  };
}
