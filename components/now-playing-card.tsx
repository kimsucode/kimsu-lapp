import { parseSpotifyUrls } from "@/lib/spotify";

type Props = {
  title: string | null;
  artist: string | null;
  spotifyEmbedUrl: string | null;
};

export function NowPlayingCard({ title, artist, spotifyEmbedUrl }: Props) {
  const spotify = parseSpotifyUrls(spotifyEmbedUrl);

  return (
    <section className="card">
      <h2 className="section-title">Now Playing</h2>
      <p style={{ margin: "0 0 4px", fontWeight: 700 }}>{title || "Titre à définir"}</p>
      <p className="muted" style={{ margin: "0 0 12px" }}>
        {artist || "Artiste à définir"}
      </p>

      {spotify ? (
        <>
          <iframe
            title="Spotify player"
            src={spotify.embedUrl}
            width="100%"
            height="152"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            style={{ border: 0, borderRadius: 12 }}
          />
          <p className="muted" style={{ margin: "8px 0 0" }}>
            Si l&apos;embed est bloque, ouvre directement sur Spotify: {" "}
            <a href={spotify.canonicalUrl} target="_blank" rel="noreferrer" style={{ textDecoration: "underline" }}>
              écouter le morceau
            </a>
          </p>
        </>
      ) : (
        <p className="muted" style={{ margin: 0 }}>
          Ajoute un lien Spotify (track/album/playlist) depuis l&apos;admin.
        </p>
      )}
    </section>
  );
}
