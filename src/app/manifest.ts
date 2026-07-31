import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Keuanganku — Catatan Keuangan Pribadi",
    short_name: "Keuanganku",
    description: "Pencatatan keuangan pribadi yang cepat, dengan dashboard analisa.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f1226",
    theme_color: "#7c5cff",
    orientation: "portrait",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
