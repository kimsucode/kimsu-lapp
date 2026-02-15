type Props = {
  url: string | null;
};

export function LatestArticleCard({ url }: Props) {
  return (
    <section className="card">
      <h2 className="section-title">Dernier article</h2>
      {url ? (
        <a className="btn" href={url} target="_blank" rel="noreferrer" style={{ display: "inline-block" }}>
          Lire l'article
        </a>
      ) : (
        <p className="muted" style={{ margin: 0 }}>
          URL non renseignée.
        </p>
      )}
    </section>
  );
}
