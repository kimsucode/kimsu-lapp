"use client";

import { FormEvent, useMemo, useState } from "react";

type CarouselItem = {
  id: string;
  url: string;
  storagePath: string;
  sortOrder: number;
};

type Props = {
  initialImages: CarouselItem[];
};

function orderImages(items: CarouselItem[]) {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder);
}

function inputClassName() {
  return "w-full rounded-xl border border-borderSubtle bg-[#14141c] px-3 py-2.5 text-sm text-textPrimary placeholder:text-textMuted focus:border-lavender/45 focus:outline-none";
}

export function AdminCarouselManager({ initialImages }: Props) {
  const [images, setImages] = useState(orderImages(initialImages));
  const [message, setMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const canUpload = useMemo(() => images.length < 10, [images.length]);

  async function onUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const input = form.elements.namedItem("image") as HTMLInputElement | null;
    const sortOrder = Number((form.elements.namedItem("sortOrder") as HTMLInputElement | null)?.value ?? "0");

    if (!input?.files?.[0]) {
      setMessage("Sélectionne une image.");
      return;
    }

    if (!canUpload) {
      setMessage("Maximum 10 images.");
      return;
    }

    const body = new FormData();
    body.append("image", input.files[0]);
    body.append("sortOrder", String(sortOrder));

    setIsUploading(true);
    setMessage(null);

    const response = await fetch("/api/admin/carousel/upload", {
      method: "POST",
      body
    });

    setIsUploading(false);

    if (!response.ok) {
      setMessage("Upload impossible.");
      return;
    }

    const payload = (await response.json()) as { image: CarouselItem };
    setImages((current) => orderImages([...current, payload.image]));
    setMessage("Image ajoutée.");
    form.reset();
  }

  async function onDelete(id: string) {
    const response = await fetch("/api/admin/carousel/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });

    if (!response.ok) {
      setMessage("Suppression impossible.");
      return;
    }

    setImages((current) => current.filter((image) => image.id !== id));
    setMessage("Image supprimée.");
  }

  return (
    <section className="rounded-soft border border-borderSubtle bg-surface p-4 shadow-soft sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Carousel</h2>
          <p className="mt-1 text-sm text-textSecondary">{images.length}/10 images • ordre manuel</p>
        </div>
      </div>

      <form onSubmit={onUpload} className="space-y-3 rounded-2xl border border-borderSubtle/70 bg-[#121219] p-3 sm:p-4">
        <div>
          <label htmlFor="image" className="mb-1.5 block text-sm text-textSecondary">
            Nouvelle image
          </label>
          <input id="image" name="image" type="file" accept="image/*" required className={inputClassName()} />
        </div>

        <div>
          <label htmlFor="sortOrder" className="mb-1.5 block text-sm text-textSecondary">
            Position
          </label>
          <input
            id="sortOrder"
            name="sortOrder"
            type="number"
            min={0}
            defaultValue={images.length}
            className={inputClassName()}
          />
        </div>

        <button
          type="submit"
          disabled={!canUpload || isUploading}
          className="rounded-full border border-lavender/45 bg-lavender/20 px-5 py-2.5 text-sm font-medium text-lavender transition-colors duration-300 ease-calm hover:bg-lavender/30 disabled:opacity-50"
        >
          {isUploading ? "Upload..." : canUpload ? "Ajouter l'image" : "Limite atteinte"}
        </button>
      </form>

      <div className="mt-4 space-y-2">
        {images.map((image) => (
          <div
            key={image.id}
            className="flex items-center gap-3 rounded-xl border border-borderSubtle bg-[#171720] p-2"
          >
            <img src={image.url} alt="Carousel" className="h-12 w-16 rounded-lg object-cover" />
            <div className="flex-1">
              <p className="text-sm text-textPrimary">Image</p>
              <p className="text-xs text-textMuted">Ordre: {image.sortOrder}</p>
            </div>
            <button
              type="button"
              className="rounded-full border border-borderSubtle px-3 py-1.5 text-xs text-textSecondary transition-colors duration-300 ease-calm hover:text-textPrimary"
              onClick={() => onDelete(image.id)}
            >
              Supprimer
            </button>
          </div>
        ))}

        {images.length === 0 ? (
          <p className="rounded-xl border border-borderSubtle bg-[#171720] p-3 text-sm text-textSecondary">Aucune image.</p>
        ) : null}
      </div>

      {message ? <p className="mt-3 text-sm text-textSecondary">{message}</p> : null}
    </section>
  );
}
