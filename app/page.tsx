import { Carousel } from "@/components/home/Carousel";
import { EditorialBlock } from "@/components/home/EditorialBlock";
import { Footer } from "@/components/home/Footer";
import { Header } from "@/components/home/Header";
import { NowPlaying } from "@/components/home/NowPlaying";
import { QuoteActions } from "@/components/home/QuoteActions";
import { QuoteOfTheDay } from "@/components/home/QuoteOfTheDay";
import { getArticlePreview } from "@/lib/article-preview";
import { getAppSettings, getCarouselImages, getPublicImageUrl, isPhraseSaved } from "@/lib/data";
import { getLatestPostFromFeed } from "@/lib/editorial-feed";

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

  const currentPhrase = settings?.quote_of_day?.trim() ?? null;
  const initialPhraseSaved = currentPhrase ? await isPhraseSaved(currentPhrase) : false;

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
        <Header appName="Kimsu Lab" dateLabel={dateLabel} />

        <NowPlaying
          title={settings?.now_playing_title ?? null}
          artist={settings?.now_playing_artist ?? null}
          spotifyEmbedUrl={settings?.spotify_embed_url ?? null}
        />

        <QuoteOfTheDay
          quote={settings?.quote_of_day ?? null}
          actions={<QuoteActions phrase={settings?.quote_of_day ?? null} initialSaved={initialPhraseSaved} />}
        />

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
