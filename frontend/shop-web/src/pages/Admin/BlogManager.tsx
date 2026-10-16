import { useEffect, useState } from 'react';
import { blogApi } from '../../api/blogApi';
import { storageApi } from '../../api/storageApi';
import { BlogPost } from '../../types/Blog';
import { Button } from '../../components/Button/Button';
import { useT } from '../../i18n';
import { TranslateButton } from '../../components/TranslateButton/TranslateButton';
import './PageBuilderBlog.css';

const emptyForm = { slug: '', title: '', titleEn: '', excerpt: '', excerptEn: '', coverImageUrl: '', content: '', contentEn: '', authorName: 'Szczyt', isPublished: false };

function slugify(text: string) {
  return text.toLowerCase().trim()
    .replace(/[ąćęłńóśźż]/g, (m) => ({ ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z' } as any)[m] || m)
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function BlogManager() {
  const { ta, locale } = useT();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [form, setForm] = useState<any>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [wasPublished, setWasPublished] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => blogApi.listAll().then(setPosts);
  useEffect(() => { load(); }, []);

  const editPost = (p: BlogPost) => {
    setEditingId(p.id);
    setWasPublished(p.isPublished);
    setForm({ slug: p.slug, title: p.title, titleEn: p.titleEn || '', excerpt: p.excerpt, excerptEn: p.excerptEn || '', coverImageUrl: p.coverImageUrl || '', content: p.content, contentEn: p.contentEn || '', authorName: p.authorName, isPublished: p.isPublished });
  };

  const resetForm = () => { setEditingId(null); setForm(emptyForm); setWasPublished(false); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingId) await blogApi.update(editingId, form, wasPublished);
      else await blogApi.create(form);
      resetForm();
      load();
    } catch (err: any) {
      alert(`${ta('Nie udało się zapisać zmian:')} ${err?.message || ta('nieznany błąd')}`);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (confirm(ta('Na pewno usunąć ten wpis?'))) { await blogApi.remove(id); load(); }
  };

  const uploadCover = async (file: File) => {
    setUploading(true);
    try {
      const url = await storageApi.uploadImage(file);
      setForm((f: any) => ({ ...f, coverImageUrl: url }));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="blog-manager">
      <form className="product-form blog-form" onSubmit={submit}>
        <h3>{editingId ? ta('Edytuj wpis') : ta('Nowy wpis')}</h3>
        <input
          placeholder={ta('Tytuł')} required value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value, slug: editingId ? form.slug : slugify(e.target.value) })}
        />
        <input placeholder={ta('adres-wpisu')} required value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} />
        <textarea rows={2} placeholder={ta('Krótki zajawka (excerpt)')} required value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
        <textarea rows={8} placeholder={ta('Treść (HTML, np. <p>...</p>)')} required value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
        <input placeholder={ta('Autor')} value={form.authorName} onChange={(e) => setForm({ ...form, authorName: e.target.value })} />
        <div className="en-fields">
          <span className="en-label">{ta('Wersja angielska (EN)')}</span>
          <input placeholder={ta('Tytuł (English)')} value={form.titleEn} onChange={(e) => setForm({ ...form, titleEn: e.target.value })} />
          <textarea rows={2} placeholder={ta('Zajawka (English)')} value={form.excerptEn} onChange={(e) => setForm({ ...form, excerptEn: e.target.value })} />
          <textarea rows={8} placeholder={ta('Treść HTML (English)')} value={form.contentEn} onChange={(e) => setForm({ ...form, contentEn: e.target.value })} />
          <TranslateButton
            sources={() => ({ title: form.title, excerpt: form.excerpt, content: form.content })}
            onResult={(r) => setForm((f: any) => ({ ...f, titleEn: r.title ?? f.titleEn, excerptEn: r.excerpt ?? f.excerptEn, contentEn: r.content ?? f.contentEn }))}
          />
        </div>

        <div className="image-upload-row">
          <label className="image-upload-btn">
            {uploading ? ta('Wgrywanie...') : ta('📤 Zdjęcie okładki')}
            <input type="file" accept="image/*" hidden disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCover(f); }} />
          </label>
          {form.coverImageUrl && <img src={form.coverImageUrl} className="image-upload-preview" alt="" />}
        </div>

        <label className="visibility-toggle">
          <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
          {ta('Opublikowany')}
        </label>

        <div className="form-row">
          <Button type="submit" disabled={saving}>{saving ? ta('Zapisywanie...') : editingId ? ta('Zapisz zmiany') : ta('Dodaj wpis')}</Button>
          {editingId && <Button type="button" variant="secondary" onClick={resetForm}>{ta('Anuluj')}</Button>}
        </div>
      </form>

      <div className="table-scroll">
          <table className="admin-table">
        <thead><tr><th>{ta('Tytuł')}</th><th>{ta('Status')}</th><th>{ta('Data')}</th><th></th></tr></thead>
        <tbody>
          {posts.map((p) => (
            <tr key={p.id}>
              <td>{p.title}</td>
              <td>{p.isPublished ? ta('Opublikowany') : ta('Szkic')}</td>
              <td>{p.publishedAt ? new Date(p.publishedAt).toLocaleDateString(locale) : '—'}</td>
              <td className="table-actions">
                <button onClick={() => editPost(p)}>{ta('Edytuj')}</button>
                <button className="danger" onClick={() => remove(p.id)}>{ta('Usuń')}</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
          </div>
    </div>
  );
}
