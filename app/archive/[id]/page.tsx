import Link from "next/link";
import { notFound } from "next/navigation";

import { formatFrenchDay } from "@/lib/date";
import { getMomentById } from "@/lib/data";

type Props = {
  params: {
    id: string;
  };
};

export default async function ArchiveDetailPage({ params }: Props) {
  const moment = await getMomentById(params.id);

  if (!moment) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#2B2139] via-plum to-[#181320] px-4 pb-10 pt-6 text-textPrimary">
      <main className="mx-auto flex w-full max-w-[460px] flex-col gap-4">
        <Link href="/archive" className="text-sm text-textSecondary underline">
          Retour à l'archive
        </Link>

        <section className="rounded-soft border border-borderSubtle bg-surface p-5 shadow-soft">
          <p className="text-xs tracking-[0.12em] text-textMuted">{formatFrenchDay(moment.day)}</p>

          {moment.cover_image_url ? (
            <img
              src={moment.cover_image_url}
              alt="Cover du moment"
              className="mt-4 h-48 w-full rounded-2xl object-cover"
            />
          ) : null}

          <h1 className="mt-4 text-lg font-medium">{moment.now_playing_title || "Moment"}</h1>
          <p className="mt-1 text-sm text-textSecondary">{moment.now_playing_artist || "Artiste inconnu"}</p>

          <blockquote className="mt-5 border-l border-lavender/40 pl-4 font-serif text-[1.1rem] italic leading-8 text-[#EEEAF9]">
            {moment.daily_phrase || "Aucune phrase sauvegardée pour ce moment."}
          </blockquote>

          {moment.latest_article_url ? (
            <a
              href={moment.latest_article_url}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex rounded-full border border-lavender/40 bg-lavender/15 px-4 py-2 text-sm text-lavender"
            >
              Voir l'article lié
            </a>
          ) : null}
        </section>
      </main>
    </div>
  );
}
