"use client";

import { FormEvent, useState } from "react";

type CarouselItem = {
  id: string;
  url: string;
  storagePath: string;
  sortOrder: number;
};

type Props = {
  initialImages: CarouselItem[];
};

export function AdminCarouselManager({ initialImages }: Props) {
  const [images, setImages] = useState(initialImages);
  const [message, setMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function onUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const input = form.elements.namedItem("image") as HTMLInputElement | null;
    const sortOrder = Number((form.elements.namedItem("sortOrder") as HTMLInputElement | null)?.value ?? "0");

    if (!input?.files?.[0]) {
      setMessage("Sélectionne une image.");
      return;
    }

    if (images.length >= 10) {
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
    setImages((current) => [...current, payload.image].sort((a, b) => a.sortOrder - b.sortOrder));
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
    <section className="card">
      <h2 className="section-title">Carousel ({images.length}/10)</h2>

      <form onSubmit={onUpload} style={{ marginBottom: 14 }}>
        <div className="form-group">
          <label htmlFor="image">Image</label>
          <input id="image" name="image" type="file" accept="image/*" required />
        </div>

        <div className="form-group">
          <label htmlFor="sortOrder">Ordre</label>
          <input id="sortOrder" name="sortOrder" type="number" min={0} defaultValue={images.length} />
        </div>

        <button type="submit" disabled={isUploading || images.length >= 10}>
          {isUploading ? "Upload..." : "Ajouter l'image"}
        </button>
      </form>

      <div className="image-list">
        {images.map((image) => (
          <div className="image-row" key={image.id}>
            <img
              src={image.url}
              alt="Carousel"
              style={{ width: 80, height: 56, objectFit: "cover", borderRadius: 8 }}
            />
            <span className="muted" style={{ flex: 1 }}>
              Ordre: {image.sortOrder}
            </span>
            <button type="button" className="secondary" onClick={() => onDelete(image.id)}>
              Supprimer
            </button>
          </div>
        ))}

        {images.length === 0 ? <p className="muted">Aucune image.</p> : null}
      </div>

      {message ? <p className="muted">{message}</p> : null}
    </section>
  );
}
