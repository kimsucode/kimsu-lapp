import Link from "next/link";

import { excerpt, formatFrenchDay } from "@/lib/date";
import { getMoments } from "@/lib/data";

export default async function ArchivePage() {
  try {
    const moments = await getMoments();

    return (
      <div className="min-h-screen bg-gradient-to-b from-[#2B2139] via-plum to-[#181320] px-4 pb-10 pt-6 text-textPrimary">
        <main className="mx-auto flex w-full max-w-[460px] flex-col gap-4">
          <header>
            <h1 className="text-xl font-semibold">Archive</h1>
            <p className="mt-1 text-sm text-textSecondary">Tes moments enregistrés, du plus récent au plus ancien.</p>
          </header>

          {moments.length === 0 ? (
            <p className="rounded-soft border border-borderSubtle bg-surface p-4 text-sm text-textSecondary">
              Aucun moment sauvegardé pour l'instant.
            </p>
          ) : (
            <div className="space-y-3">
              {moments.map((moment) => (
                <Link
                  key={moment.id}
                  href={`/archive/${moment.id}`}
                  className="block rounded-soft border border-borderSubtle bg-surface p-4 shadow-soft transition-colors duration-300 ease-calm hover:border-lavender/35"
                >
                  <p className="text-xs tracking-[0.12em] text-textMuted">{formatFrenchDay(moment.day)}</p>
                  <p className="mt-2 text-sm leading-7 text-textPrimary">{excerpt(moment.daily_phrase, 130) || "Moment sans phrase"}</p>
                  <p className="mt-2 text-sm text-textSecondary">
                    {moment.now_playing_title || "Titre inconnu"}
                    {moment.now_playing_artist ? ` · ${moment.now_playing_artist}` : ""}
                  </p>

                  {moment.cover_image_url ? (
                    <img
                      src={moment.cover_image_url}
                      alt="Cover du moment"
                      className="mt-3 h-20 w-full rounded-xl object-cover"
                    />
                  ) : null}
                </Link>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  } catch {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#2B2139] via-plum to-[#181320] px-4 pb-10 pt-6 text-textPrimary">
        <main className="mx-auto w-full max-w-[460px]">
          <p className="rounded-soft border border-borderSubtle bg-surface p-4 text-sm text-textSecondary">
            Impossible de charger l'archive. Vérifie la migration `004_add_moments_and_saved_phrases.sql`.
          </p>
        </main>
      </div>
    );
  }
}
