import { LogoMarkIcon } from "@/lib/brand/logo-mark-icon";
import { PRODUCT_MARK_WORDMARK } from "@/lib/brand/product";

export type SiteLogoProps = {
  size?: number;
  showWordmark?: boolean;
  wordmark?: string;
  className?: string;
};

export function SiteLogoMark({
  size = 32,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <LogoMarkIcon
      size={size}
      className={`shrink-0 overflow-hidden rounded-[9px] ${className}`}
    />
  );
}

export default function SiteLogo({
  size = 32,
  showWordmark = true,
  wordmark = PRODUCT_MARK_WORDMARK,
  className = "",
}: SiteLogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <SiteLogoMark size={size} />
      {showWordmark ? (
        <span className="text-sm font-bold tracking-tight text-[color:var(--foreground)]">{wordmark}</span>
      ) : null}
    </span>
  );
}
