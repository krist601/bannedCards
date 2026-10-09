"use client";
import { useState, type CSSProperties } from 'react';
import { getImageProps } from 'next/image';

/** Mount with the image URL as its key so changing slides resets loading. */
export function BannerProductImage({ src, name, style }: { src: string; name: string; style?: CSSProperties }) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');
  const optimise = src.startsWith('/') && !src.startsWith('//') && !src.split(/[?#]/)[0].endsWith('.svg');
  const opt = optimise ? getImageProps({ src, alt: name, width: 640, height: 640, sizes: '(max-width: 640px) 80vw, 420px' }).props : undefined;
  return <div className={`banner-product-image is-${status}`} style={style} aria-busy={status === 'loading'}>
    {status === 'loading' && <span className="banner-product-placeholder skeleton-block" aria-hidden="true" />}
    {status === 'error' ? <span className="banner-product-fallback">{name}</span> :
      // Product cutouts come from the sealed catalogue's stored image URLs.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={opt?.src ?? src} srcSet={opt?.srcSet} sizes={opt?.sizes} alt={name} ref={image => { if (image?.complete) setStatus(image.naturalWidth > 0 ? 'loaded' : 'error'); }} onLoad={() => setStatus('loaded')} onError={() => setStatus('error')} />}
  </div>;
}
