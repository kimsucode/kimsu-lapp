type Props = {
  quote: string | null;
};

export function QuoteCard({ quote }: Props) {
  return (
    <section className="card">
      <h2 className="section-title">Phrase du jour</h2>
      <p style={{ margin: 0, lineHeight: 1.5 }}>{quote || "Aucune phrase pour aujourd'hui."}</p>
    </section>
  );
}
