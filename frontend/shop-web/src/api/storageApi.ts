import { supabase } from '../lib/supabaseClient';
import { fitImage } from '../lib/fitImage';

const BUCKET = 'product-images';

export const storageApi = {
  /**
   * Uploads an image to Supabase Storage (admin only, enforced by RLS) and returns its public URL.
   * The image is first scaled down in the browser (max 1600 px, WebP), so any photo fits the layout
   * and stays light regardless of what the admin picked.
   */
  uploadImage: async (file: File): Promise<string> => {
    const fitted = await fitImage(file);
    const base = fitted.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const path = `${Date.now()}-${base}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, fitted, { contentType: fitted.type });
    if (error) throw error;
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  },
};
