import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { productApi } from '../../api/productApi';
import { orderApi } from '../../api/orderApi';
import { storageApi } from '../../api/storageApi';
import { Product, Category } from '../../types/Product';
import { Order } from '../../types/Order';
import { Button } from '../../components/Button/Button';
import { OrderCard } from '../../components/OrderCard/OrderCard';
import { PageBuilderManager } from './PageBuilderManager';
import { BlogManager } from './BlogManager';
import { FooterManager } from './FooterManager';
import { ChatbotManager } from './ChatbotManager';
import './Admin.css';

type Tab = 'stats' | 'products' | 'orders' | 'pagebuilder' | 'blog' | 'footer' | 'chatbot';

const emptyForm = { name: '', description: '', price: 0, stock: 0, imageUrl: '', categoryId: 0 };

export function Admin() {
  const { user, initialized } = useAuthStore();
  const admin = user?.role === 'Admin';
  const [tab, setTab] = useState<Tab>('stats');
  const [stats, setStats] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [form, setForm] = useState<any>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);

  const loadAll = () => {
    orderApi.stats().then(setStats).catch(() => setStats(null));
    productApi.list({ pageSize: 100 }).then((r) => setProducts(r.items)).catch(() => undefined);
    productApi.categories().then(setCategories).catch(() => undefined);
    orderApi.all().then(setOrders).catch(() => undefined);
  };

  // Load once the profile (and therefore the role) is known — on a hard refresh
  // the session is restored asynchronously, so the first render has no user yet.
  useEffect(() => { if (admin) loadAll(); }, [admin]);

  if (!initialized) return <div className="admin-page"><p>Ładowanie…</p></div>;
  if (!admin) return <div className="admin-page"><p>Brak dostępu — ta sekcja jest tylko dla administratorów.</p></div>;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await storageApi.uploadImage(file);
      setForm((f: any) => ({ ...f, imageUrl: url }));
    } catch (err: any) {
      alert(err.message || 'Nie udało się wgrać zdjęcia.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const submitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      await productApi.update(editingId, { ...form, isActive: true });
    } else {
      await productApi.create(form);
    }
    setForm(emptyForm);
    setEditingId(null);
    loadAll();
  };

  const editProduct = (p: Product) => {
    setEditingId(p.id);
    setForm({ name: p.name, description: p.description, price: p.price, stock: p.stock, imageUrl: p.imageUrl || '', categoryId: p.categoryId });
  };

  const deleteProduct = async (id: number) => {
    if (confirm('Na pewno usunąć ten produkt?')) {
      await productApi.remove(id);
      loadAll();
    }
  };

  const changeStatus = async (orderId: number, status: string) => {
    await orderApi.updateStatus(orderId, status);
    loadAll();
  };

  return (
    <div className="admin-page">
      <h1>Panel administratora</h1>

      <div className="admin-tabs">
        <button className={tab === 'stats' ? 'active' : ''} onClick={() => setTab('stats')}>Statystyki</button>
        <button className={tab === 'products' ? 'active' : ''} onClick={() => setTab('products')}>Produkty</button>
        <button className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')}>Zamówienia</button>
        <button className={tab === 'pagebuilder' ? 'active' : ''} onClick={() => setTab('pagebuilder')}>Edytor stron</button>
        <button className={tab === 'blog' ? 'active' : ''} onClick={() => setTab('blog')}>Blog</button>
        <button className={tab === 'footer' ? 'active' : ''} onClick={() => setTab('footer')}>Stopka</button>
        <button className={tab === 'chatbot' ? 'active' : ''} onClick={() => setTab('chatbot')}>Czat wsparcia</button>
      </div>

      {tab === 'stats' && stats && (
        <div className="stats-grid">
          <div className="stat-card"><span className="stat-label">Produkty</span><span className="stat-value">{stats.totalProducts}</span></div>
          <div className="stat-card"><span className="stat-label">Zamówienia</span><span className="stat-value">{stats.totalOrders}</span></div>
          <div className="stat-card"><span className="stat-label">Użytkownicy</span><span className="stat-value">{stats.totalUsers}</span></div>
          <div className="stat-card"><span className="stat-label">Przychód</span><span className="stat-value">{stats.revenue.toFixed(2)} zł</span></div>
        </div>
      )}

      {tab === 'products' && (
        <div className="admin-products">
          <form className="product-form" onSubmit={submitProduct}>
            <h3>{editingId ? 'Edytuj produkt' : 'Nowy produkt'}</h3>
            <input placeholder="Nazwa" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <textarea placeholder="Opis" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="form-row">
              <input type="number" step="0.01" placeholder="Cena" required value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
              <input type="number" placeholder="Stan" required value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
            </div>
            <input placeholder="URL zdjęcia" value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
            <div className="image-upload-row">
              <label className="image-upload-btn">
                {uploading ? 'Wgrywanie...' : '📤 Wgraj zdjęcie'}
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} hidden />
              </label>
              {form.imageUrl && <img src={form.imageUrl} alt="Podgląd" className="image-upload-preview" />}
            </div>
            <select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) })}>
              <option value={0} disabled>Wybierz kategorię</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="form-row">
              <Button type="submit">{editingId ? 'Zapisz zmiany' : 'Dodaj produkt'}</Button>
              {editingId && <Button type="button" variant="secondary" onClick={() => { setEditingId(null); setForm(emptyForm); }}>Anuluj</Button>}
            </div>
          </form>

          <div className="table-scroll">
          <table className="admin-table">
            <thead><tr><th>Nazwa</th><th>Cena</th><th>Stan</th><th>Kategoria</th><th></th></tr></thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.price.toFixed(2)} zł</td>
                  <td>{p.stock}</td>
                  <td>{p.categoryName}</td>
                  <td className="table-actions">
                    <button onClick={() => editProduct(p)}>Edytuj</button>
                    <button className="danger" onClick={() => deleteProduct(p.id)}>Usuń</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {tab === 'orders' && (
        <div className="admin-orders-list">
          {orders.length === 0 && <p className="empty-msg">Brak zamówień.</p>}
          {orders.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              showCustomer
              statusControl={
                <select className="order-status-select" value={o.status} onChange={(e) => changeStatus(o.id, e.target.value)}>
                  <option value="Pending">Oczekujące</option>
                  <option value="Paid">Opłacone</option>
                  <option value="Shipped">Wysłane</option>
                  <option value="Completed">Zrealizowane</option>
                  <option value="Cancelled">Anulowane</option>
                </select>
              }
            />
          ))}
        </div>
      )}

      {tab === 'pagebuilder' && <PageBuilderManager />}

      {tab === 'blog' && <BlogManager />}

      {tab === 'footer' && <FooterManager />}

      {tab === 'chatbot' && <ChatbotManager />}
    </div>
  );
}
