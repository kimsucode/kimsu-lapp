"use client";

import { useEffect, useState } from "react";
import { Waveform } from "lucide-react";

export default function MusicWave({ isPlaying }: { isPlaying: boolean }) {
  const [speed, setSpeed] = useState(2.8);

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
        `h-16 w-16 flex items-center justify-center rounded-xl bg-[#1E1E29] border border-lavender/20 ` +
        `${isPlaying ? "animate-music shadow-[0_0_14px_rgba(205,189,255,0.18)]" : "opacity-50"}`
      }
    >
      <Waveform className="h-7 w-7 text-[#CDBDFF]" />
    </div>
  );
}
