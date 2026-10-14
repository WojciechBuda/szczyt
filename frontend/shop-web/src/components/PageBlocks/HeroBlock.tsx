import { Link } from 'react-router-dom';
import { PageBlock } from '../../types/PageBuilder';
import { BlockWrapper } from './BlockWrapper';

export function HeroBlock({ block }: { block: PageBlock }) {
  return (
    <BlockWrapper style={block.style}>
      <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
        {block.content.title && <h1 style={{ fontSize: '2.2rem', marginBottom: '0.75rem' }}>{block.content.title}</h1>}
        {block.content.subtitle && <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem', opacity: 0.9 }}>{block.content.subtitle}</p>}
        {block.content.buttonText && (
          <Link to={block.content.buttonLink || '/products'} className="btn btn-primary">{block.content.buttonText}</Link>
        )}
      </div>
    </BlockWrapper>
  );
}
