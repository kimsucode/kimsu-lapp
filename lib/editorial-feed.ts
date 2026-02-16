import "server-only";

import { truncateSmart } from "@/lib/excerpt";

export type EditorialPost = {
  title: string | null;
  url: string | null;
  excerpt: string | null;
  publishedAt: string | null;
};

function stripTags(input: string): string {
  return input.replace(/<[^>]*>/g, " ");
}

function decodeEntities(input: string): string {
  return input
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

function cleanText(input: string): string {
  return decodeEntities(stripTags(input)).replace(/\s+/g, " ").trim();
}

function getTagContent(xml: string, tagName: string): string | null {
  const pattern = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const match = xml.match(pattern);
  return match?.[1] ? cleanText(match[1]) : null;
}

function getFirstTagContent(xml: string, tagNames: string[]): string | null {
  for (const tagName of tagNames) {
    const value = getTagContent(xml, tagName);
    if (value) return value;
  }
  return null;
}

function getLinkFromAtomEntry(entryXml: string): string | null {
  const links = [...entryXml.matchAll(/<link\b([^>]*)>/gi)];
  for (const link of links) {
    const attrs = link[1] || "";
    const href = attrs.match(/href=["']([^"']+)["']/i)?.[1] ?? null;
    const rel = attrs.match(/rel=["']([^"']+)["']/i)?.[1] ?? "alternate";
    if (href && (!rel || rel.toLowerCase() === "alternate")) {
      return href;
    }
  }
  return null;
}

function extractRssItem(xml: string): EditorialPost | null {
  const itemMatch = xml.match(/<item\b[\s\S]*?<\/item>/i);
  if (!itemMatch?.[0]) return null;
  const item = itemMatch[0];

  const excerpt = getFirstTagContent(item, ["description", "content:encoded", "content"]);

  return {
    title: getTagContent(item, "title"),
    url: getTagContent(item, "link"),
    excerpt: excerpt ? truncateSmart(excerpt, 360) : null,
    publishedAt: getTagContent(item, "pubDate")
  };
}

function extractAtomEntry(xml: string): EditorialPost | null {
  const entryMatch = xml.match(/<entry\b[\s\S]*?<\/entry>/i);
  if (!entryMatch?.[0]) return null;
  const entry = entryMatch[0];

  const excerpt = getFirstTagContent(entry, ["summary", "content"]);

  return {
    title: getTagContent(entry, "title"),
    url: getLinkFromAtomEntry(entry),
    excerpt: excerpt ? truncateSmart(excerpt, 360) : null,
    publishedAt: getTagContent(entry, "published") ?? getTagContent(entry, "updated")
  };
}

export async function getLatestPostFromFeed(feedUrl: string | null): Promise<EditorialPost | null> {
  if (!feedUrl) return null;

  let parsed: URL;
  try {
    parsed = new URL(feedUrl);
  } catch {
    return null;
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return null;
  }

  try {
    const response = await fetch(parsed.toString(), {
      next: { revalidate: 120, tags: ["editorial-feed"] },
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; BlogCompanionBot/1.0)",
        accept: "application/rss+xml, application/atom+xml, application/xml, text/xml"
      }
    });

    if (!response.ok) return null;

    const xml = await response.text();
    if (!xml) return null;

    const rss = extractRssItem(xml);
    if (rss?.url) return rss;

    const atom = extractAtomEntry(xml);
    if (atom?.url) return atom;

    return rss ?? atom;
  } catch {
    return null;
  }
}
