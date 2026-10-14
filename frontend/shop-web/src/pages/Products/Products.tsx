import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productApi } from '../../api/productApi';
import { Product, Category } from '../../types/Product';
import { ProductCard } from '../../components/ProductCard/ProductCard';
import './Products.css';

export function Products() {
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
        <h3>Filtry</h3>
        <input
          placeholder="Szukaj produktów..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />

        <label>Kategoria</label>
        <select value={categoryId} onChange={(e) => { setCategoryId(e.target.value ? Number(e.target.value) : ''); setPage(1); }}>
          <option value="">Wszystkie</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <label>Sortowanie</label>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="newest">Najnowsze</option>
          <option value="price_asc">Cena rosnąco</option>
          <option value="price_desc">Cena malejąco</option>
          <option value="name">Nazwa</option>
        </select>
      </aside>

      <main className="products-main">
        <div className="product-grid">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>

        {products.length === 0 && <p className="empty-msg">Brak produktów spełniających kryteria.</p>}

        {totalPages > 1 && (
          <div className="pagination">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Poprzednia</button>
            <span>Strona {page} z {totalPages}</span>
            <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Następna</button>
          </div>
        )}
      </main>
    </div>
  );
}
