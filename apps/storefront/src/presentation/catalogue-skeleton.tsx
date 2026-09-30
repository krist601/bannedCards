export function CatalogueSkeleton({hero=false,row=false}:{hero?:boolean;row?:boolean}) {
  return <div role="status" aria-label="Loading products" className="catalogue-skeleton">
    <span className="sr-only">Loading products…</span>
    {hero&&<div className="set-hero skeleton-hero" aria-hidden="true"><div className="browse-slide"><div className="browse-copy"><div className="skeleton-block skeleton-label"/><div className="skeleton-block skeleton-title"/><div className="skeleton-block skeleton-button"/></div><div className="browse-cutout browse-product-group">{[0,1,2].map(i=><div key={i} className="skeleton-block skeleton-pack"/>)}</div></div></div>}
    <div aria-hidden="true"><div className="skeleton-block skeleton-title"/><div className={row||hero?'product-track skeleton-track':'card-grid sealed-grid'}>{[0,1,2,3].map(i=><div key={i} className="skeleton-card"><div className="skeleton-block skeleton-image"/><div className="skeleton-block skeleton-label"/><div className="skeleton-block skeleton-name"/><div className="skeleton-block skeleton-button"/></div>)}</div></div>
  </div>;
}
