import { Link } from 'react-router-dom';
import { PageBlock } from '../../types/PageBuilder';
import { BlockWrapper } from './BlockWrapper';
import { useBlockContent } from './useBlockContent';

export function HeroBlock({ block }: { block: PageBlock }) {
  const content = useBlockContent(block);
  return (
    <BlockWrapper style={block.style}>
      <div style={{ maxWidth: 640, margin: '0 auto', textAlign: 'center' }}>
        {content.title && <h1 style={{ fontSize: 'clamp(1.6rem, 6vw, 2.2rem)', marginBottom: '0.75rem' }}>{content.title}</h1>}
        {content.subtitle && <p style={{ fontSize: '1.1rem', marginBottom: '1.5rem', opacity: 0.9 }}>{content.subtitle}</p>}
        {content.buttonText && (
          <Link to={content.buttonLink || '/products'} className="btn btn-primary">{content.buttonText}</Link>
        )}
      </div>
    </BlockWrapper>
  );
}
