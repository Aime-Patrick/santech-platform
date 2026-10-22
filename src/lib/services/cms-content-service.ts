import { prisma } from "@/lib/db/prisma";

export const PUBLIC_CMS_CONTENT_TYPES = [
  "company-value",
  "course-category",
  "driving-change-story",
  "driving-change-topic",
  "e-visitors-feature",
  "faq-item",
  "focus-area",
  "home-story-slide",
  "innovation-product",
  "innovation-service",
  "innovation-solution",
  "journey-stage",
  "opportunity",
  "partner-brand",
  "product-milestone",
  "recognition",
  "san-hub-book",
  "san-hub-book-category",
  "site-stat",
  "standard",
  "team-member",
  "tech-pulse-article",
  "technology-category",
  "testimonial",
  "trainee-award",
] as const;

export type PublicCmsContentType = (typeof PUBLIC_CMS_CONTENT_TYPES)[number];

export function isPublicCmsContentType(value: string): value is PublicCmsContentType {
  return (PUBLIC_CMS_CONTENT_TYPES as readonly string[]).includes(value);
}

export async function listPublishedCmsEntries(contentType: PublicCmsContentType, options: { slug?: string; limit?: number } = {}) {
  const limit = Math.min(Math.max(options.limit ?? 100, 1), 100);
  const entries = await prisma.cmsEntry.findMany({
    where: {
      contentType,
      status: "PUBLISHED",
      ...(options.slug ? { slug: options.slug } : {}),
    },
    orderBy: [{ sourceCreatedAt: "asc" }, { title: "asc" }],
    take: limit,
    select: {
      id: true,
      contentType: true,
      sourceId: true,
      sourceDocumentId: true,
      slug: true,
      title: true,
      payload: true,
      publishedAt: true,
      sourceCreatedAt: true,
      sourceUpdatedAt: true,
    },
  });

  return { data: entries, meta: { total: entries.length, limit, contentType } };
}
function publicMedia(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const media = value as { url?: unknown; alternativeText?: unknown };
  return typeof media.url === "string" ? { url: media.url, alternativeText: typeof media.alternativeText === "string" ? media.alternativeText : null } : null;
}

export async function getPublicSiteSettings() {
  const entry = await prisma.cmsEntry.findFirst({
    where: { contentType: "site-setting", status: "PUBLISHED" },
    orderBy: { sourceUpdatedAt: "desc" },
    select: { payload: true },
  });
  if (!entry || !entry.payload || typeof entry.payload !== "object") return null;
  const payload = entry.payload as Record<string, unknown>;
  const seo = payload.seo && typeof payload.seo === "object" ? payload.seo as Record<string, unknown> : null;
  return {
    siteName: typeof payload.siteName === "string" ? payload.siteName : "SAN TECH",
    siteTitle: typeof payload.siteTitle === "string" ? payload.siteTitle : null,
    siteDescription: typeof payload.siteDescription === "string" ? payload.siteDescription : null,
    defaultLanguage: payload.defaultLanguage === "rw" ? "rw" : "en",
    supportedLanguages: Array.isArray(payload.supportedLanguages) ? payload.supportedLanguages.filter((value): value is string => typeof value === "string") : ["en", "rw"],
    calendlyUrl: typeof payload.calendlyUrl === "string" ? payload.calendlyUrl : null,
    logo: publicMedia(payload.logo),
    favicon: publicMedia(payload.favicon),
    homepageVideo: publicMedia(payload.homepageVideo),
    homepageVideoPoster: publicMedia(payload.homepageVideoPoster),
    eVisitorsVideoPoster: publicMedia(payload.eVisitorsVideoPoster),
    companyProfilePdf: publicMedia(payload.companyProfilePdf),
    socialLinks: Array.isArray(payload.socialLinks) ? payload.socialLinks : [],
    seo: seo ? {
      title: typeof seo.title === "string" ? seo.title : null,
      description: typeof seo.description === "string" ? seo.description : null,
      keywords: typeof seo.keywords === "string" ? seo.keywords : null,
      canonicalUrl: typeof seo.canonicalUrl === "string" ? seo.canonicalUrl : null,
      shareImage: publicMedia(seo.shareImage),
      noIndex: seo.noIndex === true,
    } : null,
  };
}

const PUBLIC_CONTACT_FIELDS = ["phone1", "phone2", "whatsapp", "email", "emailAlt", "address", "radioUrl", "radioLabel", "mapsEmbedUrl", "mapsDirectionsUrl"] as const;
const PUBLIC_LEGACY_FIELDS = ["whoWeAreBody", "whoWeAreSecondaryBody", "identityFacts", "missionTitle", "missionTagline", "missionDescription", "visionTitle", "visionTagline", "visionDescription", "profileTitle", "profileDescription", "profileFacts", "impactStats"] as const;

async function getPublishedSingleton(contentType: string, fields: readonly string[]) {
  const entry = await prisma.cmsEntry.findFirst({
    where: { contentType, status: "PUBLISHED" },
    orderBy: { sourceUpdatedAt: "desc" },
    select: { payload: true },
  });
  if (!entry || !entry.payload || typeof entry.payload !== "object") return null;
  const payload = entry.payload as Record<string, unknown>;
  return Object.fromEntries(fields.map((field) => [field, payload[field] ?? null]));
}

export function getPublicContactInfo() {
  return getPublishedSingleton("contact-info", PUBLIC_CONTACT_FIELDS);
}

export function getPublicLegacyContent() {
  return getPublishedSingleton("legacy-page", PUBLIC_LEGACY_FIELDS);
}


export async function getPublicCertificates() {
  const entries = await prisma.cmsEntry.findMany({ where: { contentType: "certificate", status: "PUBLISHED" }, orderBy: { sourceCreatedAt: "asc" }, take: 100, select: { payload: true } });
  return entries.map(({ payload }) => {
    const item = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
    const media = item.image && typeof item.image === "object" ? item.image as Record<string, unknown> : null;
    return { title: typeof item.title === "string" ? item.title : "", issuer: typeof item.issuer === "string" ? item.issuer : "", description: typeof item.description === "string" ? item.description : "", orientation: item.orientation === "landscape" ? "landscape" : "portrait", image: media && typeof media.url === "string" ? { url: media.url } : null, imageAlt: typeof item.imageAlt === "string" ? item.imageAlt : null };
  });
}
