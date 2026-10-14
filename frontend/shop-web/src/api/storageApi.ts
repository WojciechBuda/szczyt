import { supabase } from '../lib/supabaseClient';

const BUCKET = 'product-images';

export const storageApi = {
  /** Uploads an image to Supabase Storage (admin only, enforced by RLS) and returns its public URL. */
  uploadImage: async (file: File): Promise<string> => {
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const path = `${Date.now()}-${safeName}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
    if (error) throw error;
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  },
};
