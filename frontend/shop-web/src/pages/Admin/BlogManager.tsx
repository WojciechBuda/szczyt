import { useEffect, useState } from 'react';
import { blogApi } from '../../api/blogApi';
import { storageApi } from '../../api/storageApi';
import { BlogPost } from '../../types/Blog';
import { Button } from '../../components/Button/Button';
import './PageBuilderBlog.css';

const emptyForm = { slug: '', title: '', excerpt: '', coverImageUrl: '', content: '', authorName: 'Szczyt', isPublished: false };

function slugify(text: string) {
  return text.toLowerCase().trim()
    .replace(/[ąćęłńóśźż]/g, (m) => ({ ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z' } as any)[m] || m)
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function BlogManager() {
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
    setForm({ slug: p.slug, title: p.title, excerpt: p.excerpt, coverImageUrl: p.coverImageUrl || '', content: p.content, authorName: p.authorName, isPublished: p.isPublished });
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
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (confirm('Na pewno usunąć ten wpis?')) { await blogApi.remove(id); load(); }
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
        <h3>{editingId ? 'Edytuj wpis' : 'Nowy wpis'}</h3>
        <input
          placeholder="Tytuł" required value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value, slug: editingId ? form.slug : slugify(e.target.value) })}
        />
        <input placeholder="adres-wpisu" required value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} />
        <textarea rows={2} placeholder="Krótki zajawka (excerpt)" required value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
        <textarea rows={8} placeholder="Treść (HTML, np. <p>...</p>)" required value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
        <input placeholder="Autor" value={form.authorName} onChange={(e) => setForm({ ...form, authorName: e.target.value })} />

        <div className="image-upload-row">
          <label className="image-upload-btn">
            {uploading ? 'Wgrywanie...' : '📤 Zdjęcie okładki'}
            <input type="file" accept="image/*" hidden disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCover(f); }} />
          </label>
          {form.coverImageUrl && <img src={form.coverImageUrl} className="image-upload-preview" alt="" />}
        </div>

        <label className="visibility-toggle">
          <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
          Opublikowany
        </label>

        <div className="form-row">
          <Button type="submit" disabled={saving}>{saving ? 'Zapisywanie...' : editingId ? 'Zapisz zmiany' : 'Dodaj wpis'}</Button>
          {editingId && <Button type="button" variant="secondary" onClick={resetForm}>Anuluj</Button>}
        </div>
      </form>

      <table className="admin-table">
        <thead><tr><th>Tytuł</th><th>Status</th><th>Data</th><th></th></tr></thead>
        <tbody>
          {posts.map((p) => (
            <tr key={p.id}>
              <td>{p.title}</td>
              <td>{p.isPublished ? 'Opublikowany' : 'Szkic'}</td>
              <td>{p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('pl-PL') : '—'}</td>
              <td className="table-actions">
                <button onClick={() => editPost(p)}>Edytuj</button>
                <button className="danger" onClick={() => remove(p.id)}>Usuń</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
