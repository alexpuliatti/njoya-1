/**
 * Carousel types shared between njoya-carousel, njoya-carousel-card,
 * and project-dialog.
 *
 * If your existing njoya-carousel-types.ts has additional fields,
 * just merge in `coverVideoPlaybackId` and `galleryVideoPlaybackIds`
 * onto NjoyaCarouselItem — those are the only new bits.
 */

import type { ContentImage, GalleryEntry } from "@/lib/content/types";

export interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  href: string;
  imageUrl: string;
  searchText: string;
}

export interface NjoyaCarouselMetadata {
  label: string;
  value: string;
}

export interface NjoyaCarouselItem {
  id: string;
  title: string;
  subtitle: string;

  /** Still image used by the card (when not hovering) and as the
   *  source for the FLIP clone. For video items this is the Mux
   *  thumbnail; for image-only items it's the cover image. */
  imageUrl: string;
  cover?: ContentImage;
  imageAlt?: string;
  heroImageUrl?: string;
  gallery?: GalleryEntry[];
  /** Motion category viewers show films without the project's still assets. */
  videoOnly?: boolean;
  unavailable?: boolean;

  href: string;
  linkLabel: string;
  category: string;
  type: "shoot" | "design-project";
  isMultiEdition?: boolean;

  images: string[];
  metadata: NjoyaCarouselMetadata[];

  /** ─── NEW ───────────────────────────────────────
   *  When set, the card overlays a muted <video> that
   *  plays on hover, and the detail panel hero renders
   *  a <video> instead of an <Image>.
   */
  coverVideoPlaybackId?: string;
  /** Small silent local MP4; visible Motion cards autoplay, other cards use hover. */
  previewVideoSrc?: string;

  /** ─── NEW ───────────────────────────────────────
   *  Additional gallery videos. Empty for now (schema
   *  only has cover videos), but the detail panel
   *  already renders these — add a field like
   *  magVideo1..magVideoN later and they'll surface
   *  automatically.
   */
  galleryVideoPlaybackIds?: string[];
}

export interface NjoyaClickPayload {
  item: NjoyaCarouselItem;
  imgEl: HTMLImageElement;
  /** Keyboard activation opens the project immediately. */
  instant?: boolean;
}
