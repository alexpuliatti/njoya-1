import type { z } from "zod";
import type {
  workSchema,
  collectionSchema,
  imageSchema,
  videoSchema,
  categorySchema,
  homeSchema,
  siteSchema,
  aboutSchema,
  labSchema,
} from "./schema.mjs";

export type Work = z.infer<typeof workSchema>;
export type Collection = z.infer<typeof collectionSchema>;
export type ContentImage = z.infer<typeof imageSchema>;
export type ContentVideo = z.infer<typeof videoSchema>;
export type GalleryEntry = ContentImage | ContentVideo;
export type Category = z.infer<typeof categorySchema>;
export type CategoryId = Category["id"];
export type HomeContent = z.infer<typeof homeSchema>;
export type SiteContent = z.infer<typeof siteSchema>;
export type AboutContent = z.infer<typeof aboutSchema>;
export type LabEntry = z.infer<typeof labSchema>;
