"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

export type FocusAudioTrack = {
  id: string;
  label: string;
  src: string;
};

type Props = {
  initialTracks?: FocusAudioTrack[];
};

const DEFAULT_TRACKS: FocusAudioTrack[] = [
  { id: "white-noise", label: "White Noise", src: "/audio/white-noise.mp3" },
  { id: "rain", label: "Rain", src: "/audio/rain.mp3" },
  { id: "meditation", label: "Meditation", src: "/audio/meditation.mp3" }
];

const STORAGE_KEY_TRACK = "focus_audio_track";
const STORAGE_KEY_VOLUME = "focus_audio_volume";

export default function FocusAudio({ initialTracks = [] }: Props) {
  const tracks = useMemo(() => (initialTracks.length ? initialTracks : DEFAULT_TRACKS), [initialTracks]);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string>(tracks[0]?.id ?? "");
  const [volume, setVolume] = useState<number>(0.4);
  const [isPlaying, setIsPlaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedTrack = useMemo(
    () => tracks.find((track) => track.id === selectedTrackId) ?? tracks[0],
    [selectedTrackId, tracks]
  );

  useEffect(() => {
    if (!tracks.some((track) => track.id === selectedTrackId)) {
      setSelectedTrackId(tracks[0]?.id ?? "");
    }
  }, [selectedTrackId, tracks]);

  useEffect(() => {
    const persistedTrack = window.localStorage.getItem(STORAGE_KEY_TRACK);
    const persistedVolume = window.localStorage.getItem(STORAGE_KEY_VOLUME);

    if (persistedTrack && tracks.some((track) => track.id === persistedTrack)) {
      setSelectedTrackId(persistedTrack);
    }

    if (persistedVolume) {
      const parsed = Number.parseFloat(persistedVolume);
      if (!Number.isNaN(parsed)) {
        setVolume(Math.min(1, Math.max(0, parsed)));
      }
    }
  }, [tracks]);

  useEffect(() => {
    if (!selectedTrackId) return;
    window.localStorage.setItem(STORAGE_KEY_TRACK, selectedTrackId);
  }, [selectedTrackId]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY_VOLUME, String(volume));

    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    audioElement.volume = volume;
    const onEnded = () => setIsPlaying(false);
    audioElement.addEventListener("ended", onEnded);

    return () => {
      audioElement.removeEventListener("ended", onEnded);
    };
  }, [selectedTrack?.src, volume]);

  async function togglePlayPause() {
    if (!audioRef.current) return;

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
      setErrorMessage(null);
    } catch {
      setIsPlaying(false);
      setErrorMessage("Audio indisponible. Vérifie les sons dans l'admin Focus.");
    }
  }

  function onTrackChange(trackId: string) {
    setSelectedTrackId(trackId);
    setErrorMessage(null);

    if (!audioRef.current) return;

    const wasPlaying = isPlaying;
    audioRef.current.pause();
    setIsPlaying(false);

    if (wasPlaying) {
      requestAnimationFrame(async () => {
        try {
          await audioRef.current?.play();
          setIsPlaying(true);
        } catch {
          setIsPlaying(false);
          setErrorMessage("Lecture interrompue. Vérifie les fichiers audio.");
        }
      });
    }
  }

  if (!tracks.length || !selectedTrack) {
    return (
      <section className="w-full max-w-[430px] overflow-hidden rounded-[22px] border border-borderSubtle/90 bg-[linear-gradient(180deg,rgba(23,23,31,0.9)_0%,rgba(18,18,26,0.82)_100%)] p-4 shadow-soft backdrop-blur-md">
        <p className="text-sm text-textSecondary">Ajoute des sons depuis l&apos;admin pour activer l&apos;audio Focus.</p>
      </section>
    );
  }

  return (
    <section className="w-full max-w-[430px] overflow-hidden rounded-[22px] border border-borderSubtle/90 bg-[linear-gradient(180deg,rgba(23,23,31,0.9)_0%,rgba(18,18,26,0.82)_100%)] p-4 shadow-soft backdrop-blur-md">
      <audio ref={audioRef} src={selectedTrack.src} preload="none" loop />

      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-textMuted">Soundscape</p>
          <p className="mt-1 text-sm text-textSecondary">Audio optionnel</p>
        </div>
        <button
          type="button"
          onClick={togglePlayPause}
          className="inline-flex items-center gap-1.5 rounded-full border border-lavender/45 bg-lavender/20 px-4 py-1.5 text-xs font-medium text-lavender"
        >
          {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          {isPlaying ? "Pause" : "Play"}
        </button>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        {tracks.map((track) => (
          <button
            key={track.id}
            type="button"
            onClick={() => onTrackChange(track.id)}
            className={selectedTrackId === track.id
              ? "rounded-full border border-lavender/45 bg-lavender/20 px-2 py-1.5 text-xs text-lavender"
              : "rounded-full border border-borderSubtle bg-transparent px-2 py-1.5 text-xs text-textSecondary transition-colors duration-300 ease-calm hover:bg-lavender/10 hover:text-textPrimary"
            }
          >
            {track.label}
          </button>
        ))}
      </div>

      <div className="mt-3 rounded-soft border border-borderSubtle/70 bg-[#13131b]/80 p-3">
        <div className="flex items-center gap-3">
          <label htmlFor="focus-volume" className="m-0 text-xs text-textMuted">
            Volume
          </label>
          <input
            id="focus-volume"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(event) => setVolume(Number.parseFloat(event.target.value))}
            className="h-1.5 flex-1 cursor-pointer rounded-full accent-lavender"
          />
        </div>
      </div>

      {errorMessage ? <p className="mt-2 text-xs text-rose">{errorMessage}</p> : null}
    </section>
  );
}
