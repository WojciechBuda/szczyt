/** Longest side of an uploaded image, in pixels. Enough for a full-width hero on a retina laptop. */
const MAX_SIDE = 1600;
const QUALITY = 0.85;

/**
 * Scales an image down so its longest side is at most MAX_SIDE and re-encodes it as WebP.
 * Smaller images are never enlarged. GIF/SVG and anything the browser cannot decode are returned untouched.
 */
export async function fitImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') return file;

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', QUALITY));
    // Keep the original if re-encoding failed or did not make the file smaller without resizing.
    if (!blob || blob.type !== 'image/webp' || (scale === 1 && blob.size >= file.size)) return file;

    const name = file.name.replace(/\.[^.]+$/, '') + '.webp';
    return new File([blob], name, { type: 'image/webp' });
  } catch {
    return file;
  }
}
