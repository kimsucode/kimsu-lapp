"use client";

import { Heart, Image as ImageIcon, Loader2, Share2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { getOrCreateFingerprint } from "@/lib/client/fingerprint";
import { STORY_CARD_LAYOUT } from "@/lib/client/story-card-layout";

type Props = {
  quote: string | null;
};

type LikesPayload = {
  count: number;
  likedByMe: boolean;
};

const STORY_WIDTH = STORY_CARD_LAYOUT.canvas.width;
const STORY_HEIGHT = STORY_CARD_LAYOUT.canvas.height;

function formatLikes(count: number): string {
  if (count <= 1) {
    return `Aimée par ${count} personne`;
  }

  return `Aimée par ${count} personnes`;
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
      continue;
    }

    if (current) {
      lines.push(current);
    }
    current = word;
  }

  if (current) {
    lines.push(current);
  }

  return lines.slice(0, 10);
}

function canShareFiles(file: File): boolean {
  if (typeof navigator === "undefined") return false;
  if (typeof navigator.share !== "function") return false;
  if (typeof navigator.canShare !== "function") return false;

  return navigator.canShare({ files: [file] });
}

async function logShareEvent(quote: string, channel: "share-sheet" | "story-image" | "copy-link"): Promise<void> {
  await fetch("/api/quote/share-event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quote, channel })
  }).catch(() => undefined);
}

async function buildStoryImage(quote: string, signature: string): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = STORY_WIDTH;
  canvas.height = STORY_HEIGHT;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas indisponible");
  }

  const gradient = ctx.createLinearGradient(0, 0, 0, STORY_HEIGHT);
  gradient.addColorStop(0, STORY_CARD_LAYOUT.background.top);
  gradient.addColorStop(0.55, STORY_CARD_LAYOUT.background.middle);
  gradient.addColorStop(1, STORY_CARD_LAYOUT.background.bottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);

  const halo = ctx.createRadialGradient(
    STORY_WIDTH * STORY_CARD_LAYOUT.halo.centerXRatio,
    STORY_HEIGHT * STORY_CARD_LAYOUT.halo.centerYRatio,
    STORY_CARD_LAYOUT.halo.innerRadius,
    STORY_WIDTH * STORY_CARD_LAYOUT.halo.centerXRatio,
    STORY_HEIGHT * STORY_CARD_LAYOUT.halo.centerYRatio,
    STORY_CARD_LAYOUT.halo.outerRadius
  );
  halo.addColorStop(0, STORY_CARD_LAYOUT.halo.innerColor);
  halo.addColorStop(1, STORY_CARD_LAYOUT.halo.outerColor);
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);

  ctx.font = STORY_CARD_LAYOUT.badge.font;
  ctx.textAlign = "center";

  const badgeText = STORY_CARD_LAYOUT.badge.text;
  const badgeTextWidth = ctx.measureText(badgeText).width;
  const badgePaddingX = STORY_CARD_LAYOUT.badge.paddingX;
  const badgeHeight = STORY_CARD_LAYOUT.badge.height;
  const badgeWidth = badgeTextWidth + badgePaddingX * 2;
  const badgeX = STORY_WIDTH / 2 - badgeWidth / 2;
  const badgeY = STORY_CARD_LAYOUT.badge.y;
  const badgeRadius = STORY_CARD_LAYOUT.badge.radius;

  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, badgeRadius);
  ctx.fillStyle = STORY_CARD_LAYOUT.badge.fillColor;
  ctx.fill();
  ctx.strokeStyle = STORY_CARD_LAYOUT.badge.borderColor;
  ctx.lineWidth = STORY_CARD_LAYOUT.badge.borderWidth;
  ctx.stroke();

  ctx.fillStyle = STORY_CARD_LAYOUT.badge.textColor;
  ctx.fillText(badgeText, STORY_WIDTH / 2, STORY_CARD_LAYOUT.badge.textY);

  ctx.fillStyle = STORY_CARD_LAYOUT.quote.color;
  ctx.font = STORY_CARD_LAYOUT.quote.font;

  const lines = wrapLines(ctx, quote, STORY_WIDTH - STORY_CARD_LAYOUT.quote.maxWidthPadding);
  const lineHeight = STORY_CARD_LAYOUT.quote.lineHeight;
  const quoteBlockHeight = lines.length * lineHeight;
  const startY = STORY_HEIGHT * STORY_CARD_LAYOUT.quote.centerYRatio - quoteBlockHeight / 2;

  lines.forEach((line, index) => {
    ctx.fillText(line, STORY_WIDTH / 2, startY + index * lineHeight);
  });

  ctx.fillStyle = STORY_CARD_LAYOUT.signature.color;
  ctx.font = STORY_CARD_LAYOUT.signature.font;
  ctx.fillText(signature, STORY_WIDTH / 2, STORY_HEIGHT - STORY_CARD_LAYOUT.signature.yOffsetFromBottom);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((result) => resolve(result), "image/png"));
  if (!blob) {
    throw new Error("Impossible de générer l'image");
  }

  return blob;
}

export function QuoteOfTheDayCard({ quote }: Props) {
  const content = quote?.trim() || "Il y a des jours qui nous apprennent doucement à respirer plus lentement.";

  const [fingerprint, setFingerprint] = useState("");
  const [likesCount, setLikesCount] = useState(0);
  const [likedByMe, setLikedByMe] = useState(false);
  const [loadingLikes, setLoadingLikes] = useState(true);
  const [isTogglingLike, setIsTogglingLike] = useState(false);
  const [likePop, setLikePop] = useState(false);
  const [firstLikeGlow, setFirstLikeGlow] = useState(false);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.href;
  }, []);

  useEffect(() => {
    setFingerprint(getOrCreateFingerprint());
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadLikes() {
      setLoadingLikes(true);
      const response = await fetch(`/api/quote/likes?quote=${encodeURIComponent(content)}`, {
        headers: fingerprint ? { "x-fingerprint": fingerprint } : undefined
      }).catch(() => null);

      if (!response || !response.ok) {
        if (!cancelled) {
          setLoadingLikes(false);
        }
        return;
      }

      const payload = (await response.json()) as LikesPayload;
      if (!cancelled) {
        setLikesCount(payload.count);
        setLikedByMe(payload.likedByMe);
        setLoadingLikes(false);
      }
    }

    void loadLikes();

    return () => {
      cancelled = true;
    };
  }, [content, fingerprint]);

  useEffect(() => {
    if (!likePop) return;
    const timer = window.setTimeout(() => setLikePop(false), 220);
    return () => window.clearTimeout(timer);
  }, [likePop]);

  useEffect(() => {
    if (!firstLikeGlow) return;
    const timer = window.setTimeout(() => setFirstLikeGlow(false), 260);
    return () => window.clearTimeout(timer);
  }, [firstLikeGlow]);

  async function onToggleLike() {
    if (!fingerprint || isTogglingLike || loadingLikes) return;

    setStatus(null);
    setIsTogglingLike(true);

    const prevLiked = likedByMe;
    const prevCount = likesCount;
    const nextLiked = !prevLiked;
    const nextCount = Math.max(0, prevCount + (nextLiked ? 1 : -1));

    setLikedByMe(nextLiked);
    setLikesCount(nextCount);
    setLikePop(true);

    if (nextLiked && prevCount === 0) {
      setFirstLikeGlow(true);
    }

    const response = await fetch("/api/quote/likes/toggle", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-fingerprint": fingerprint
      },
      body: JSON.stringify({ quote: content })
    }).catch(() => null);

    if (!response || !response.ok) {
      setLikedByMe(prevLiked);
      setLikesCount(prevCount);
      setStatus("Impossible de mettre à jour le like.");
      setIsTogglingLike(false);
      return;
    }

    const payload = (await response.json()) as LikesPayload;
    setLikedByMe(payload.likedByMe);
    setLikesCount(payload.count);
    setIsTogglingLike(false);
  }

  async function onShare() {
    setStatus(null);

    const payload = {
      title: "Phrase du jour",
      text: content,
      url: shareUrl
    };

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share(payload);
        await logShareEvent(content, "share-sheet");
        return;
      } catch {
        // Fallback copy-link
      }
    }

    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(`${content}\n${shareUrl}`);
      setStatus("Lien copié. Tu peux le partager ou créer une story.");
      await logShareEvent(content, "copy-link");
      return;
    }

    setStatus("Partage indisponible sur cet appareil.");
  }

  async function onStory() {
    if (isGeneratingStory) return;

    setIsGeneratingStory(true);
    setStatus(null);

    try {
      const signature = "Kimsu L'app";
      const imageBlob = await buildStoryImage(content, signature);
      setStatus("Carte prête ✨");

      const file = new File([imageBlob], "phrase-du-jour-story.png", { type: "image/png" });

      if (canShareFiles(file)) {
        await navigator.share({
          title: "Phrase du jour",
          text: content,
          files: [file]
        });
        await logShareEvent(content, "story-image");
        return;
      }

      const objectUrl = URL.createObjectURL(imageBlob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = "phrase-du-jour-story.png";
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);

      setStatus("Carte prête ✨ Image téléchargée pour story.");
      await logShareEvent(content, "story-image");
    } catch {
      setStatus("Impossible de générer la story pour le moment.");
    } finally {
      setIsGeneratingStory(false);
    }
  }

  return (
    <section
      className="animate-fadeCalm relative overflow-hidden rounded-[22px] border border-lavender/20 bg-[radial-gradient(circle_at_50%_30%,rgba(232,225,255,0.12)_0%,rgba(205,189,255,0.08)_30%,rgba(205,189,255,0.02)_56%,transparent_74%),radial-gradient(circle_at_48%_34%,rgba(205,189,255,0.15)_0%,transparent_62%),linear-gradient(180deg,#1A1724_0%,#17171F_100%)] px-5 py-8 shadow-quote transition-all duration-300 ease-calm"
      style={{ animationDelay: "90ms" }}
    >
      <div
        className={`pointer-events-none absolute inset-0 rounded-[22px] bg-[radial-gradient(circle_at_50%_36%,rgba(205,189,255,0.2)_0%,rgba(205,189,255,0.04)_38%,transparent_72%)] transition-opacity duration-300 ${firstLikeGlow ? "opacity-100" : "opacity-0"}`}
      />

      <div className="relative flex justify-center"><span className="inline-flex rounded-full border border-lavender/35 bg-lavender/12 px-3 py-1 text-[11px] tracking-[0.08em] text-lavender">Phrase du jour</span></div>

      <blockquote className="relative mx-auto mt-6 max-w-[32ch] text-center text-[1.34rem] italic leading-[1.6] tracking-[0.01em] [font-family:var(--font-cormorant)] text-[rgba(242,242,247,0.92)] sm:text-[1.5rem]">
        {content}
      </blockquote>

      <div className="relative mt-7 flex flex-col items-center gap-3">
        {!loadingLikes && likesCount > 0 ? (
          <p className="text-xs text-textSecondary">{formatLikes(likesCount)}</p>
        ) : null}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleLike}
            disabled={isTogglingLike || loadingLikes}
            className={likedByMe
              ? `inline-flex items-center gap-1.5 rounded-full border border-lavender/45 bg-lavender/20 px-3 py-2 text-xs text-lavender transition-all duration-300 ease-calm hover:-translate-y-0.5 hover:shadow-[0_0_16px_rgba(205,189,255,0.22)] active:scale-[0.98] ${likePop ? "scale-105 shadow-[0_0_18px_rgba(205,189,255,0.28)]" : ""}`
              : "inline-flex items-center gap-1.5 rounded-full border border-borderSubtle bg-[#191922] px-3 py-2 text-xs text-textSecondary transition-all duration-300 ease-calm hover:-translate-y-0.5 hover:border-lavender/35 hover:text-lavender hover:shadow-[0_0_12px_rgba(205,189,255,0.16)] active:scale-[0.98] disabled:opacity-70"
            }
            aria-label={likedByMe ? "Retirer le like" : "Aimer la phrase"}
          >
            <Heart className={`h-3.5 w-3.5 ${likedByMe ? "fill-current" : ""}`} />
            <span>Like</span>
          </button>

          <button
            type="button"
            onClick={onShare}
            className="inline-flex items-center gap-1.5 rounded-full border border-borderSubtle bg-[#191922] px-3 py-2 text-xs text-textSecondary transition-all duration-300 ease-calm hover:-translate-y-0.5 hover:border-lavender/35 hover:text-lavender hover:shadow-[0_0_12px_rgba(205,189,255,0.16)] active:scale-[0.98]"
          >
            <Share2 className="h-3.5 w-3.5" />
            <span>Share</span>
          </button>

          <button
            type="button"
            onClick={onStory}
            disabled={isGeneratingStory}
            className="inline-flex items-center gap-1.5 rounded-full border border-borderSubtle bg-[#191922] px-3 py-2 text-xs text-textSecondary transition-all duration-300 ease-calm hover:-translate-y-0.5 hover:border-lavender/35 hover:text-lavender hover:shadow-[0_0_12px_rgba(205,189,255,0.16)] active:scale-[0.98] disabled:opacity-70"
          >
            {isGeneratingStory ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
            <span>Story</span>
          </button>
        </div>

        {status ? <p className="text-center text-xs text-textSecondary">{status}</p> : null}
      </div>
    </section>
  );
}
