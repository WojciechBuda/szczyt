import { Link } from 'react-router-dom';
import { PageBlock } from '../../types/PageBuilder';
import { BlockWrapper } from './BlockWrapper';
import { useBlockContent } from './useBlockContent';

export function BannerBlock({ block }: { block: PageBlock }) {
  const content = useBlockContent(block);
  return (
    <BlockWrapper style={block.style}>
      <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
        {content.title && <h2 style={{ marginBottom: '0.5rem' }}>{content.title}</h2>}
        {content.subtitle && <p style={{ marginBottom: '1.5rem', opacity: 0.9 }}>{content.subtitle}</p>}
        {content.buttonText && (
          <Link to={content.buttonLink || '/products'} className="btn btn-primary">{content.buttonText}</Link>
        )}
      </div>
    </BlockWrapper>
  );
}
