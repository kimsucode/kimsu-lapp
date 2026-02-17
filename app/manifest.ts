import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Blog Companion",
    short_name: "Companion",
    description: "App mobile-first pour contenu blog",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f1ea",
    theme_color: "#c55f3d",
    lang: "fr",
    icons: [
  { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
  { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
  { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
]

  };
}
