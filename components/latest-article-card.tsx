type Props = {
  url: string | null;
  title: string | null;
  excerpt: string | null;
};

export function LatestArticleCard({ url, title, excerpt }: Props) {
  return (
    <section className="card">
      <h2 className="section-title">Dernier article</h2>

      {url ? (
        <>
          <p style={{ margin: "0 0 8px", fontWeight: 700 }}>{title || "Aperçu du dernier article"}</p>
          <p className="muted" style={{ margin: "0 0 10px", lineHeight: 1.5 }}>
            {excerpt || "Impossible de récupérer un extrait automatiquement pour cette URL."}
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
