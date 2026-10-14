import { useEffect, useState } from 'react';
import { chatApi } from '../../api/chatApi';
import { Faq, ChatbotSettings } from '../../types/Chat';
import { Button } from '../../components/Button/Button';

let tempIdCounter = -1;

export function ChatbotManager() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [settings, setSettings] = useState<ChatbotSettings | null>(null);
  const [savingFaqs, setSavingFaqs] = useState(false);
  const [savedFaqs, setSavedFaqs] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savedSettings, setSavedSettings] = useState(false);

  useEffect(() => {
    chatApi.listAllFaqs().then(setFaqs);
    chatApi.getSettings().then(setSettings);
  }, []);

  const updateFaq = (index: number, field: 'question' | 'answer' | 'isVisible', value: string | boolean) => {
    setFaqs((f) => f.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const addFaq = () => {
    setFaqs((f) => [...f, { id: tempIdCounter--, question: '', answer: '', order: f.length + 1, isVisible: true }]);
  };

  const removeFaq = (index: number) => setFaqs((f) => f.filter((_, i) => i !== index));

  const moveFaq = (index: number, dir: -1 | 1) => {
    setFaqs((f) => {
      const target = index + dir;
      if (target < 0 || target >= f.length) return f;
      const next = [...f];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((item, i) => ({ ...item, order: i + 1 }));
    });
  };

  const saveFaqs = async () => {
    setSavingFaqs(true);
    try {
      await chatApi.saveFaqs(faqs.map((f, i) => ({ ...f, order: i + 1 })));
      const fresh = await chatApi.listAllFaqs();
      setFaqs(fresh);
      setSavedFaqs(true);
      setTimeout(() => setSavedFaqs(false), 1800);
    } catch (err: any) {
      alert(`Nie udało się zapisać zmian: ${err?.message || 'nieznany błąd'}`);
    } finally {
      setSavingFaqs(false);
    }
  };

  const saveSettings = async () => {
    if (!settings) return;
    setSavingSettings(true);
    try {
      await chatApi.updateSettings(settings);
      setSavedSettings(true);
      setTimeout(() => setSavedSettings(false), 1800);
    } catch (err: any) {
      alert(`Nie udało się zapisać zmian: ${err?.message || 'nieznany błąd'}`);
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="chatbot-manager">
      <section className="chatbot-settings-section">
        <h3>Ustawienia asystenta AI</h3>
        {!settings ? (
          <p className="empty-msg">Ładowanie...</p>
        ) : (
          <div className="footer-manager-form">
            <label className="visibility-toggle">
              <input type="checkbox" checked={settings.enabled} onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })} />
              Czat włączony (widoczny dla klientów)
            </label>

            <label>Wiadomość powitalna</label>
            <input
              value={settings.welcomeMessage}
              onChange={(e) => setSettings({ ...settings, welcomeMessage: e.target.value })}
              placeholder="Cześć! W czym mogę pomóc?"
            />

            <div className="form-row">
              <div className="footer-field">
                <label>Dostawca AI</label>
                <select value={settings.provider} onChange={(e) => setSettings({ ...settings, provider: e.target.value as ChatbotSettings['provider'] })}>
                  <option value="anthropic">Anthropic (Claude)</option>
                  <option value="openai">OpenAI</option>
                </select>
              </div>
              <div className="footer-field">
                <label>Model</label>
                <input value={settings.model} onChange={(e) => setSettings({ ...settings, model: e.target.value })} placeholder="claude-3-5-haiku-20241022" />
              </div>
            </div>

            <label>Instrukcje bota (system prompt)</label>
            <textarea
              rows={6}
              value={settings.systemPrompt}
              onChange={(e) => setSettings({ ...settings, systemPrompt: e.target.value })}
              placeholder="Opisz, jak bot ma się zachowywać, jakim tonem odpowiadać, czego unikać..."
            />
            <p className="chatbot-hint">Lista FAQ poniżej jest automatycznie dołączana jako kontekst wiedzy przy każdej rozmowie — nie musisz jej wklejać tutaj.</p>

            <Button onClick={saveSettings} disabled={savingSettings}>
              {savingSettings ? 'Zapisywanie...' : savedSettings ? 'Zapisano!' : 'Zapisz ustawienia bota'}
            </Button>
          </div>
        )}
      </section>

      <section className="chatbot-faq-section">
        <h3>Baza FAQ (kontekst bota)</h3>
        <p className="layout-hint">Te pytania i odpowiedzi bot wykorzystuje do odpowiadania klientom. Widoczne pytania pojawiają się też jako podpowiedzi w oknie czatu.</p>

        <div className="faq-list">
          {faqs.map((faq, i) => (
            <div key={faq.id} className="faq-row">
              <div className="social-link-order">
                <button type="button" onClick={() => moveFaq(i, -1)} disabled={i === 0}>↑</button>
                <button type="button" onClick={() => moveFaq(i, 1)} disabled={i === faqs.length - 1}>↓</button>
              </div>
              <div className="faq-row-fields">
                <input
                  value={faq.question}
                  onChange={(e) => updateFaq(i, 'question', e.target.value)}
                  placeholder="Pytanie"
                />
                <textarea
                  rows={2}
                  value={faq.answer}
                  onChange={(e) => updateFaq(i, 'answer', e.target.value)}
                  placeholder="Odpowiedź"
                />
              </div>
              <label className="visibility-toggle">
                <input type="checkbox" checked={faq.isVisible} onChange={(e) => updateFaq(i, 'isVisible', e.target.checked)} />
                Widoczne
              </label>
              <button type="button" className="remove-link-btn" onClick={() => removeFaq(i)}>✕</button>
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={addFaq}>+ Dodaj pytanie</Button>
        </div>

        <Button onClick={saveFaqs} disabled={savingFaqs}>
          {savingFaqs ? 'Zapisywanie...' : savedFaqs ? 'Zapisano!' : 'Zapisz FAQ'}
        </Button>
      </section>
    </div>
  );
}
