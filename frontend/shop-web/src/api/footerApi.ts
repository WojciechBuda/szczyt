import { supabase } from '../lib/supabaseClient';
import { Footer, SocialLink } from '../types/Footer';

interface LinkRow {
  id: number;
  platform: string;
  url: string;
  order: number;
  is_visible: boolean;
}

function toLink(row: LinkRow): SocialLink {
  return { id: row.id, platform: row.platform, url: row.url, order: row.order, isVisible: row.is_visible };
}

async function fetchFooter(includeHidden: boolean): Promise<Footer> {
  const [{ data: settings, error: settingsError }, linksQuery] = await Promise.all([
    supabase.from('site_settings').select('footer_text, contact_email').eq('id', 1).single(),
    includeHidden
      ? supabase.from('social_links').select('id, platform, url, order, is_visible').order('order')
      : supabase.from('social_links').select('id, platform, url, order, is_visible').eq('is_visible', true).order('order'),
  ]);
  if (settingsError) throw settingsError;
  const { data: links, error: linksError } = linksQuery;
  if (linksError) throw linksError;

  return {
    footerText: settings?.footer_text || '',
    contactEmail: settings?.contact_email || null,
    socialLinks: (links as unknown as LinkRow[]).map(toLink),
  };
}

export const footerApi = {
  // Public — only visible links, for the storefront footer.
  get: () => fetchFooter(false),

  // Admin — sees hidden links too, for editing.
  getAdmin: () => fetchFooter(true),

  update: async (data: Footer): Promise<Footer> => {
    const { error: settingsError } = await supabase
      .from('site_settings')
      .upsert({ id: 1, footer_text: data.footerText, contact_email: data.contactEmail });
    if (settingsError) throw settingsError;

    // Full replace of the social links list — simplest way to support add/remove/reorder in one save.
    const { error: deleteError } = await supabase.from('social_links').delete().gte('id', 0);
    if (deleteError) throw deleteError;

    if (data.socialLinks.length > 0) {
      const { error: insertError } = await supabase.from('social_links').insert(
        data.socialLinks.map((l) => ({ platform: l.platform, url: l.url, order: l.order, is_visible: l.isVisible }))
      );
      if (insertError) throw insertError;
    }

    return fetchFooter(true);
  },
};
