import FocusAudio from "@/components/FocusAudio";
import FocusBreathing from "@/components/FocusBreathing";
import { getFocusAudioTracks, getPublicFocusAudioUrl } from "@/lib/data";

export default async function FocusPage() {
  const tracks = await getFocusAudioTracks();

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#2B233A] via-[#221A2E] to-[#14111F] px-4 pb-28 pt-8 text-textPrimary">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_12%,rgba(205,189,255,0.12),transparent_42%),radial-gradient(circle_at_82%_78%,rgba(244,198,215,0.1),transparent_46%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:100%_30px]" />

      <section className="relative mx-auto flex w-full max-w-[460px] flex-col items-center gap-6">
        <header className="w-full pt-2 text-center">
          <p className="text-[11px] uppercase tracking-[0.24em] text-lavender/80">Mode Focus</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[0.08em] text-textPrimary">Respire</h1>
          <p className="mt-2 text-sm text-textSecondary">Espace calme, sans surcharge visuelle.</p>
        </header>

        <FocusBreathing />
        <FocusAudio
          initialTracks={tracks.map((track) => ({
            id: track.id,
            label: track.label,
            src: getPublicFocusAudioUrl(track.storage_path)
          }))}
        />
      </section>
    </div>
  );
}
