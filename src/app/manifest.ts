import type { MetadataRoute } from "next";
import { cookies } from "next/headers";
import {
  LANGUAGE_COOKIE_NAME,
  appMetadataCopy,
  normalizeLanguage,
} from "@/lib/i18n";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const cookieStore = await cookies();
  const language = normalizeLanguage(cookieStore.get(LANGUAGE_COOKIE_NAME)?.value);
  const copy = appMetadataCopy[language];

  return {
    name: copy.title,
    short_name: copy.title,
    description: copy.description,
    start_url: "/",
    display: "standalone",
    background_color: "#0E1119",
    theme_color: "#0E1119",
    orientation: "portrait-primary",
    lang: language,
    icons: [
      {
        src: "/assets/favicon/app-icon-1.8.0-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/assets/favicon/app-icon-1.8.0-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/assets/favicon/app-icon-1.8.0-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
