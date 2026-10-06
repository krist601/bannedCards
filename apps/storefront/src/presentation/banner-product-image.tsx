"use client";
import { useState } from 'react';

/** Mount with the image URL as its key so changing slides resets loading. */
export function BannerProductImage({ src, name }: { src: string; name: string }) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  return <div className={`banner-product-image is-${status}`} aria-busy={status === 'loading'}>
    {status === 'loading' && <span className="banner-product-placeholder skeleton-block" aria-hidden="true" />}
    {status === 'error' ? <span className="banner-product-fallback">{name}</span> :
      // Product cutouts come from the sealed catalogue's stored image URLs.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={name} ref={image => { if (image?.complete) setStatus(image.naturalWidth > 0 ? 'loaded' : 'error'); }} onLoad={() => setStatus('loaded')} onError={() => setStatus('error')} />}
  </div>;
}
