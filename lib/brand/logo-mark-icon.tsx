import { BRAND_ACCENT } from "@/lib/brand/logo-mark";
import { PRODUCT_NAME } from "@/lib/brand/product";

/** Inline mark for UI + `ImageResponse` icon routes. */
export function LogoMarkIcon({ size, className = "" }: { size: number; className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      className={className}
      role="img"
      aria-label={PRODUCT_NAME}
    >
      <rect width="32" height="32" rx="9" fill={BRAND_ACCENT} />
      <path
        d="M10 8.5h12.5M10 8.5v15M10 15.5h9.5"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <path
        d="M22.5 7.2v2.6M7.5 24.5h5"
        stroke="#fff"
        strokeWidth="1"
        strokeLinecap="square"
        opacity={0.55}
      />
    </svg>
  );
}
