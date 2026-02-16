import { AdminCarouselManager } from "@/components/admin-carousel-manager";
import { AdminSettingsForm } from "@/components/admin-settings-form";
import { getAppSettings, getCarouselImages, getPublicImageUrl } from "@/lib/data";
import { normalizeHomeSectionOrder } from "@/lib/sections";

export default async function AdminPage() {
  const [settings, images] = await Promise.all([getAppSettings(), getCarouselImages()]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#2B2139] via-plum to-[#181320] px-4 pb-12 pt-6 text-textPrimary">
      <main className="mx-auto flex w-full max-w-[980px] flex-col gap-5">
        <section className="rounded-soft border border-borderSubtle bg-surface/95 p-5 shadow-soft">
          <p className="text-xs uppercase tracking-[0.14em] text-textMuted">Dashboard privé</p>
          <h1 className="mt-2 text-2xl font-semibold">Admin</h1>
          <p className="mt-1 text-sm text-textSecondary">
            Mets à jour le contenu de la home, le flux éditorial et la galerie.
          </p>
        </section>

        <div className="grid gap-4 md:grid-cols-[1.2fr_1fr] md:items-start">
          <AdminSettingsForm
            initialValues={{
              now_playing_title: settings?.now_playing_title ?? "",
              now_playing_artist: settings?.now_playing_artist ?? "",
              spotify_embed_url: settings?.spotify_embed_url ?? "",
              quote_of_day: settings?.quote_of_day ?? "",
              latest_article_url: settings?.latest_article_url ?? "",
              editorial_feed_url: settings?.editorial_feed_url ?? "",
              section_order: normalizeHomeSectionOrder(settings?.section_order)
            }}
          />

          <AdminCarouselManager
            initialImages={images.map((image) => ({
              id: image.id,
              storagePath: image.storage_path,
              sortOrder: image.sort_order,
              url: getPublicImageUrl(image.storage_path)
            }))}
          />
        </div>

        <form action="/api/admin/logout" method="post" className="self-start">
          <button
            type="submit"
            className="rounded-full border border-borderSubtle bg-[#1a1a22] px-4 py-2 text-sm text-textSecondary transition-colors duration-300 ease-calm hover:text-textPrimary"
          >
            Se déconnecter
          </button>
        </form>
      </main>
    </div>
  );
}
