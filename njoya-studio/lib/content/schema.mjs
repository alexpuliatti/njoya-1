import { z } from "zod";

export const categoryIdSchema = z.enum([
  "worlds",
  "exhibition",
  "commercials",
  "editorials",
  "motion",
]);
const localImagePath = z
  .string()
  .regex(/^\/media\/images\/[a-zA-Z0-9_-]+\.(?:webp|avif)$/);
const variantSchema = z
  .object({
    src: localImagePath,
    width: z.number().positive(),
    bytes: z.number().nonnegative(),
  })
  .strict();
export const responsiveMediaSchema = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
  format: z.enum(["webp", "avif"]),
  fallback: variantSchema,
  variants: z.array(variantSchema).min(1),
});
export const imageSchema = z
  .object({
    type: z.enum(["image", "synopsis"]),
    src: localImagePath,
    previewSrc: localImagePath,
    alt: z.string().min(1),
    width: z.number().positive(),
    height: z.number().positive(),
    responsive: responsiveMediaSchema.optional(),
    text: z.string().optional(),
    caption: z.string().optional(),
  })
  .strict();
const localVideoPath = z.string().regex(/^\/media\/videos\/[a-zA-Z0-9_-]+\.mp4$/);
const muxVideoSchema = z
  .object({
    type: z.literal("video"),
    playbackId: z.string().min(1),
    alt: z.string().min(1),
  })
  .strict();
export const localVideoSchema = z
  .object({
    type: z.literal("video"),
    src: localVideoPath,
    poster: imageSchema,
    alt: z.string().min(1),
  })
  .strict();
export const videoSchema = z.union([muxVideoSchema, localVideoSchema]);
export const creditSchema = z
  .object({
    role: z.string().min(1),
    customRole: z.string().optional(),
    name: z.string().min(1),
  })
  .strict();
export const workSchema = z
  .object({
    id: z
      .string()
      .min(1)
      .refine((id) => !id.startsWith("drafts."), "Drafts cannot be published"),
    slug: z
      .string()
      .min(1)
      .refine((slug) => !slug.includes("/")),
    title: z.string().min(1),
    client: z.string(),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}(?:-\d{2})?$/)
      .nullable(),
    categories: z.array(categoryIdSchema).min(1),
    kind: z.enum(["edition", "design-project"]),
    cover: imageSchema,
    coverVideoPlaybackId: z.string().optional(),
    previewVideoSrc: localVideoPath.optional(),
    gallery: z.array(z.union([imageSchema, videoSchema])),
    credits: z.array(creditSchema),
    tags: z.array(z.string()),
    legacyUrls: z.array(z.string().startsWith("/")),
  })
  .strict();
export const collectionSchema = z
  .object({
    id: z.string().min(1),
    slug: z.string().min(1),
    title: z.string().min(1),
    cover: imageSchema.nullable(),
    workIds: z.array(z.string()),
    isMultiEdition: z.boolean(),
    coverVideoPlaybackId: z.string().optional(),
  })
  .strict();
export const categorySchema = z
  .object({
    id: categoryIdSchema,
    title: z.string().min(1),
    description: z.string(),
    coverWorkId: z.string().min(1),
  })
  .strict();
export const homeSchema = z
  .object({
    featured: z
      .array(
        z
          .object({
            title: z.string().min(1),
            workId: z.string().nullable(),
          })
          .strict(),
      )
      .length(4),
  })
  .strict();
export const siteSchema = z
  .object({
    name: z.string().min(1),
    headline: z.string().min(1),
    statement: z.string().min(1),
    instagram: z.string().url(),
    videoPlaybackEnabled: z.boolean().default(false),
    contacts: z.array(
      z
        .object({
          label: z.string(),
          emails: z.array(z.string().email()).min(1),
        })
        .strict(),
    ),
  })
  .strict();
export const aboutSchema = z
  .object({
    biography: z.string().min(1),
    portrait: imageSchema.nullable(),
    team: z.array(
      z
        .object({
          name: z.string().min(1),
          position: z.string(),
          description: z.string(),
          email: z.string().email(),
          image: imageSchema.nullable(),
        })
        .strict(),
    ),
  })
  .strict();
export const labSchema = z
  .object({
    id: z.string().min(1),
    slug: z.string().min(1),
    title: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    summary: z.string(),
    paragraphs: z.array(z.string()),
    project: z
      .object({
        client: z.string().min(1),
        title: z.string().min(1),
        brief: z.string().min(1),
        sketches: z.array(imageSchema).optional(),
        making: z.array(imageSchema).optional(),
        result: z.array(imageSchema).optional(),
      })
      .strict()
      .optional(),
    gallery: z.array(imageSchema),
    published: z.boolean(),
  })
  .strict();
