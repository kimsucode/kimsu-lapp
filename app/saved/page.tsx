import { SavedPhraseList } from "@/components/saved/SavedPhraseList";
import { getSavedPhrases } from "@/lib/data";

export default async function SavedPage() {
  try {
    const phrases = await getSavedPhrases();

    return (
      <div className="min-h-screen bg-gradient-to-b from-[#2B2139] via-plum to-[#181320] px-4 pb-10 pt-6 text-textPrimary">
        <main className="mx-auto flex w-full max-w-[460px] flex-col gap-4">
          <header>
            <h1 className="text-xl font-semibold">Saved</h1>
            <p className="mt-1 text-sm text-textSecondary">Tes phrases favorites enregistrées.</p>
          </header>

          <SavedPhraseList initialPhrases={phrases} />
        </main>
      </div>
    );
  } catch {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#2B2139] via-plum to-[#181320] px-4 pb-10 pt-6 text-textPrimary">
        <main className="mx-auto w-full max-w-[460px]">
          <p className="rounded-soft border border-borderSubtle bg-surface p-4 text-sm text-textSecondary">
            Impossible de charger les phrases sauvegardées. Vérifie la migration `004_add_moments_and_saved_phrases.sql`.
          </p>
        </main>
      </div>
    );
  }
}
