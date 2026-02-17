import { MoodboardClient } from "@/components/moodboard/MoodboardClient";

export default function MoodboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#2B2139] via-plum to-[#181320] px-4 pb-10 pt-6 text-textPrimary">
      <main className="mx-auto flex w-full max-w-[460px] flex-col gap-4">
        <header>
          <h1 className="text-xl font-semibold">Ton moodboard</h1>
          <p className="mt-1 text-sm text-textSecondary">Tous tes likes réunis dans ton moodboard.</p>
        </header>

        <MoodboardClient />
      </main>
    </div>
  );
}
