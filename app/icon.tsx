import { ImageResponse } from "next/og";
import { LogoMarkIcon } from "@/lib/brand/logo-mark-icon";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<LogoMarkIcon size={32} />, { ...size });
}
