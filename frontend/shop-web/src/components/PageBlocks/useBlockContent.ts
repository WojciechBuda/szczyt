import { useT } from '../../i18n';
import { BlockContent, PageBlock } from '../../types/PageBuilder';

/**
 * Returns the block content in the active language. English overrides live in `content.en`
 * (same shape as the Polish fields); anything missing there falls back to the Polish original.
 */
export function useBlockContent(block: PageBlock): BlockContent {
  const { lang } = useT();
  const en = (block.content as BlockContent & { en?: Partial<BlockContent> }).en;
  if (lang !== 'en' || !en) return block.content;
  const filled = Object.fromEntries(Object.entries(en).filter(([, v]) => v !== '' && v != null));
  return { ...block.content, ...filled };
}
