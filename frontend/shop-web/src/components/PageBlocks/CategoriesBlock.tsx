import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productApi } from '../../api/productApi';
import { Category } from '../../types/Product';
import { PageBlock } from '../../types/PageBuilder';
import { BlockWrapper } from './BlockWrapper';
import './PageBlocks.css';

export function CategoriesBlock({ block }: { block: PageBlock }) {
  const [categories, setCategories] = useState<Category[]>([]);
  useEffect(() => { productApi.categories().then(setCategories); }, []);

  return (
    <BlockWrapper style={block.style}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {block.content.title && <h2 style={{ marginBottom: '0.3rem' }}>{block.content.title}</h2>}
        {block.content.subtitle && <p className="hs-subtitle">{block.content.subtitle}</p>}
        <div className="hs-category-grid">
          {categories.map((c) => (
            <Link to={`/products?categoryId=${c.id}`} key={c.id} className="hs-category-tile">
              <span>{c.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </BlockWrapper>
  );
}
