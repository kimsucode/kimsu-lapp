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

export function EditorialBlock({ url, title, excerpt, publishedAt, author }: Props) {
  const dateLabel = formatPublishedDate(publishedAt);
  const metaLine = dateLabel && author ? `${dateLabel} · ${author}` : dateLabel || author || null;

  return (
    <section className="animate-fadeCalm rounded-soft border border-borderSubtle bg-surface px-4 py-4 shadow-soft transition-all duration-300 ease-calm" style={{ animationDelay: "200ms" }}>
      <p className="text-[11px] uppercase tracking-[0.15em] text-textMuted">Dernier article</p>

      {url ? (
        <>
          <h2 className="mt-3 text-lg font-medium text-textPrimary">{title || "Nouveau contenu"}</h2>
          {metaLine ? <p className="mt-1 text-sm text-textSecondary">{metaLine}</p> : null}
          <p className="mt-3 text-sm leading-7 text-textSecondary">{excerpt || "Nouveau contenu disponible sur le blog."}</p>

          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center rounded-full border border-lavender/40 bg-lavender/15 px-4 py-2 text-sm font-medium text-lavender transition-colors duration-300 ease-calm hover:bg-lavender/25"
          >
            Lire
          </a>
        </>
      ) : (
        <p className="mt-3 text-sm text-textSecondary">URL non renseignée.</p>
      )}
    </section>
  );
}
