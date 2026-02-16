type Props = {
  url: string | null;
  title: string | null;
  excerpt: string | null;
  publishedAt: string | null;
  author: string | null;
};

function formatPublishedDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

function buildMetaLine(date: string | null, author: string | null): string | null {
  if (date && author) return `Publié le ${date} · par ${author}`;
  if (date) return `Publié le ${date}`;
  if (author) return `Par ${author}`;
  return null;
}

export function LatestArticleCard({ url, title, excerpt, publishedAt, author }: Props) {
  const formattedDate = formatPublishedDate(publishedAt);
  const metaLine = buildMetaLine(formattedDate, author);

  return (
    <section className="card">
      <h2 className="section-title">Dernier article</h2>

      {url ? (
        <>
          <p style={{ margin: "0 0 8px", fontWeight: 700 }}>{title || "Aperçu du dernier article"}</p>
          {metaLine ? (
            <p className="muted" style={{ margin: "0 0 8px", fontSize: "0.9rem" }}>
              {metaLine}
            </p>
          ) : null}
          <p className="muted" style={{ margin: "0 0 10px", lineHeight: 1.5 }}>
            {excerpt || "Nouveau contenu disponible sur le blog."}
          </p>
          <a href={url} target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>
            Ouvrir l'article complet
          </a>
        </>
      ) : (
        <p className="muted" style={{ margin: 0 }}>
          URL non renseignée.
        </p>
      )}
    </section>
  );
}
