/**
 * Credit helpers for magazine subShoots and design projects.
 *
 * Source of truth is the `credits` array, which both document types share via
 * the `credit` object in njoyastudio/schemaTypes/credit.ts. Keep ROLE_LABELS
 * below in sync with the preset role list in that file.
 *
 * The legacy string fields (magPhotographer/magTalent/magStylist/magAssistant/
 * magOthers on subShoots, designProjectType/designProjectLocation on design
 * projects) are kept as a transitional fallback so the live site keeps
 * rendering credits for docs that haven't been manually re-entered yet. Once
 * every doc has a populated `credits` array, the legacy branch below can be
 * deleted.
 */

const ROLE_LABELS: Record<string, string> = {
  photographer: "Photographer",
  stylist: "Stylist",
  talent: "Talent",
  setDesigner: "Set Designer",
  assistant: "Assistant",
  setDesignAssistants: "Set Design Assistants",
  makeupArtist: "Makeup Artist",
  hairStylist: "Hair Stylist",
  creativeDirector: "Creative Director",
  producer: "Producer",
  castDirector: "Cast Director",
  manicurist: "Manicurist",
  model: "Model",
  designer: "Designer",
  njoyaTeam: "Njoya Studios Team",
  renderDesign: "3D Render Design",
  constructionTeam: "Construction Team",
  type: "Type",
  location: "Location",
};

export type Credit = {
  role: string;
  customRole?: string;
  name?: string;
};

export type CreditMetadata = {
  label: string;
  value: string;
};

type LegacySubShoot = {
  magPhotographer?: string;
  magTalent?: string;
  magStylist?: string;
  magAssistant?: string;
  magOthers?: string;
};

type LegacyDesignProject = {
  designProjectType?: string;
  designProjectLocation?: string;
};

type LegacySource = LegacySubShoot & LegacyDesignProject;

type CreditSource = LegacySource & { credits?: Credit[] };

const labelForRole = (credit: Credit): string => {
  if (credit.role === "other") return credit.customRole ?? "Other";

  return ROLE_LABELS[credit.role] ?? credit.role;
};

export const creditsToMetadata = (
  source: CreditSource | undefined | null,
): CreditMetadata[] => {
  if (!source) return [];

  const fromCredits = (source.credits ?? [])
    .filter((credit) => credit?.name)
    .map((credit) => ({
      label: labelForRole(credit),
      value: credit.name as string,
    }));

  if (fromCredits.length > 0) return fromCredits;

  return legacyCreditsToMetadata(source);
};

export const legacyCreditsToMetadata = (
  source: LegacySource | undefined | null,
): CreditMetadata[] => {
  if (!source) return [];

  const entries: Array<CreditMetadata | false | "" | undefined> = [
    source.magPhotographer && {
      label: "Photographer",
      value: source.magPhotographer,
    },
    source.magTalent && { label: "Talent", value: source.magTalent },
    source.magStylist && { label: "Stylist", value: source.magStylist },
    source.magAssistant && { label: "Assistant", value: source.magAssistant },
    source.magOthers && { label: "Others", value: source.magOthers },
    source.designProjectType && {
      label: "Type",
      value: source.designProjectType,
    },
    source.designProjectLocation && {
      label: "Location",
      value: source.designProjectLocation,
    },
  ];

  return entries.filter(Boolean) as CreditMetadata[];
};

export const photographerName = (
  source: CreditSource | undefined | null,
): string => {
  if (!source) return "";

  const fromCredits = source.credits?.find(
    (credit) => credit?.role === "photographer",
  )?.name;

  return fromCredits ?? source.magPhotographer ?? "";
};
