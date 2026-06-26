"use client";

import { Heart } from "lucide-react";
import { useEffect, useState } from "react";

import { getOrCreateFingerprint } from "@/lib/client/fingerprint";

type CarouselImage = {
  id: string;
  url: string;
};

type Props = {
  images: CarouselImage[];
};

type LikesPayload = {
  count: number;
  likedByMe: boolean;
};

function ImageLikeButton({ imageId }: { imageId: string }) {
  const [fingerprint, setFingerprint] = useState("");
  const [likesCount, setLikesCount] = useState(0);
  const [likedByMe, setLikedByMe] = useState(false);
  const [loadingLikes, setLoadingLikes] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    setFingerprint(getOrCreateFingerprint());
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadLikes() {
      setLoadingLikes(true);
      const response = await fetch(`/api/images/likes?imageId=${encodeURIComponent(imageId)}`, {
        headers: fingerprint ? { "x-fingerprint": fingerprint } : undefined
      }).catch(() => null);

      if (!response || !response.ok) {
        if (!cancelled) setLoadingLikes(false);
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
  }, [imageId, fingerprint]);

  async function onToggleLike() {
    if (!fingerprint || loadingLikes || isToggling) return;

    setIsToggling(true);

    const prevLiked = likedByMe;
    const prevCount = likesCount;
    const nextLiked = !prevLiked;
    const nextCount = Math.max(0, prevCount + (nextLiked ? 1 : -1));

    setLikedByMe(nextLiked);
    setLikesCount(nextCount);

    const response = await fetch("/api/images/likes/toggle", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-fingerprint": fingerprint
      },
      body: JSON.stringify({ imageId })
    }).catch(() => null);

    if (!response || !response.ok) {
      setLikedByMe(prevLiked);
      setLikesCount(prevCount);
      setIsToggling(false);
      return;
    }

    const payload = (await response.json()) as LikesPayload;
    setLikedByMe(payload.likedByMe);
    setLikesCount(payload.count);
    setIsToggling(false);
  }

  return (
    <button
      type="button"
      onClick={onToggleLike}
      disabled={loadingLikes || isToggling}
      className={likedByMe
        ? "inline-flex items-center gap-1 rounded-full border border-lavender/45 bg-lavender/20 px-2 py-1 text-[11px] text-lavender backdrop-blur"
        : "inline-flex items-center gap-1 rounded-full border border-borderSubtle/80 bg-[#151521]/80 px-2 py-1 text-[11px] text-textSecondary backdrop-blur hover:border-lavender/35 hover:text-lavender"
      }
      aria-label={likedByMe ? "Retirer le like de l'image" : "Liker l'image"}
    >
      <Heart className={`h-3 w-3 ${likedByMe ? "fill-current" : ""}`} />
      {likesCount > 0 ? <span>{likesCount}</span> : null}
    </button>
  );
}

export function Carousel({ images }: Props) {
  return (
    <section className="animate-fadeCalm rounded-soft border border-borderSubtle bg-surface px-4 py-4 shadow-soft transition-all duration-300 ease-calm" style={{ animationDelay: "140ms" }}>
      <p className="text-[11px] uppercase tracking-[0.15em] text-textMuted">Mood</p>

      {images.length ? (
        <div className="mt-3 -mr-2 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 pr-2">
          {images.map((image) => (
            <figure key={image.id} className="relative min-w-[80%] snap-center overflow-hidden rounded-[18px]">
              <img
                src={image.url}
                alt="Image atmosphérique"
                className="h-52 w-full object-cover transition duration-300 ease-calm hover:scale-[1.01]"
              />

              <div className="absolute right-2 top-2">
                <ImageLikeButton imageId={image.id} />
              </div>
            </figure>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-textSecondary">Ajoute 3 à 10 images depuis l&apos;admin.</p>
      )}
    </section>
  );
}
