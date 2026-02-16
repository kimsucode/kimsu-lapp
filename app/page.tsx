import type { ReactNode } from "react";

import { ImageCarousel } from "@/components/image-carousel";
import { LatestArticleCard } from "@/components/latest-article-card";
import { NowPlayingCard } from "@/components/now-playing-card";
import { QuoteCard } from "@/components/quote-card";
import { getArticlePreview } from "@/lib/article-preview";
import { getAppSettings, getCarouselImages, getPublicImageUrl } from "@/lib/data";
import { normalizeHomeSectionOrder } from "@/lib/sections";
import type { HomeSectionKey } from "@/types/content";

export default async function HomePage() {
  const [settings, images] = await Promise.all([getAppSettings(), getCarouselImages()]);

  const imageUrls = images.map((image) => ({
    id: image.id,
    url: getPublicImageUrl(image.storage_path)
  }));

  const articlePreview = await getArticlePreview(settings?.latest_article_url ?? null);

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
        url={settings?.latest_article_url ?? null}
        title={articlePreview.title}
        excerpt={articlePreview.excerpt}
      />
    )
  };

  const orderedSections = normalizeHomeSectionOrder(settings?.section_order);

  return <main>{orderedSections.map((key) => <div key={key}>{sections[key]}</div>)}</main>;
}
