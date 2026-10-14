import { Link } from 'react-router-dom';
import { PageBlock } from '../../types/PageBuilder';
import { BlockWrapper } from './BlockWrapper';

export function BannerBlock({ block }: { block: PageBlock }) {
  return (
    <BlockWrapper style={block.style}>
      <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
        {block.content.title && <h2 style={{ marginBottom: '0.5rem' }}>{block.content.title}</h2>}
        {block.content.subtitle && <p style={{ marginBottom: '1.5rem', opacity: 0.9 }}>{block.content.subtitle}</p>}
        {block.content.buttonText && (
          <Link to={block.content.buttonLink || '/products'} className="btn btn-primary">{block.content.buttonText}</Link>
        )}
      </div>
    </BlockWrapper>
  );
}
