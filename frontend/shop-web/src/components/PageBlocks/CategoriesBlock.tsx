import { useT } from '../../i18n';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { productApi } from '../../api/productApi';
import { Category } from '../../types/Product';
import { PageBlock } from '../../types/PageBuilder';
import { BlockWrapper } from './BlockWrapper';
import { useBlockContent } from './useBlockContent';
import './PageBlocks.css';

export function CategoriesBlock({ block }: { block: PageBlock }) {
  const content = useBlockContent(block);
  const { pick } = useT();
  const [categories, setCategories] = useState<Category[]>([]);
  useEffect(() => { productApi.categories().then(setCategories); }, []);

  return (
    <BlockWrapper style={block.style}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {content.title && <h2 style={{ marginBottom: '0.3rem' }}>{content.title}</h2>}
        {content.subtitle && <p className="hs-subtitle">{content.subtitle}</p>}
        <div className="hs-category-grid">
          {categories.map((c) => (
            <Link to={`/products?categoryId=${c.id}`} key={c.id} className="hs-category-tile">
              <span>{pick(c.name, c.nameEn)}</span>
            </Link>
          ))}
        </div>
      </div>
    </BlockWrapper>
  );
}
