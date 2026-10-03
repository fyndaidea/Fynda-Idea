import type { MetadataRoute } from "next";
import { PRODUCT_NAME, PRODUCT_TAGLINE, PRODUCT_WORDMARK } from "@/lib/brand/product";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: PRODUCT_WORDMARK,
    short_name: PRODUCT_NAME,
    description: PRODUCT_TAGLINE,
    start_url: "/",
    display: "standalone",
    background_color: "#fafaf8",
    theme_color: "#ff3131",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "16x16 32x32 48x48",
        type: "image/x-icon",
        purpose: "any",
      },
      {
        src: "/favicon-32.png",
        sizes: "32x32",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
