import { ImageResponse } from "next/og";
import { appIconElement } from "@/lib/appIcon";

/** Fixed-path icon for the web manifest (icon.tsx's URL includes a build hash, so it can't be linked from manifest.ts). */
export async function GET() {
  return new ImageResponse(appIconElement(512), { width: 512, height: 512 });
}
