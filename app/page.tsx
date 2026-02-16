import type { ReactNode } from "react";

import { ImageCarousel } from "@/components/image-carousel";
import { LatestArticleCard } from "@/components/latest-article-card";
import { NowPlayingCard } from "@/components/now-playing-card";
import { QuoteCard } from "@/components/quote-card";
import { getArticlePreview } from "@/lib/article-preview";
import { getAppSettings, getCarouselImages, getPublicImageUrl } from "@/lib/data";
import { getLatestPostFromFeed } from "@/lib/editorial-feed";
import { normalizeHomeSectionOrder } from "@/lib/sections";
import type { HomeSectionKey } from "@/types/content";

function buildFallbackExcerpt(title: string | null): string {
  if (title) {
    return `Nouveau sur le blog: ${title}.`;
  }
  return "Nouveau contenu disponible sur le blog.";
}

export default async function HomePage() {
  const [settings, images] = await Promise.all([getAppSettings(), getCarouselImages()]);

  const imageUrls = images.map((image) => ({
    id: image.id,
    url: getPublicImageUrl(image.storage_path)
  }));

  const feedPost = await getLatestPostFromFeed(settings?.editorial_feed_url ?? null);
  const articleUrl = feedPost?.url ?? settings?.latest_article_url ?? null;

  const articlePreview = feedPost?.title && feedPost?.excerpt
    ? { title: feedPost.title, excerpt: feedPost.excerpt }
    : await getArticlePreview(articleUrl);

  const previewTitle = feedPost?.title ?? articlePreview.title;
  const previewExcerpt = feedPost?.excerpt ?? articlePreview.excerpt ?? buildFallbackExcerpt(previewTitle);

  const sections: Record<HomeSectionKey, ReactNode> = {
    now_playing: (
      <NowPlayingCard
        title={settings?.now_playing_title ?? null}
        artist={settings?.now_playing_artist ?? null}
        spotifyEmbedUrl={settings?.spotify_embed_url ?? null}
      />
    ),
    carousel: <ImageCarousel images={imageUrls} />,
    quote: <QuoteCard quote={settings?.quote_of_day ?? null} />,
    latest_article: (
      <LatestArticleCard
        url={articleUrl}
        title={previewTitle}
        excerpt={previewExcerpt}
        publishedAt={feedPost?.publishedAt ?? null}
        author={feedPost?.author ?? null}
      />
    )
  };

  const orderedSections = normalizeHomeSectionOrder(settings?.section_order);

  return <main>{orderedSections.map((key) => <div key={key}>{sections[key]}</div>)}</main>;
}
