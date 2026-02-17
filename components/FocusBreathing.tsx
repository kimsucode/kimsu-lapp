"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, Settings2 } from "lucide-react";

type BreathPattern = "simple" | "calm" | "box";
type BreathTone = "inhale" | "hold" | "exhale";

type LastSession = {
  seconds: number;
  completedAt: string;
};

const LAST_SESSION_KEY = "focus_last_session";

const PRESETS = [
  { label: "1 min", seconds: 60 },
  { label: "3 min", seconds: 180 },
  { label: "5 min", seconds: 300 }
] as const;

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function formatDurationLabel(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (seconds === 0) {
    return `${minutes} min`;
  }

  return `${minutes} min ${seconds}s`;
}

function formatSessionMoment(isoDate: string): string {
  const completedDate = new Date(isoDate);
  if (Number.isNaN(completedDate.getTime())) return "recentement";

  const now = new Date();
  const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfCompleted = new Date(
    completedDate.getFullYear(),
    completedDate.getMonth(),
    completedDate.getDate()
  );

  const diffDays = Math.round((startOfNow.getTime() - startOfCompleted.getTime()) / 86400000);

  if (diffDays <= 0) return "aujourd'hui";
  if (diffDays === 1) return "hier";

  return `le ${new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(completedDate)}`;
}

function getBreathState(pattern: BreathPattern, elapsedSeconds: number): { label: string; tone: BreathTone } {
  if (pattern === "calm") {
    const point = elapsedSeconds % 14;
    if (point < 4) return { label: "Inspire", tone: "inhale" };
    if (point < 6) return { label: "Retiens", tone: "hold" };
    if (point < 12) return { label: "Expire", tone: "exhale" };
    return { label: "Retiens", tone: "hold" };
  }

  if (pattern === "box") {
    const point = elapsedSeconds % 16;
    if (point < 4) return { label: "Inspire", tone: "inhale" };
    if (point < 8) return { label: "Retiens", tone: "hold" };
    if (point < 12) return { label: "Expire", tone: "exhale" };
    return { label: "Retiens", tone: "hold" };
  }

  const point = elapsedSeconds % 8;
  if (point < 3) return { label: "Inspire", tone: "inhale" };
  if (point < 5) return { label: "Retiens", tone: "hold" };
  return { label: "Expire", tone: "exhale" };
}

function getGlowClass(tone: BreathTone, reducedMotion: boolean): string {
  if (reducedMotion) {
    return "border-lavender/35 bg-lavender/10 shadow-[0_0_28px_rgba(205,189,255,0.16)]";
  }

  if (tone === "inhale") {
    return "border-lavender/50 bg-lavender/16 shadow-[0_0_60px_rgba(205,189,255,0.34)]";
  }

  if (tone === "hold") {
    return "border-lavender/42 bg-lavender/12 shadow-[0_0_46px_rgba(205,189,255,0.26)]";
  }

  return "border-lavender/30 bg-lavender/8 shadow-[0_0_28px_rgba(205,189,255,0.18)]";
}

function triggerHaptic(tone: BreathTone): void {
  if (typeof window === "undefined") return;
  if (document.hidden) return;
  if (!("vibrate" in navigator)) return;

  const durations: Record<BreathTone, number> = {
    inhale: 14,
    hold: 9,
    exhale: 18
  };

  navigator.vibrate(durations[tone]);
}

export default function FocusBreathing() {
  const [pattern, setPattern] = useState<BreathPattern>("simple");
  const [presetSeconds, setPresetSeconds] = useState<number>(180);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(180);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [displayLabel, setDisplayLabel] = useState("Inspire");
  const [labelVisible, setLabelVisible] = useState(true);
  const [lastSession, setLastSession] = useState<LastSession | null>(null);

  const lastToneRef = useRef<BreathTone | null>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(media.matches);

    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const raw = window.localStorage.getItem(LAST_SESSION_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as LastSession;
      if (typeof parsed.seconds === "number" && typeof parsed.completedAt === "string") {
        setLastSession(parsed);
      }
    } catch {
      // ignore invalid stored payload
    }
  }, []);

  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setRemainingSeconds((current) => {
        if (current <= 1) {
          clearInterval(timer);
          setIsRunning(false);
          setIsComplete(true);

          const completed: LastSession = {
            seconds: presetSeconds,
            completedAt: new Date().toISOString()
          };

          setLastSession(completed);
          window.localStorage.setItem(LAST_SESSION_KEY, JSON.stringify(completed));
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, presetSeconds]);

  const elapsed = Math.max(0, presetSeconds - remainingSeconds);
  const breathState = useMemo(() => getBreathState(pattern, elapsed), [pattern, elapsed]);
  const glowClass = useMemo(() => getGlowClass(breathState.tone, reducedMotion), [breathState.tone, reducedMotion]);

  useEffect(() => {
    if (!isRunning) {
      lastToneRef.current = null;
      return;
    }

    if (lastToneRef.current === breathState.tone) return;
    lastToneRef.current = breathState.tone;
    triggerHaptic(breathState.tone);
  }, [breathState.tone, isRunning]);

  useEffect(() => {
    if (displayLabel === breathState.label) return;

    if (reducedMotion) {
      setDisplayLabel(breathState.label);
      setLabelVisible(true);
      return;
    }

    setLabelVisible(false);
    const timer = window.setTimeout(() => {
      setDisplayLabel(breathState.label);
      setLabelVisible(true);
    }, 180);

    return () => window.clearTimeout(timer);
  }, [breathState.label, displayLabel, reducedMotion]);

  const animationClass = reducedMotion || !isRunning
    ? ""
    : pattern === "simple"
      ? "animate-breatheSimple"
      : pattern === "calm"
        ? "animate-breatheCalm"
        : "animate-breatheBox";

  function onToggleStartPause() {
    if (!isRunning && remainingSeconds === 0) {
      setRemainingSeconds(presetSeconds);
      setIsComplete(false);
    }

    setIsRunning((current) => !current);
  }

  function onPresetChange(seconds: number) {
    setPresetSeconds(seconds);
    setRemainingSeconds(seconds);
    setIsRunning(false);
    setIsComplete(false);
  }

  return (
    <section className="relative w-full max-w-[430px] overflow-hidden rounded-[22px] border border-borderSubtle/90 bg-[linear-gradient(180deg,rgba(23,23,31,0.92)_0%,rgba(18,18,26,0.84)_100%)] p-4 shadow-soft backdrop-blur-md">
      <div className="pointer-events-none absolute -left-12 top-4 h-32 w-32 rounded-full bg-lavender/10 blur-3xl" />

      <div className="relative flex min-h-[54vh] flex-col items-center justify-center">
        <div className="relative flex flex-col items-center">
          <div className="pointer-events-none absolute h-56 w-56 rounded-full bg-lavender/10 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute h-44 w-44 rounded-full border border-lavender/20" aria-hidden="true" />

          <div
            className={`relative flex h-44 w-44 items-center justify-center rounded-full transition-all duration-700 ease-calm ${animationClass} ${glowClass}`}
          >
            <div className="text-center">
              <p
                className={`text-base font-medium tracking-[0.12em] text-textPrimary transition-all duration-500 ease-calm ${
                  labelVisible ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0"
                }`}
              >
                {displayLabel}
              </p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-textMuted">{formatTime(remainingSeconds)}</p>
            </div>
          </div>

          <div className="mt-5 rounded-full border border-lavender/30 bg-lavender/10 px-4 py-1.5">
            <p className="text-xs tracking-[0.16em] text-lavender">Suis le rythme du cercle</p>
          </div>

          {lastSession ? (
            <p className="mt-2 text-xs text-textSecondary">
              Derniere session: {formatDurationLabel(lastSession.seconds)} {formatSessionMoment(lastSession.completedAt)}
            </p>
          ) : null}

          {reducedMotion ? <p className="mt-2 text-xs text-textMuted">Mode mouvement réduit activé.</p> : null}
          {isComplete ? <p className="mt-2 text-sm text-lavender">Session terminée. Respire encore un peu.</p> : null}
        </div>

        <div className="mt-10 w-full rounded-soft border border-borderSubtle/80 bg-[#14141d]/80 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-textMuted">Session</p>
            <button
              type="button"
              aria-label="Parametres respiration"
              onClick={() => setShowSettings((current) => !current)}
              className="rounded-full border border-borderSubtle bg-[#17171F]/70 p-2 text-textSecondary transition-colors duration-300 ease-calm hover:border-lavender/45 hover:bg-lavender/10 hover:text-lavender"
            >
              <Settings2 className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {PRESETS.map((preset) => {
              const active = presetSeconds === preset.seconds;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => onPresetChange(preset.seconds)}
                  className={active
                    ? "rounded-full border border-lavender/45 bg-lavender/20 px-3 py-1.5 text-xs text-lavender"
                    : "rounded-full border border-borderSubtle bg-transparent px-3 py-1.5 text-xs text-textSecondary transition-colors duration-300 ease-calm hover:bg-lavender/10 hover:text-textPrimary"
                  }
                >
                  {preset.label}
                </button>
              );
            })}

            <button
              type="button"
              onClick={onToggleStartPause}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-lavender/45 bg-lavender/20 px-4 py-1.5 text-xs font-medium text-lavender"
            >
              {isRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {isRunning ? "Pause" : "Start"}
            </button>
          </div>

          {showSettings ? (
            <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl border border-borderSubtle/80 bg-[#12121a] p-2">
              <button
                type="button"
                onClick={() => setPattern("simple")}
                className={pattern === "simple"
                  ? "rounded-xl border border-lavender/45 bg-lavender/20 px-2 py-2 text-xs text-lavender"
                  : "rounded-xl border border-transparent bg-transparent px-2 py-2 text-xs text-textSecondary transition-colors duration-300 ease-calm hover:bg-lavender/10 hover:text-textPrimary"
                }
              >
                Simple
              </button>
              <button
                type="button"
                onClick={() => setPattern("calm")}
                className={pattern === "calm"
                  ? "rounded-xl border border-lavender/45 bg-lavender/20 px-2 py-2 text-xs text-lavender"
                  : "rounded-xl border border-transparent bg-transparent px-2 py-2 text-xs text-textSecondary transition-colors duration-300 ease-calm hover:bg-lavender/10 hover:text-textPrimary"
                }
              >
                Calm 4-2-6-2
              </button>
              <button
                type="button"
                onClick={() => setPattern("box")}
                className={pattern === "box"
                  ? "rounded-xl border border-lavender/45 bg-lavender/20 px-2 py-2 text-xs text-lavender"
                  : "rounded-xl border border-transparent bg-transparent px-2 py-2 text-xs text-textSecondary transition-colors duration-300 ease-calm hover:bg-lavender/10 hover:text-textPrimary"
                }
              >
                Box 4-4-4-4
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
