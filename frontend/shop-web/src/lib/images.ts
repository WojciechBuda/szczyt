/** Local fallbacks (public/img), used when a product has no photo or its URL fails to load. */
const BY_CATEGORY: Array<[RegExp, string]> = [
  [/odzie|kurtk|bluz|spodn/i, '/img/product-clothing.jpg'],
  [/wspin|uprz|lin[ay]|rak|czekan/i, '/img/product-climbing.jpg'],
  [/plecak|akcesor|kij/i, '/img/product-backpacks.jpg'],
  [/obuw|but/i, '/img/product-boots.jpg'],
];

export function fallbackImage(categoryName?: string): string {
  const hit = BY_CATEGORY.find(([re]) => re.test(categoryName || ''));
  return hit ? hit[1] : '/img/product-default.jpg';
}

/** onError handler: swap in the fallback once, without looping if the fallback itself fails. */
export function onImageError(fallback: string) {
  return (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (!img.src.endsWith(fallback)) img.src = fallback;
  };
}
