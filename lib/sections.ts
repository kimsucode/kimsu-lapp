import type { HomeSectionKey } from "@/types/content";

export const DEFAULT_HOME_SECTION_ORDER: HomeSectionKey[] = [
  "now_playing",
  "carousel",
  "quote",
  "latest_article"
];

const validSections = new Set<HomeSectionKey>(DEFAULT_HOME_SECTION_ORDER);

export function normalizeHomeSectionOrder(
  input: unknown
): HomeSectionKey[] {
  const order = Array.isArray(input) ? input : [];
  const seen = new Set<HomeSectionKey>();
  const normalized: HomeSectionKey[] = [];

  for (const value of order) {
    if (typeof value !== "string") continue;
    if (!validSections.has(value as HomeSectionKey)) continue;
    const section = value as HomeSectionKey;
    if (seen.has(section)) continue;
    seen.add(section);
    normalized.push(section);
  }

  for (const section of DEFAULT_HOME_SECTION_ORDER) {
    if (!seen.has(section)) {
      normalized.push(section);
    }
  }

  return normalized;
}
