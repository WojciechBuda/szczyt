import { useEffect, useState } from 'react';
import { productApi } from '../../api/productApi';
import { Product } from '../../types/Product';
import { PageBlock } from '../../types/PageBuilder';
import { ProductCard } from '../ProductCard/ProductCard';
import { BlockWrapper } from './BlockWrapper';
import { useBlockContent } from './useBlockContent';
import './PageBlocks.css';

export function FeaturedProductsBlock({ block }: { block: PageBlock }) {
  const content = useBlockContent(block);
  const [products, setProducts] = useState<Product[]>([]);
  useEffect(() => { productApi.list({ page: 1, pageSize: 4, sortBy: 'newest' }).then((r) => setProducts(r.items)); }, []);

  return (
    <BlockWrapper style={block.style}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {content.title && <h2 style={{ marginBottom: '0.3rem' }}>{content.title}</h2>}
        {content.subtitle && <p className="hs-subtitle">{content.subtitle}</p>}
        <div className="product-grid">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </div>
    </BlockWrapper>
  );
}
