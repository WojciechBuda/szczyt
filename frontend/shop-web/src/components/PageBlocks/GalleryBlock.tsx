import { PageBlock } from '../../types/PageBuilder';
import { BlockWrapper } from './BlockWrapper';

export function GalleryBlock({ block }: { block: PageBlock }) {
  const images = block.content.images || [];
  return (
    <BlockWrapper style={block.style}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem' }}>
        {images.map((img, i) => (
          <figure key={i} style={{ margin: 0 }}>
            <img src={img.url} alt={img.caption || ''} style={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 10 }} />
            {img.caption && <figcaption style={{ fontSize: '0.85rem', marginTop: '0.4rem', opacity: 0.85 }}>{img.caption}</figcaption>}
          </figure>
        ))}
      </div>
    </BlockWrapper>
  );
}
