"use client";

import { useMemo, useState } from "react";

type ThemeName = "warm" | "editorial" | "minimal-pop";

const themes: Array<{ id: ThemeName; label: string; description: string }> = [
  { id: "warm", label: "Warm", description: "Chaleureux, organique, cosy." },
  { id: "editorial", label: "Editorial", description: "Magazine, chic, contrasté." },
  { id: "minimal-pop", label: "Minimal Pop", description: "Net, coloré, moderne." }
];

export function StylePreviewLab() {
  const [theme, setTheme] = useState<ThemeName>("warm");

  const today = useMemo(
    () =>
      new Intl.DateTimeFormat("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric"
      }).format(new Date()),
    []
  );

  return (
    <main className={`theme-preview theme-${theme}`}>
      <section className="preview-toolbar">
        <h1 className="preview-title">Style Lab</h1>
        <p className="preview-subtitle">Compare les directions visuelles avant de choisir la version finale.</p>
        <div className="preview-tabs">
          {themes.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === theme ? "preview-tab active" : "preview-tab"}
              onClick={() => setTheme(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="preview-description">{themes.find((item) => item.id === theme)?.description}</p>
      </section>

      <section className="preview-card">
        <p className="preview-kicker">Now Playing</p>
        <h2 className="preview-h2">Runaway</h2>
        <p className="preview-muted">Kanye West</p>
      </section>

      <section className="preview-card preview-quote">
        <p className="preview-badge">Phrase du jour</p>
        <p className="preview-quote-text">
          "On a beau se préparer à l'échec, il nous apprend toujours quelque chose de neuf."
        </p>
      </section>

      <section className="preview-card">
        <p className="preview-kicker">Dernier article</p>
        <h2 className="preview-h2">Pourquoi créer malgré le doute</h2>
        <p className="preview-muted">Publié le {today} · par Caroline</p>
        <p className="preview-body">
          Quand le doute s'installe, c'est souvent le signal d'une transition. Cet article partage une méthode simple
          pour garder le cap sans s'épuiser.
        </p>
      </section>
    </main>
  );
}
