"use client";

import { useState } from "react";

import type { SavedPhrase } from "@/types/content";

type Props = {
  initialPhrases: SavedPhrase[];
};

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(date);
}

export function SavedPhraseList({ initialPhrases }: Props) {
  const [phrases, setPhrases] = useState(initialPhrases);
  const [pendingPhrase, setPendingPhrase] = useState<string | null>(null);

  async function removePhrase(phrase: string) {
    setPendingPhrase(phrase);

    const response = await fetch("/api/phrases/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phrase })
    });

    setPendingPhrase(null);

    if (!response.ok) {
      return;
    }

    setPhrases((current) => current.filter((item) => item.phrase !== phrase));
  }

  if (!phrases.length) {
    return <p className="text-sm text-textSecondary">Aucune phrase sauvegardée pour le moment.</p>;
  }

  return (
    <div className="space-y-3">
      {phrases.map((item) => (
        <article key={item.id} className="rounded-soft border border-borderSubtle bg-surface p-4 shadow-soft">
          <p className="text-sm leading-7 text-textPrimary">{item.phrase}</p>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-textMuted">Sauvegardée le {formatDate(item.created_at)}</p>
            <button
              type="button"
              onClick={() => removePhrase(item.phrase)}
              disabled={pendingPhrase === item.phrase}
              className="rounded-full border border-borderSubtle px-3 py-1.5 text-xs text-textSecondary transition-colors duration-300 ease-calm hover:text-textPrimary"
            >
              {pendingPhrase === item.phrase ? "..." : "Retirer"}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
