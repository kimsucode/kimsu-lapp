type Props = {
  quote: string | null;
};

export function QuoteCard({ quote }: Props) {
  return (
    <section className="card quote-card">
      <div className="quote-title-row" style={{ justifyContent: "flex-end" }}>
        <span className="quote-title-badge">Phrase du jour</span>
      </div>

      <p className="quote-text">
        <span className="quote-mark" aria-hidden="true">
          &ldquo;
        </span>
        {quote || "Aucune phrase pour aujourd'hui."}
      </p>
    </section>
  );
}
