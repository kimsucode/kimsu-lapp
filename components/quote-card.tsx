type Props = {
  quote: string | null;
};

export function QuoteCard({ quote }: Props) {
  return (
    <section className="card quote-card">
      <div className="quote-title-row">
        <h2 className="section-title" style={{ marginBottom: 0 }}>
          Phrase du jour
        </h2>
        <span className="quote-title-badge">Highlight</span>
      </div>

      <p className="quote-text">
        <span className="quote-mark" aria-hidden="true">
          "
        </span>
        {quote || "Aucune phrase pour aujourd'hui."}
      </p>
    </section>
  );
}
