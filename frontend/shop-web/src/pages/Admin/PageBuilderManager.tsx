import { useEffect, useRef, useState } from 'react';
import { pageBuilderApi } from '../../api/pageBuilderApi';
import { storageApi } from '../../api/storageApi';
import { Page, PageBlock, BlockType } from '../../types/PageBuilder';
import { Button } from '../../components/Button/Button';
import './PageBuilderBlog.css';

const typeLabels: Record<BlockType, string> = {
  hero: 'Hero (duży baner na górze)',
  rich_text: 'Tekst (dowolna treść HTML)',
  gallery: 'Galeria zdjęć',
  categories: 'Kategorie produktów',
  featured_products: 'Polecane produkty',
  banner: 'Baner promocyjny',
};

export function PageBuilderManager() {
  const [pages, setPages] = useState<Page[]>([]);
  const [activePage, setActivePage] = useState<Page | null>(null);
  const [blocks, setBlocks] = useState<PageBlock[]>([]);
  const [newPageSlug, setNewPageSlug] = useState('');
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newBlockType, setNewBlockType] = useState<BlockType>('rich_text');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const dragIndex = useRef<number | null>(null);

  const loadPages = () => pageBuilderApi.listPages().then((list) => {
    setPages(list);
    if (!activePage && list.length > 0) selectPage(list[0]);
  });

  const selectPage = (page: Page) => {
    setActivePage(page);
    pageBuilderApi.getAllBlocks(page.id).then(setBlocks);
  };

  useEffect(() => { loadPages(); }, []);

  const createPage = async () => {
    if (!newPageSlug.trim() || !newPageTitle.trim()) return;
    const page = await pageBuilderApi.createPage(newPageSlug.trim(), newPageTitle.trim());
    setNewPageSlug(''); setNewPageTitle('');
    await loadPages();
    selectPage(page);
  };

  const deletePage = async () => {
    if (!activePage || activePage.isSystem) return;
    if (!confirm(`Usunąć stronę "${activePage.title}" wraz z jej blokami?`)) return;
    await pageBuilderApi.deletePage(activePage.id);
    setActivePage(null);
    setBlocks([]);
    loadPages();
  };

  const addBlock = async () => {
    if (!activePage) return;
    const block = await pageBuilderApi.addBlock(activePage.id, newBlockType, blocks.length + 1);
    setBlocks((b) => [...b, block]);
  };

  const removeBlock = async (id: number) => {
    await pageBuilderApi.deleteBlock(id);
    setBlocks((b) => b.filter((x) => x.id !== id));
  };

  const updateContent = (id: number, field: string, value: string) => {
    setBlocks((b) => b.map((x) => (x.id === id ? { ...x, content: { ...x.content, [field]: value } } : x)));
  };

  const updateStyle = (id: number, field: string, value: string) => {
    setBlocks((b) => b.map((x) => (x.id === id ? { ...x, style: { ...x.style, [field]: value || null } } : x)));
  };

  const updateGallery = (id: number, images: { url: string; caption?: string }[]) => {
    setBlocks((b) => b.map((x) => (x.id === id ? { ...x, content: { ...x.content, images } } : x)));
  };

  const addGalleryImage = async (block: PageBlock, file: File) => {
    const url = await storageApi.uploadImage(file);
    updateGallery(block.id, [...(block.content.images || []), { url, caption: '' }]);
  };

  const toggleVisible = (id: number, value: boolean) => {
    setBlocks((b) => b.map((x) => (x.id === id ? { ...x, isVisible: value } : x)));
  };

  const uploadBg = async (id: number, file: File) => {
    const url = await storageApi.uploadImage(file);
    updateStyle(id, 'backgroundImageUrl', url);
  };

  const handleDragStart = (i: number) => { dragIndex.current = i; };
  const handleDrop = (i: number) => {
    const from = dragIndex.current;
    if (from === null || from === i) return;
    setBlocks((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(i, 0, moved);
      return next.map((b, idx) => ({ ...b, order: idx + 1 }));
    });
    dragIndex.current = null;
  };

  const save = async () => {
    setSaving(true);
    try {
      await pageBuilderApi.saveBlocks(blocks);
      if (activePage) selectPage(activePage);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-builder-manager">
      <div className="pb-page-picker">
        <label>Strona</label>
        <select
          value={activePage?.id || ''}
          onChange={(e) => { const p = pages.find((x) => x.id === Number(e.target.value)); if (p) selectPage(p); }}
        >
          {pages.map((p) => <option key={p.id} value={p.id}>{p.title} ({p.slug === 'home' ? '/' : `/p/${p.slug}`})</option>)}
        </select>
        {activePage && !activePage.isSystem && (
          <button type="button" className="remove-link-btn" onClick={deletePage} title="Usuń stronę">✕</button>
        )}
      </div>

      <div className="pb-new-page">
        <input placeholder="adres-strony" value={newPageSlug} onChange={(e) => setNewPageSlug(e.target.value.trim().toLowerCase().replace(/\s+/g, '-'))} />
        <input placeholder="Tytuł strony" value={newPageTitle} onChange={(e) => setNewPageTitle(e.target.value)} />
        <Button type="button" variant="secondary" onClick={createPage}>+ Nowa strona</Button>
      </div>
      {activePage && !activePage.isSystem && (
        <p className="pb-hint">Ta strona będzie dostępna pod adresem /p/{activePage.slug}. Podlinkuj ją z przycisku w bloku Hero/Baner (pole „Link przycisku”) lub z bloku tekstowego.</p>
      )}

      {activePage && (
        <>
          <div className="pb-blocks">
            {[...blocks].sort((a, b) => a.order - b.order).map((block, i) => (
              <div key={block.id} className="pb-block" draggable onDragStart={() => handleDragStart(i)} onDragOver={(e) => e.preventDefault()} onDrop={() => handleDrop(i)}>
                <div className="pb-block-header">
                  <span className="drag-handle">⠿</span>
                  <span className="layout-tile-type">{typeLabels[block.type]}</span>
                  <label className="visibility-toggle">
                    <input type="checkbox" checked={block.isVisible} onChange={(e) => toggleVisible(block.id, e.target.checked)} />
                    Widoczny
                  </label>
                  <button type="button" className="remove-link-btn" onClick={() => removeBlock(block.id)}>✕</button>
                </div>

                {/* Pola treści — zależne od typu bloku */}
                {(block.type === 'hero' || block.type === 'banner') && (
                  <>
                    <input placeholder="Tytuł" value={block.content.title || ''} onChange={(e) => updateContent(block.id, 'title', e.target.value)} />
                    <input placeholder="Podtytuł" value={block.content.subtitle || ''} onChange={(e) => updateContent(block.id, 'subtitle', e.target.value)} />
                    <div className="layout-tile-row">
                      <input placeholder="Tekst przycisku" value={block.content.buttonText || ''} onChange={(e) => updateContent(block.id, 'buttonText', e.target.value)} />
                      <input placeholder="Link przycisku (np. /products)" value={block.content.buttonLink || ''} onChange={(e) => updateContent(block.id, 'buttonLink', e.target.value)} />
                    </div>
                  </>
                )}
                {(block.type === 'categories' || block.type === 'featured_products') && (
                  <>
                    <input placeholder="Tytuł sekcji" value={block.content.title || ''} onChange={(e) => updateContent(block.id, 'title', e.target.value)} />
                    <input placeholder="Podtytuł" value={block.content.subtitle || ''} onChange={(e) => updateContent(block.id, 'subtitle', e.target.value)} />
                  </>
                )}
                {block.type === 'rich_text' && (
                  <textarea rows={4} placeholder="Treść HTML (np. <p>...</p>)" value={block.content.html || ''} onChange={(e) => updateContent(block.id, 'html', e.target.value)} />
                )}
                {block.type === 'gallery' && (
                  <div className="pb-gallery-editor">
                    {(block.content.images || []).map((img: { url: string; caption?: string }, idx: number) => (
                      <div className="pb-gallery-item" key={idx}>
                        <img src={img.url} alt="" />
                        <input
                          placeholder="Podpis"
                          value={img.caption || ''}
                          onChange={(e) => updateGallery(block.id, (block.content.images || []).map((x: { url: string; caption?: string }, j: number) => (j === idx ? { ...x, caption: e.target.value } : x)))}
                        />
                        <button type="button" className="remove-link-btn" onClick={() => updateGallery(block.id, (block.content.images || []).filter((_: unknown, j: number) => j !== idx))}>✕</button>
                      </div>
                    ))}
                    <label className="image-upload-btn">
                      📤 Dodaj zdjęcie
                      <input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) addGalleryImage(block, f); e.target.value = ''; }} />
                    </label>
                  </div>
                )}

                {/* Wspólny styl — działa identycznie dla każdego typu bloku */}
                <div className="pb-style-row">
                  <div className="footer-field">
                    <label>Kolor tła</label>
                    <input type="color" value={block.style.backgroundColor || '#ffffff'} onChange={(e) => updateStyle(block.id, 'backgroundColor', e.target.value)} />
                  </div>
                  <div className="footer-field">
                    <label>Kolor tekstu</label>
                    <input type="color" value={block.style.textColor || '#000000'} onChange={(e) => updateStyle(block.id, 'textColor', e.target.value)} />
                  </div>
                  <div className="footer-field">
                    <label>Odstępy</label>
                    <select value={block.style.paddingSize || 'md'} onChange={(e) => updateStyle(block.id, 'paddingSize', e.target.value)}>
                      <option value="sm">Małe</option>
                      <option value="md">Średnie</option>
                      <option value="lg">Duże</option>
                    </select>
                  </div>
                </div>
                <div className="footer-field">
                  <label>Czcionka (nazwa CSS, opcjonalnie)</label>
                  <input placeholder="np. Georgia, serif" value={block.style.fontFamily || ''} onChange={(e) => updateStyle(block.id, 'fontFamily', e.target.value)} />
                </div>
                <div className="image-upload-row">
                  <label className="image-upload-btn">
                    📤 Wgraj tło
                    <input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadBg(block.id, f); }} />
                  </label>
                  <input placeholder="albo wklej URL zdjęcia tła" value={block.style.backgroundImageUrl || ''} onChange={(e) => updateStyle(block.id, 'backgroundImageUrl', e.target.value)} />
                  {block.style.backgroundImageUrl && <img src={block.style.backgroundImageUrl} className="image-upload-preview" alt="" />}
                </div>
              </div>
            ))}
          </div>

          <div className="pb-add-block">
            <select value={newBlockType} onChange={(e) => setNewBlockType(e.target.value as BlockType)}>
              {Object.entries(typeLabels).map(([type, label]) => <option key={type} value={type}>{label}</option>)}
            </select>
            <Button type="button" variant="secondary" onClick={addBlock}>+ Dodaj blok</Button>
          </div>

          <Button onClick={save} disabled={saving}>{saving ? 'Zapisywanie...' : saved ? 'Zapisano!' : 'Zapisz stronę'}</Button>
        </>
      )}
    </div>
  );
}
