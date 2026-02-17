"use client";

import { FormEvent, useMemo, useState } from "react";

type FocusAudioItem = {
  id: string;
  label: string;
  url: string;
  storagePath: string;
  sortOrder: number;
};

type Props = {
  initialTracks: FocusAudioItem[];
};

function orderTracks(items: FocusAudioItem[]) {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder);
}

function inputClassName() {
  return "w-full rounded-xl border border-borderSubtle bg-[#14141c] px-3 py-2.5 text-sm text-textPrimary placeholder:text-textMuted focus:border-lavender/45 focus:outline-none";
}

export function AdminFocusAudioManager({ initialTracks }: Props) {
  const [tracks, setTracks] = useState(orderTracks(initialTracks));
  const [message, setMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const canUpload = useMemo(() => tracks.length < 10, [tracks.length]);

  async function onUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const input = form.elements.namedItem("audio") as HTMLInputElement | null;
    const label = ((form.elements.namedItem("label") as HTMLInputElement | null)?.value ?? "").trim();
    const sortOrder = Number((form.elements.namedItem("sortOrder") as HTMLInputElement | null)?.value ?? "0");

    if (!input?.files?.[0]) {
      setMessage("Sélectionne un fichier audio.");
      return;
    }

    if (!canUpload) {
      setMessage("Maximum 10 sons.");
      return;
    }

    const body = new FormData();
    body.append("audio", input.files[0]);
    body.append("label", label);
    body.append("sortOrder", String(sortOrder));

    setIsUploading(true);
    setMessage(null);

    const response = await fetch("/api/admin/focus-audio/upload", {
      method: "POST",
      body
    });

    setIsUploading(false);

    if (!response.ok) {
      setMessage("Upload impossible.");
      return;
    }

    const payload = (await response.json()) as { track: FocusAudioItem };
    setTracks((current) => orderTracks([...current, payload.track]));
    setMessage("Son ajouté.");
    form.reset();
  }

  async function onDelete(id: string) {
    const response = await fetch("/api/admin/focus-audio/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });

    if (!response.ok) {
      setMessage("Suppression impossible.");
      return;
    }

    setTracks((current) => current.filter((track) => track.id !== id));
    setMessage("Son supprimé.");
  }

  return (
    <section className="rounded-soft border border-borderSubtle bg-surface p-4 shadow-soft sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Sons Focus</h2>
          <p className="mt-1 text-sm text-textSecondary">{tracks.length}/10 sons • ordre manuel</p>
        </div>
      </div>

      <form onSubmit={onUpload} className="space-y-3 rounded-2xl border border-borderSubtle/70 bg-[#121219] p-3 sm:p-4">
        <div>
          <label htmlFor="audio" className="mb-1.5 block text-sm text-textSecondary">
            Nouveau son
          </label>
          <input id="audio" name="audio" type="file" accept="audio/*" required className={inputClassName()} />
        </div>

        <div>
          <label htmlFor="label" className="mb-1.5 block text-sm text-textSecondary">
            Label
          </label>
          <input
            id="label"
            name="label"
            className={inputClassName()}
            placeholder="Ex: Pluie douce"
          />
        </div>

        <div>
          <label htmlFor="sortOrder" className="mb-1.5 block text-sm text-textSecondary">
            Position
          </label>
          <input
            id="sortOrder"
            name="sortOrder"
            type="number"
            min={0}
            defaultValue={tracks.length}
            className={inputClassName()}
          />
        </div>

        <button
          type="submit"
          disabled={!canUpload || isUploading}
          className="rounded-full border border-lavender/45 bg-lavender/20 px-5 py-2.5 text-sm font-medium text-lavender transition-colors duration-300 ease-calm hover:bg-lavender/30 disabled:opacity-50"
        >
          {isUploading ? "Upload..." : canUpload ? "Ajouter le son" : "Limite atteinte"}
        </button>
      </form>

      <div className="mt-4 space-y-2">
        {tracks.map((track) => (
          <div
            key={track.id}
            className="flex items-center gap-3 rounded-xl border border-borderSubtle bg-[#171720] p-2"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-lavender/30 bg-lavender/10 text-lavender">
              ♪
            </div>
            <div className="flex-1">
              <p className="text-sm text-textPrimary">{track.label}</p>
              <p className="text-xs text-textMuted">Ordre: {track.sortOrder}</p>
            </div>
            <button
              type="button"
              className="rounded-full border border-borderSubtle px-3 py-1.5 text-xs text-textSecondary transition-colors duration-300 ease-calm hover:text-textPrimary"
              onClick={() => onDelete(track.id)}
            >
              Supprimer
            </button>
          </div>
        ))}

        {tracks.length === 0 ? (
          <p className="rounded-xl border border-borderSubtle bg-[#171720] p-3 text-sm text-textSecondary">Aucun son.</p>
        ) : null}
      </div>

      {message ? <p className="mt-3 text-sm text-textSecondary">{message}</p> : null}
    </section>
  );
}
