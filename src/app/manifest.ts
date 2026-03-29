import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Вишлист",
    short_name: "Вишлист",
    description: "Умный вишлист для совместных желаний",
    start_url: "/",
    display: "standalone",
    background_color: "#0F0B18",
    theme_color: "#0F0B18",
    orientation: "portrait-primary",
    lang: "ru",
    icons: [
      {
        src: "/assets/favicon/app-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/assets/favicon/app-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/assets/favicon/app-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
