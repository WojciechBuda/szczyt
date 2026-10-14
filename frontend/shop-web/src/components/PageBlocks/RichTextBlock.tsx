import { PageBlock } from '../../types/PageBuilder';
import { BlockWrapper } from './BlockWrapper';
import { useBlockContent } from './useBlockContent';
import './PageBlocks.css';

export function RichTextBlock({ block }: { block: PageBlock }) {
  const content = useBlockContent(block);
  // Treść wpisuje tylko admin (chronione RLS) — to zaufany kanał, jak edytor
  // WordPressa, dlatego renderujemy HTML bezpośrednio. Nigdy nie rób tego
  // z treścią pochodzącą od zwykłych użytkowników bez sanitizacji.
  return (
    <BlockWrapper style={block.style}>
      <div className="pb-richtext" style={{ maxWidth: content.wide ? 1200 : 760, margin: '0 auto' }} dangerouslySetInnerHTML={{ __html: content.html || '' }} />
    </BlockWrapper>
  );
}
