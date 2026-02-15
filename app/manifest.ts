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
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml"
      }
    ]
  };
}
