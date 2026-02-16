import "server-only";

type ArticlePreview = {
  title: string | null;
  excerpt: string | null;
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

function firstMatch(html: string, patterns: RegExp[]): string | null {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      const value = cleanText(match[1]);
      if (value) {
        return value;
      }
    }
  }

  return null;
}

export async function getArticlePreview(url: string | null): Promise<ArticlePreview> {
  if (!url) {
    return { title: null, excerpt: null };
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { title: null, excerpt: null };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { title: null, excerpt: null };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(parsed.toString(), {
      signal: controller.signal,
      next: { revalidate: 3600 },
      headers: {
        "user-agent": "Mozilla/5.0 (compatible; BlogCompanionBot/1.0)"
      }
    });

    if (!response.ok) {
      return { title: null, excerpt: null };
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      return { title: null, excerpt: null };
    }

    const html = await response.text();

    const title = firstMatch(html, [
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["'][^>]*>/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["'][^>]*>/i,
      /<title[^>]*>([\s\S]*?)<\/title>/i
    ]);

    const excerpt = firstMatch(html, [
      /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["'][^>]*>/i,
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["'][^>]*>/i,
      /<p[^>]*>([\s\S]*?)<\/p>/i
    ]);

    return {
      title,
      excerpt: excerpt ? excerpt.slice(0, 280) : null
    };
  } catch {
    return { title: null, excerpt: null };
  } finally {
    clearTimeout(timeout);
  }
}
