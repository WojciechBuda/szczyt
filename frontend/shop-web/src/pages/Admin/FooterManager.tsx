import { useEffect, useState } from 'react';
import { footerApi } from '../../api/footerApi';
import { SocialLink } from '../../types/Footer';
import { Button } from '../../components/Button/Button';
import { useT } from '../../i18n';
import { TranslateButton } from '../../components/TranslateButton/TranslateButton';

const emptyForm = { footerText: '', footerTextEn: '', contactEmail: '', socialLinks: [] as SocialLink[] };

export function FooterManager() {
  const { ta } = useT();
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    footerApi.getAdmin().then((data) =>
      setForm({
        footerText: data.footerText,
        footerTextEn: data.footerTextEn || '',
        contactEmail: data.contactEmail || '',
        socialLinks: [...data.socialLinks].sort((a, b) => a.order - b.order),
      })
    );
  }, []);

  const updateLink = (index: number, field: 'platform' | 'url' | 'isVisible', value: string | boolean) => {
    setForm((f) => ({
      ...f,
      socialLinks: f.socialLinks.map((l, i) => (i === index ? { ...l, [field]: value } : l)),
    }));
  };

  const addLink = () =>
    setForm((f) => ({
      ...f,
      socialLinks: [...f.socialLinks, { id: 0, platform: 'Facebook', url: '', order: f.socialLinks.length + 1, isVisible: true }],
    }));

  const removeLink = (index: number) =>
    setForm((f) => ({ ...f, socialLinks: f.socialLinks.filter((_, i) => i !== index) }));

  const moveLink = (index: number, dir: -1 | 1) => {
    setForm((f) => {
      const target = index + dir;
      if (target < 0 || target >= f.socialLinks.length) return f;
      const next = [...f.socialLinks];
      [next[index], next[target]] = [next[target], next[index]];
      return { ...f, socialLinks: next.map((l, i) => ({ ...l, order: i + 1 })) };
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        footerText: form.footerText,
        footerTextEn: form.footerTextEn || null,
        contactEmail: form.contactEmail || null,
        socialLinks: form.socialLinks.map((l, i) => ({ ...l, order: i + 1 })),
      };
      await footerApi.update(payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } catch (err: any) {
      alert(`${ta('Nie udało się zapisać zmian:')} ${err?.message || ta('nieznany błąd')}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="footer-manager">
      <p className="layout-hint">{ta('Treść widoczna w stopce na dole każdej strony sklepu.')}</p>

      <div className="footer-manager-form">
        <label>{ta('Tekst stopki')}</label>
        <textarea
          rows={3}
          value={form.footerText}
          onChange={(e) => setForm({ ...form, footerText: e.target.value })}
          placeholder={ta('Krótki opis sklepu widoczny w stopce')}
        />

        <label>{ta('Tekst stopki (English)')}</label>
        <textarea
          rows={3}
          value={form.footerTextEn}
          onChange={(e) => setForm({ ...form, footerTextEn: e.target.value })}
          placeholder="Shown instead of the Polish text when the visitor picks EN"
        />
        <TranslateButton
          sources={() => ({ text: form.footerText })}
          onResult={(r) => setForm((f) => ({ ...f, footerTextEn: r.text ?? f.footerTextEn }))}
        />

        <label>{ta('E-mail kontaktowy')}</label>
        <input
          value={form.contactEmail}
          onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
          placeholder="kontakt@szczyt.pl"
        />

        <label>{ta('Media społecznościowe')}</label>
        <div className="social-links-list">
          {form.socialLinks.map((link, i) => (
            <div key={i} className="social-link-row">
              <div className="social-link-order">
                <button type="button" onClick={() => moveLink(i, -1)} disabled={i === 0}>↑</button>
                <button type="button" onClick={() => moveLink(i, 1)} disabled={i === form.socialLinks.length - 1}>↓</button>
              </div>
              <input
                className="social-link-platform"
                value={link.platform}
                onChange={(e) => updateLink(i, 'platform', e.target.value)}
                placeholder={ta('np. Instagram')}
              />
              <input
                className="social-link-url"
                value={link.url}
                onChange={(e) => updateLink(i, 'url', e.target.value)}
                placeholder="https://..."
              />
              <label className="visibility-toggle">
                <input
                  type="checkbox"
                  checked={link.isVisible}
                  onChange={(e) => updateLink(i, 'isVisible', e.target.checked)}
                />
                {ta('Widoczny')}
              </label>
              <button type="button" className="remove-link-btn" onClick={() => removeLink(i)}>✕</button>
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={addLink}>{ta('+ Dodaj link')}</Button>
        </div>

        <Button onClick={save} disabled={saving}>
          {saving ? ta('Zapisywanie...') : saved ? ta('Zapisano!') : ta('Zapisz stopkę')}
        </Button>
      </div>
    </div>
  );
}
