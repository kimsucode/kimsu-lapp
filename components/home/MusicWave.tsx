"use client";

import { useEffect, useMemo, useState } from "react";
import * as LucideIcons from "lucide-react";

type IconProps = {
  className?: string;
};

type IconComponent = React.ComponentType<IconProps>;

function FallbackWaveIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}>
      <path d="M3 12h2" />
      <path d="M7 9v6" />
      <path d="M11 6v12" />
      <path d="M15 8v8" />
      <path d="M19 10v4" />
      <path d="M21 12h-0.2" />
    </svg>
  );
}

export default function MusicWave({ isPlaying }: { isPlaying: boolean }) {
  const [speed, setSpeed] = useState(2.8);

  const WaveIcon = useMemo(() => {
    const iconSet = LucideIcons as unknown as Record<string, IconComponent>;
    const candidate = iconSet.Waveform || iconSet.AudioWaveform || iconSet.AudioLines;

    return candidate ?? FallbackWaveIcon;
  }, []);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      const newSpeed = 2.4 + Math.random() * 1.2;
      setSpeed(newSpeed);
    }, 4000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  return (
    <div
      style={{ animationDuration: `${speed}s` }}
      className={
        `h-16 w-16 flex items-center justify-center rounded-xl border border-lavender/20 bg-[#1E1E29] ` +
        `${isPlaying ? "animate-music shadow-[0_0_14px_rgba(205,189,255,0.18)]" : "opacity-50"}`
      }
    >
      <WaveIcon className="h-7 w-7 text-[#CDBDFF]" />
    </div>
  );
}
