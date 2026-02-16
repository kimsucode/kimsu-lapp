type Props = {
  title: string | null;
  artist: string | null;
  spotifyEmbedUrl: string | null;
};

export function NowPlaying({ title, artist, spotifyEmbedUrl }: Props) {
  return (
    <section className="animate-fadeCalm rounded-soft border border-borderSubtle bg-surface px-4 py-4 shadow-soft transition-all duration-300 ease-calm" style={{ animationDelay: "40ms" }}>
      <p className="text-[11px] uppercase tracking-[0.15em] text-textMuted">Now playing</p>

      <div className="mt-3 flex items-center gap-3">
        <div className="h-12 w-12 shrink-0 rounded-xl border border-lavender/30 bg-gradient-to-br from-lavender/30 via-rose/20 to-peach/20" />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-textPrimary">{title || "Titre à définir"}</p>
          <p className="truncate text-sm text-textSecondary">{artist || "Artiste à définir"}</p>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-lavender/80 animate-pulseSoft" />
          <span className="h-2 w-2 rounded-full bg-rose/70 animate-pulseSoft" style={{ animationDelay: "250ms" }} />
          <span className="h-2 w-2 rounded-full bg-mint/70 animate-pulseSoft" style={{ animationDelay: "500ms" }} />
        </div>
      </div>

      {spotifyEmbedUrl ? (
        <div className="mt-4 overflow-hidden rounded-2xl border border-borderSubtle/70">
          <iframe
            title="Spotify player"
            src={spotifyEmbedUrl}
            width="100%"
            height="152"
            loading="lazy"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            className="block border-0"
          />
        </div>
      ) : null}
    </section>
  );
}
