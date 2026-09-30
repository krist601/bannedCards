"use client";

import { useState } from "react";
import type { CatalogueItem } from "@/domain/commerce";

type CardImageProps = { item: CatalogueItem; compact?: boolean };

/** Displays provider-neutral catalogue images and falls back to the existing card motif. */
export function CardImage({ item, compact = false }: CardImageProps) {
  const [failed, setFailed] = useState<string | undefined>();

  if (item.imageUrl && failed !== item.imageUrl) {
    return <img src={item.imageUrl} alt={item.name} loading="lazy" decoding="async" onError={() => setFailed(item.imageUrl)} />;
  }

  return compact ? <>{item.colors}</> : <><span>{item.colors}</span><em>{item.set}</em></>;
}
