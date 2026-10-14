import { useT } from '../../i18n';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productApi } from '../../api/productApi';
import { Product, Category } from '../../types/Product';
import { ProductCard } from '../../components/ProductCard/ProductCard';
import './Products.css';

export function Products() {
  const { t, pick } = useT();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<number | ''>(() => {
    const fromUrl = searchParams.get('categoryId');
    return fromUrl ? Number(fromUrl) : '';
  });
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 12;

  useEffect(() => {
    productApi.categories().then(setCategories);
  }, []);

  useEffect(() => {
    const fromUrl = searchParams.get('categoryId');
    setCategoryId(fromUrl ? Number(fromUrl) : '');
    setPage(1);
  }, [searchParams]);

  useEffect(() => {
    productApi
      .list({ search: search || undefined, categoryId: categoryId || undefined, sortBy, page, pageSize })
      .then((r) => {
        setProducts(r.items);
        setTotalCount(r.totalCount);
      });
  }, [search, categoryId, sortBy, page]);

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="products-page">
      <aside className="filters">
        <h3>{t('products.filters')}</h3>
        <input
          placeholder={t('products.search')}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />

        <label>{t('products.category')}</label>
        <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value ? Number(e.target.value) : ''); setPage(1); }}>
          <option value="">{t('products.all')}</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{pick(c.name, c.nameEn)}</option>)}
        </select>

        <label>{t('products.sort')}</label>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="newest">{t('products.sort.newest')}</option>
          <option value="price_asc">{t('products.sort.priceAsc')}</option>
          <option value="price_desc">{t('products.sort.priceDesc')}</option>
          <option value="name">{t('products.sort.name')}</option>
        </select>
      </aside>

      <main className="products-main">
        <div className="product-grid">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>

        {products.length === 0 && <p className="empty-msg">{t('products.empty')}</p>}

        {totalPages > 1 && (
          <div className="pagination">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>{t('products.prev')}</button>
            <span>{t('products.page', { page, total: totalPages })}</span>
            <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>{t('products.next')}</button>
          </div>
        )}
      </main>
    </div>
  );
}
