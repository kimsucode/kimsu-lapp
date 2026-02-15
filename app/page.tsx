import { getAppSettings, getCarouselImages, getPublicImageUrl } from "@/lib/data";
import { ImageCarousel } from "@/components/image-carousel";
import { LatestArticleCard } from "@/components/latest-article-card";
import { NowPlayingCard } from "@/components/now-playing-card";
import { QuoteCard } from "@/components/quote-card";

export default async function HomePage() {
  const [settings, images] = await Promise.all([getAppSettings(), getCarouselImages()]);

  const imageUrls = images.map((image) => ({
    id: image.id,
    url: getPublicImageUrl(image.storage_path)
  }));

  return (
    <main>
      <NowPlayingCard
        title={settings?.now_playing_title ?? null}
        artist={settings?.now_playing_artist ?? null}
        spotifyEmbedUrl={settings?.spotify_embed_url ?? null}
      />

      <ImageCarousel images={imageUrls} />

      <QuoteCard quote={settings?.quote_of_day ?? null} />

      <LatestArticleCard url={settings?.latest_article_url ?? null} />
    </main>
  );
}
