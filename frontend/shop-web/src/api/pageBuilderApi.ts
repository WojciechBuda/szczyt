import { supabase } from '../lib/supabaseClient';
import { Page, PageBlock, BlockType, BlockContent, BlockStyle } from '../types/PageBuilder';

interface PageRow { id: number; slug: string; title: string; is_system: boolean }
interface BlockRow {
  id: number; page_id: number; type: BlockType; order: number; is_visible: boolean;
  content: BlockContent; style: BlockStyle;
}

function toPage(r: PageRow): Page { return { id: r.id, slug: r.slug, title: r.title, isSystem: r.is_system }; }
function toBlock(r: BlockRow): PageBlock {
  return { id: r.id, pageId: r.page_id, type: r.type, order: r.order, isVisible: r.is_visible, content: r.content || {}, style: r.style || {} };
}

export const pageBuilderApi = {
  /** Publiczne — bloki widocznej strony o danym slugu, w kolejności. */
  getPageBySlug: async (slug: string): Promise<{ page: Page; blocks: PageBlock[] } | null> => {
    const { data: pageRow, error: pageError } = await supabase.from('pages').select('id, slug, title, is_system').eq('slug', slug).single();
    if (pageError || !pageRow) return null;

    const { data: blockRows, error: blockError } = await supabase
      .from('page_blocks')
      .select('id, page_id, type, order, is_visible, content, style')
      .eq('page_id', pageRow.id)
      .eq('is_visible', true)
      .order('order');
    if (blockError) throw blockError;

    return { page: toPage(pageRow), blocks: (blockRows as BlockRow[]).map(toBlock) };
  },

  // Admin
  listPages: async (): Promise<Page[]> => {
    const { data, error } = await supabase.from('pages').select('id, slug, title, is_system').order('id');
    if (error) throw error;
    return (data as PageRow[]).map(toPage);
  },

  createPage: async (slug: string, title: string): Promise<Page> => {
    const { data, error } = await supabase.from('pages').insert({ slug, title }).select('id, slug, title, is_system').single();
    if (error) throw error;
    return toPage(data as PageRow);
  },

  deletePage: async (id: number): Promise<void> => {
    const { error } = await supabase.from('pages').delete().eq('id', id);
    if (error) throw error;
  },

  getAllBlocks: async (pageId: number): Promise<PageBlock[]> => {
    const { data, error } = await supabase
      .from('page_blocks')
      .select('id, page_id, type, order, is_visible, content, style')
      .eq('page_id', pageId)
      .order('order');
    if (error) throw error;
    return (data as BlockRow[]).map(toBlock);
  },

  addBlock: async (pageId: number, type: BlockType, order: number): Promise<PageBlock> => {
    const { data, error } = await supabase
      .from('page_blocks')
      .insert({ page_id: pageId, type, order, content: {}, style: {} })
      .select('id, page_id, type, order, is_visible, content, style')
      .single();
    if (error) throw error;
    return toBlock(data as BlockRow);
  },

  deleteBlock: async (id: number): Promise<void> => {
    const { error } = await supabase.from('page_blocks').delete().eq('id', id);
    if (error) throw error;
  },

  // One UPDATE per block. An upsert would send the id inside an INSERT, which Postgres rejects
  // for GENERATED ALWAYS identity columns ("cannot insert a non-DEFAULT value into column id").
  saveBlocks: async (blocks: PageBlock[]): Promise<void> => {
    const results = await Promise.all(
      blocks.map((b) =>
        supabase
          .from('page_blocks')
          .update({ type: b.type, order: b.order, is_visible: b.isVisible, content: b.content, style: b.style })
          .eq('id', b.id)
      )
    );
    const failed = results.find((r) => r.error);
    if (failed?.error) throw failed.error;
  },
};
