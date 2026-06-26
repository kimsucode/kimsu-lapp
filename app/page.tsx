import { Carousel } from "@/components/home/Carousel";
import { Footer } from "@/components/home/Footer";
import { Header } from "@/components/home/Header";
import { NowPlaying } from "@/components/home/NowPlaying";
import { QuoteOfTheDayCard } from "@/components/home/QuoteOfTheDayCard";
import { getAutoNowPlayingFromLastFm } from "@/lib/auto-now-playing";
import { getAppSettings, getCarouselImages, getPublicImageUrl } from "@/lib/data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const [settings, images, autoNowPlaying] = await Promise.all([
    getAppSettings(),
    getCarouselImages(),
    getAutoNowPlayingFromLastFm()
  ]);

  const imageUrls = images.map((image) => ({
    id: image.id,
    url: getPublicImageUrl(image.storage_path)
  }));

  const dateLabel = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(new Date());

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#2B2139] via-plum to-[#181320] px-4 pb-10 pt-6 text-textPrimary">
      <div className="mx-auto flex w-full max-w-[460px] flex-col gap-7">
        <Header appName="Kimsu L'app" dateLabel={dateLabel} />

        <NowPlaying
          title={autoNowPlaying?.title ?? settings?.now_playing_title ?? null}
          artist={autoNowPlaying?.artist ?? settings?.now_playing_artist ?? null}
          appleMusicUrl={autoNowPlaying?.appleMusicUrl ?? null}
          artworkUrl={autoNowPlaying?.artworkUrl ?? null}
          previewUrl={autoNowPlaying?.previewUrl ?? null}
          spotifyEmbedUrl={autoNowPlaying?.spotifyEmbedUrl ?? settings?.spotify_embed_url ?? null}
        />

        <QuoteOfTheDayCard quote={settings?.quote_of_day ?? null} />

        <Carousel images={imageUrls} />

        <Footer />
      </div>
    </div>
  );
}
