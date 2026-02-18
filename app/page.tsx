import { Carousel } from "@/components/home/Carousel";
import { EditorialBlock } from "@/components/home/EditorialBlock";
import { Footer } from "@/components/home/Footer";
import { Header } from "@/components/home/Header";
import { NowPlaying } from "@/components/home/NowPlaying";
import { QuoteOfTheDayCard } from "@/components/home/QuoteOfTheDayCard";
import { getArticlePreview } from "@/lib/article-preview";
import { getAutoNowPlayingFromLastFm } from "@/lib/auto-now-playing";
import { getAppSettings, getCarouselImages, getPublicImageUrl } from "@/lib/data";
import { getLatestPostFromFeed } from "@/lib/editorial-feed";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function buildFallbackExcerpt(title: string | null): string {
  if (title) {
    return `Nouveau sur le blog: ${title}.`;
  }

  return "Nouveau contenu disponible sur le blog.";
}

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

  const feedPost = await getLatestPostFromFeed(settings?.editorial_feed_url ?? null);
  const articleUrl = feedPost?.url ?? settings?.latest_article_url ?? null;

  const articlePreview = feedPost?.title && feedPost?.excerpt
    ? { title: feedPost.title, excerpt: feedPost.excerpt, author: feedPost.author }
    : await getArticlePreview(articleUrl);

  const previewTitle = feedPost?.title ?? articlePreview.title;
  const previewExcerpt = feedPost?.excerpt ?? articlePreview.excerpt ?? buildFallbackExcerpt(previewTitle);
  const previewAuthor = feedPost?.author ?? articlePreview.author;

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
          spotifyEmbedUrl={autoNowPlaying?.spotifyEmbedUrl ?? settings?.spotify_embed_url ?? null}
        />

        <QuoteOfTheDayCard quote={settings?.quote_of_day ?? null} />

        <Carousel images={imageUrls} />

        <EditorialBlock
          url={articleUrl}
          title={previewTitle}
          excerpt={previewExcerpt}
          publishedAt={feedPost?.publishedAt ?? null}
          author={previewAuthor}
        />

        <Footer />
      </div>
    </div>
  );
}
