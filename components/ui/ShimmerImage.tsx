"use client";

import { useEffect, useState } from "react";
import { ShimmerFill } from "@/components/ui/Shimmer";

function mediaRevealClass(loaded: boolean) {
  return loaded ? "opacity-100 transition-opacity duration-300" : "opacity-0";
}

function syncImageReady(node: HTMLImageElement | null, onReady: () => void) {
  if (node?.complete && node.naturalWidth > 0) onReady();
}

/** Raw `<img>` with shimmer while loading (for spots that don't use next/image). */
export function ShimmerImage({
  src,
  alt = "",
  className = "",
  imgClassName = "h-full w-full object-cover",
}: {
  src: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [src]);

  if (failed) return null;

  return (
    <span className={["relative block overflow-hidden", className].join(" ")}>
      {!loaded ? <ShimmerFill /> : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={src}
        src={src}
        alt={alt}
        className={[imgClassName, mediaRevealClass(loaded)].join(" ")}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
        ref={(node) => {
          syncImageReady(node, () => setLoaded(true));
        }}
      />
    </span>
  );
}
