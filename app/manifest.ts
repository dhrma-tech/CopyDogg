import type { MetadataRoute } from "next";

/** Lets a browser install CopyDogg as its own app window (taskbar/dock icon, no browser chrome). */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CopyDogg",
    short_name: "CopyDogg",
    description: "Teach it your voice once. Then just say what you want.",
    start_url: "/app",
    display: "standalone",
    background_color: "#FFFDF5",
    theme_color: "#1B1C14",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
