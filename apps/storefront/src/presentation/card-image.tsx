"use client";

import { useState } from "react";
import type { CatalogueItem } from "@/domain/commerce";
import { SkeletonImage } from "./skeleton-image";

type CardImageProps = { item: CatalogueItem; compact?: boolean };

/** Displays provider-neutral catalogue images and falls back to the existing card motif. */
export function CardImage({ item, compact = false }: CardImageProps) {
  const [failed, setFailed] = useState<string | undefined>();

  if (item.imageUrl && failed !== item.imageUrl) {
    return <SkeletonImage src={item.imageUrl} alt={item.name} onFailed={() => setFailed(item.imageUrl)} />;
  }

  return compact ? <>{item.colors}</> : <><span>{item.colors}</span><em>{item.set}</em></>;
}
