"use client";
/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { getImageProps } from "next/image";

type Props = { src: string; alt: string; className?: string; loading?: "lazy" | "eager"; onFailed?(): void };

/** An <img> that shows a shimmering skeleton (never placeholder letters) until the picture has loaded. The parent must be position:relative. */
export function SkeletonImage({ src, alt, className, loading = "lazy", onFailed }: Props) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");
  const optimise = src.startsWith("/") && !src.startsWith("//") && !src.split(/[?#]/)[0].endsWith(".svg");
  const opt = optimise ? getImageProps({ src, alt, width: 640, height: 640, sizes: "(max-width: 640px) 50vw, 300px" }).props : undefined;
  return <>
    {status === "loading" && <span className="img-skeleton" aria-hidden="true" />}
    <img
      className={className}
      src={opt?.src ?? src}
      srcSet={opt?.srcSet}
      sizes={opt?.sizes}
      alt={alt}
      loading={loading}
      decoding="async"
      style={status === "loading" ? { opacity: 0 } : status === "error" ? { visibility: "hidden" } : undefined}
      ref={image => { if (image?.complete && status === "loading") setStatus(image.naturalWidth > 0 ? "loaded" : "error"); }}
      onLoad={() => setStatus("loaded")}
      onError={() => { setStatus("error"); onFailed?.(); }}
    />
  </>;
}
