"use client";

import { useMemo, useState } from "react";

type CarouselImage = {
  id: string;
  url: string;
};

type Props = {
  images: CarouselImage[];
};

export function ImageCarousel({ images }: Props) {
  const [index, setIndex] = useState(0);

  const safeImages = useMemo(() => images.filter((image) => image.url), [images]);

  const hasImages = safeImages.length > 0;
  const activeImage = hasImages ? safeImages[index % safeImages.length] : null;

  function previous() {
    if (!hasImages) return;
    setIndex((current) => (current - 1 + safeImages.length) % safeImages.length);
  }

  function next() {
    if (!hasImages) return;
    setIndex((current) => (current + 1) % safeImages.length);
  }

  return (
    <section className="card">
      <h2 className="section-title">Carousel</h2>

      {activeImage ? (
        <>
          {/* Using img here keeps setup simple without remote image optimization constraints. */}
          <img
            src={activeImage.url}
            alt="Image du carousel"
            style={{ width: "100%", borderRadius: 12, aspectRatio: "16/10", objectFit: "cover" }}
          />

          {safeImages.length > 1 ? (
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button type="button" className="secondary" onClick={previous}>
                Précédente
              </button>
              <button type="button" onClick={next}>
                Suivante
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <p className="muted" style={{ margin: 0 }}>
          Ajoute entre 3 et 10 images depuis l&apos;admin.
        </p>
      )}
    </section>
  );
}
