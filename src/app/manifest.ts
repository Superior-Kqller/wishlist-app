import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Вишлист",
    short_name: "Вишлист",
    description: "Умный вишлист для совместных желаний",
    start_url: "/",
    display: "standalone",
    background_color: "#1A1A1F",
    theme_color: "#1A1A1F",
    orientation: "portrait-primary",
    lang: "ru",
    icons: [
      {
        src: "/assets/favicon/favicon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/assets/favicon/favicon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/assets/favicon/favicon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
