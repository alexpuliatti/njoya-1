const navigation = [
  { label: "WORK", href: "/work" },
  { label: "LAB", href: "/lab" },
  { label: "ABOUT", href: "/about" },
];

export const siteConfig = {
  name: "NJOYA STUDIOS",
  description:
    "A multidisciplinary creative practice working across space, image, objects and experiences.",
  navItems: navigation,
  navMenuItems: navigation,
};

export type SiteConfig = typeof siteConfig;
