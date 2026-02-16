import { AdminCarouselManager } from "@/components/admin-carousel-manager";
import { AdminSettingsForm } from "@/components/admin-settings-form";
import { getAppSettings, getCarouselImages, getPublicImageUrl } from "@/lib/data";
import { normalizeHomeSectionOrder } from "@/lib/sections";

export default async function AdminPage() {
  const [settings, images] = await Promise.all([getAppSettings(), getCarouselImages()]);

  return (
    <main>
      <section className="card">
        <h1 className="section-title" style={{ marginBottom: 6 }}>
          Admin privé
        </h1>
        <p className="muted" style={{ margin: 0 }}>
          Mets à jour le contenu affiché sur la home.
        </p>
      </section>

      <div className="admin-grid">
        <AdminSettingsForm
          initialValues={{
            now_playing_title: settings?.now_playing_title ?? "",
            now_playing_artist: settings?.now_playing_artist ?? "",
            spotify_embed_url: settings?.spotify_embed_url ?? "",
            quote_of_day: settings?.quote_of_day ?? "",
            latest_article_url: settings?.latest_article_url ?? "",
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

      <form action="/api/admin/logout" method="post">
        <button type="submit" className="secondary">
          Se déconnecter
        </button>
      </form>
    </main>
  );
}
