"use client";

import { useState } from "react";

type Props = {
  phrase: string | null;
  initialSaved: boolean;
};

export function QuoteActions({ phrase, initialSaved }: Props) {
  const [saved, setSaved] = useState(initialSaved);
  const [status, setStatus] = useState<string | null>(null);
  const [isToggling, setIsToggling] = useState(false);

  async function togglePhrase() {
    if (!phrase?.trim()) {
      setStatus("Aucune phrase à sauvegarder.");
      return;
    }

    setIsToggling(true);

    const response = await fetch("/api/phrases/toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phrase })
    });

    setIsToggling(false);

    if (!response.ok) {
      setStatus("Impossible de mettre à jour la phrase.");
      return;
    }

    const payload = (await response.json()) as { saved: boolean };
    setSaved(payload.saved);
    setStatus(payload.saved ? "Phrase sauvegardée ♡" : "Phrase retirée");
  }

  return (
    <div className="mt-8 flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={togglePhrase}
        disabled={isToggling}
        className={saved
          ? "inline-flex h-10 w-10 items-center justify-center rounded-full border border-lavender/40 bg-lavender/15 text-xl text-lavender transition-colors duration-300 ease-calm"
          : "inline-flex h-10 w-10 items-center justify-center rounded-full border border-borderSubtle bg-[#191922] text-xl text-textSecondary transition-colors duration-300 ease-calm hover:text-lavender"
        }
        aria-label="Sauvegarder la phrase"
      >
        ♡
      </button>

      {status ? <p className="text-sm text-textSecondary">{status}</p> : null}
    </div>
  );
}
