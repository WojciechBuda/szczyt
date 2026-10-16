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
import { useT } from '../../i18n';
import { TranslateButton } from '../../components/TranslateButton/TranslateButton';
import './Admin.css';

type Tab = 'stats' | 'products' | 'orders' | 'pagebuilder' | 'blog' | 'footer' | 'chatbot';

const emptyForm = { name: '', nameEn: '', description: '', descriptionEn: '', price: 0, stock: 0, imageUrl: '', categoryId: 0 };

export function Admin() {
  const { t, ta } = useT();
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

  if (!initialized) return <div className="admin-page"><p>{ta('Ładowanie…')}</p></div>;
  if (!admin) return <div className="admin-page"><p>{ta('Brak dostępu — ta sekcja jest tylko dla administratorów.')}</p></div>;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await storageApi.uploadImage(file);
      setForm((f: any) => ({ ...f, imageUrl: url }));
    } catch (err: any) {
      alert(err.message || ta('Nie udało się wgrać zdjęcia.'));
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
    setForm({ name: p.name, nameEn: p.nameEn || '', description: p.description, descriptionEn: p.descriptionEn || '', price: p.price, stock: p.stock, imageUrl: p.imageUrl || '', categoryId: p.categoryId });
  };

  const deleteProduct = async (id: number) => {
    if (confirm(ta('Na pewno usunąć ten produkt?'))) {
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
      <h1>{ta('Panel administratora')}</h1>

      <div className="admin-tabs">
        <button className={tab === 'stats' ? 'active' : ''} onClick={() => setTab('stats')}>{ta('Statystyki')}</button>
        <button className={tab === 'products' ? 'active' : ''} onClick={() => setTab('products')}>{ta('Produkty')}</button>
        <button className={tab === 'orders' ? 'active' : ''} onClick={() => setTab('orders')}>{ta('Zamówienia')}</button>
        <button className={tab === 'pagebuilder' ? 'active' : ''} onClick={() => setTab('pagebuilder')}>{ta('Edytor stron')}</button>
        <button className={tab === 'blog' ? 'active' : ''} onClick={() => setTab('blog')}>{ta('Blog')}</button>
        <button className={tab === 'footer' ? 'active' : ''} onClick={() => setTab('footer')}>{ta('Stopka')}</button>
        <button className={tab === 'chatbot' ? 'active' : ''} onClick={() => setTab('chatbot')}>{ta('Czat wsparcia')}</button>
      </div>

      {tab === 'stats' && stats && (
        <div className="stats-grid">
          <div className="stat-card"><span className="stat-label">{ta('Produkty')}</span><span className="stat-value">{stats.totalProducts}</span></div>
          <div className="stat-card"><span className="stat-label">{ta('Zamówienia')}</span><span className="stat-value">{stats.totalOrders}</span></div>
          <div className="stat-card"><span className="stat-label">{ta('Użytkownicy')}</span><span className="stat-value">{stats.totalUsers}</span></div>
          <div className="stat-card"><span className="stat-label">{ta('Przychód')}</span><span className="stat-value">{stats.revenue.toFixed(2)} {t('common.currency')}</span></div>
        </div>
      )}

      {tab === 'products' && (
        <div className="admin-products">
          <form className="product-form" onSubmit={submitProduct}>
            <h3>{editingId ? ta('Edytuj produkt') : ta('Nowy produkt')}</h3>
            <input placeholder={ta('Nazwa')} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <textarea placeholder={ta('Opis')} required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <div className="en-fields">
              <span className="en-label">{ta('Wersja angielska (EN)')}</span>
              <input placeholder={ta('Nazwa (English)')} value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} />
              <textarea placeholder={ta('Opis (English)')} value={form.descriptionEn} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })} />
              <TranslateButton
                sources={() => ({ name: form.name, description: form.description })}
                onResult={(r) => setForm((f: any) => ({ ...f, nameEn: r.name ?? f.nameEn, descriptionEn: r.description ?? f.descriptionEn }))}
              />
            </div>
            <div className="form-row">
              <input type="number" step="0.01" placeholder={ta('Cena')} required value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
              <input type="number" placeholder={ta('Stan')} required value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} />
            </div>
            <input placeholder={ta('URL zdjęcia')} value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
            <div className="image-upload-row">
              <label className="image-upload-btn">
                {uploading ? ta('Wgrywanie...') : ta('📤 Wgraj zdjęcie')}
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} hidden />
              </label>
              {form.imageUrl && <img src={form.imageUrl} alt={ta('Podgląd')} className="image-upload-preview" />}
            </div>
            <select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: Number(e.target.value) })}>
              <option value={0} disabled>{ta('Wybierz kategorię')}</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <div className="form-row">
              <Button type="submit">{editingId ? ta('Zapisz zmiany') : ta('Dodaj produkt')}</Button>
              {editingId && <Button type="button" variant="secondary" onClick={() => { setEditingId(null); setForm(emptyForm); }}>{ta('Anuluj')}</Button>}
            </div>
          </form>

          <div className="table-scroll">
          <table className="admin-table">
            <thead><tr><th>{ta('Nazwa')}</th><th>{ta('Cena')}</th><th>{ta('Stan')}</th><th>{ta('Kategoria')}</th><th></th></tr></thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.price.toFixed(2)} {t('common.currency')}</td>
                  <td>{p.stock}</td>
                  <td>{p.categoryName}</td>
                  <td className="table-actions">
                    <button onClick={() => editProduct(p)}>{ta('Edytuj')}</button>
                    <button className="danger" onClick={() => deleteProduct(p.id)}>{ta('Usuń')}</button>
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
          {orders.length === 0 && <p className="empty-msg">{ta('Brak zamówień.')}</p>}
          {orders.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              showCustomer
              statusControl={
                <select className="order-status-select" value={o.status} onChange={(e) => changeStatus(o.id, e.target.value)}>
                  <option value="Pending">{t('order.status.Pending')}</option>
                  <option value="Paid">{t('order.status.Paid')}</option>
                  <option value="Shipped">{t('order.status.Shipped')}</option>
                  <option value="Completed">{t('order.status.Completed')}</option>
                  <option value="Cancelled">{t('order.status.Cancelled')}</option>
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
