import { AdminCarouselManager } from "@/components/admin-carousel-manager";
import { AdminFocusAudioManager } from "@/components/admin-focus-audio-manager";
import { AdminSettingsForm } from "@/components/admin-settings-form";
import { getAutoNowPlayingFromLastFm } from "@/lib/auto-now-playing";
import { getArticlePreview } from "@/lib/article-preview";
import {
  getAppSettings,
  getCarouselImages,
  getDailyPhrases,
  getFocusAudioTracks,
  getPublicFocusAudioUrl,
  getPublicImageUrl
} from "@/lib/data";
import { getLatestPostFromFeed } from "@/lib/editorial-feed";
import { DEFAULT_HOME_SECTION_ORDER } from "@/lib/sections";

export default async function AdminPage() {
  const [settings, images, focusTracks, dailyPhrases, autoNowPlaying] = await Promise.all([
    getAppSettings(),
    getCarouselImages(),
    getFocusAudioTracks(),
    getDailyPhrases(),
    getAutoNowPlayingFromLastFm()
  ]);
  const feedPost = await getLatestPostFromFeed(settings?.editorial_feed_url ?? null);
  const articleUrl = feedPost?.url ?? settings?.latest_article_url ?? null;
  const fallbackPreview = articleUrl ? await getArticlePreview(articleUrl) : null;
  const resolvedArticlePreview = articleUrl
    ? {
        url: articleUrl,
        title: feedPost?.title ?? fallbackPreview?.title ?? null,
        excerpt: feedPost?.excerpt ?? fallbackPreview?.excerpt ?? null,
        publishedAt: feedPost?.publishedAt ?? null,
        author: feedPost?.author ?? fallbackPreview?.author ?? null
      }
    : null;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(128,102,164,0.22),transparent_34%),linear-gradient(180deg,#161620_0%,#0f1016_58%,#0b0c10_100%)] px-4 pb-12 pt-6 text-textPrimary">
      <main className="mx-auto flex w-full max-w-[1240px] flex-col gap-5">
        <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(27,28,38,0.94),rgba(17,18,24,0.94))] p-6 shadow-[0_28px_100px_rgba(0,0,0,0.4)]">
          <div className="max-w-2xl">
            <p className="text-[11px] uppercase tracking-[0.32em] text-[#d4c0a1]/70">Studio éditorial</p>
            <h1 className="mt-3 font-[family:var(--font-cormorant)] text-4xl leading-none text-white sm:text-5xl">
              Dashboard admin
            </h1>
            <p className="mt-4 text-sm leading-7 text-white/62 sm:text-[15px]">Bienvenue Caroline.</p>
          </div>
        </section>

        <AdminSettingsForm
          initialValues={{
            now_playing_title: settings?.now_playing_title ?? "",
            now_playing_artist: settings?.now_playing_artist ?? "",
            spotify_embed_url: settings?.spotify_embed_url ?? "",
            apple_music_url: "",
            quote_of_day: settings?.quote_of_day ?? "",
            quote_of_day_mode: settings?.quote_of_day_mode ?? "manual",
            quote_of_day_updated_at: settings?.quote_of_day_updated_at ?? null,
            latest_article_url: settings?.latest_article_url ?? "",
            editorial_feed_url: settings?.editorial_feed_url ?? "",
            section_order: settings?.section_order ?? DEFAULT_HOME_SECTION_ORDER
          }}
          initialDailyPhrases={dailyPhrases}
          articlePreview={resolvedArticlePreview}
          currentNowPlaying={{
            title: autoNowPlaying?.title ?? settings?.now_playing_title ?? null,
            artist: autoNowPlaying?.artist ?? settings?.now_playing_artist ?? null
          }}
        />

        <div className="grid gap-5 xl:grid-cols-[1.04fr_0.96fr] xl:items-start">
          <AdminCarouselManager
            initialImages={images.map((image) => ({
              id: image.id,
              storagePath: image.storage_path,
              sortOrder: image.sort_order,
              url: getPublicImageUrl(image.storage_path)
            }))}
          />

          <AdminFocusAudioManager
            initialTracks={focusTracks.map((track) => ({
              id: track.id,
              label: track.label,
              storagePath: track.storage_path,
              sortOrder: track.sort_order,
              url: getPublicFocusAudioUrl(track.storage_path)
            }))}
          />
        </div>

        <form action="/api/admin/logout" method="post" className="self-start">
          <button
            type="submit"
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/64 transition hover:bg-white/10 hover:text-white"
          >
            Se déconnecter
          </button>
        </form>
      </main>
    </div>
  );
}
