import "@/styles/globals.css";
import type { Metadata, Viewport } from "next";

import { Providers } from "./providers";

import { assetPath } from "@/lib/asset-path";
import { getSearchIndex, getSite } from "@/lib/content/repository";
import SearchProvider from "@/components/search-provider";
import { Navbar } from "@/components/navbar";
import StudioNavigation from "@/components/njoya-carousel-bottom-menu";
import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";
import { INTRO_BOOTSTRAP } from "@/lib/intro";

export const metadata: Metadata = {
  // Next adds basePath to generated metadata assets itself.
  metadataBase: new URL(
    new URL(process.env.SITE_URL || "http://localhost:3000").origin,
  ),
  title: { default: siteConfig.name, template: `%s — ${siteConfig.name}` },
  description:
    "A multidisciplinary creative practice working across space, image, objects and experiences.",
  icons: { icon: assetPath("/favicon.ico") },
};
export const viewport: Viewport = {
  themeColor: "#261b15",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [searchIndex, site] = await Promise.all([getSearchIndex(), getSite()]);

  return (
    <html suppressHydrationWarning className="bg-[#261b15]" lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: INTRO_BOOTSTRAP }} />
      </head>
      <body
        className={`${fontSans.variable} studio-body font-sans antialiased`}
      >
        <Providers themeProps={{ attribute: "class", forcedTheme: "dark" }}>
          <SearchProvider catalog={searchIndex}>
            <a className="skip-link" href="#main-content">
              Skip to content
            </a>
            <Navbar instagram={site.instagram} />
            <main className="studio-main" id="main-content">
              {children}
            </main>
            <StudioNavigation />
          </SearchProvider>
        </Providers>
      </body>
    </html>
  );
}
