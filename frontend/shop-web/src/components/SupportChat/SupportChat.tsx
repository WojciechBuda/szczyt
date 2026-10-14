import { useT } from '../../i18n';
import { useEffect, useRef, useState } from 'react';
import { chatApi } from '../../api/chatApi';
import { ChatMessage, Faq } from '../../types/Chat';
import './SupportChat.css';

export function SupportChat() {
  const { t } = useT();
  const [available, setAvailable] = useState(false);
  const [welcome, setWelcome] = useState('');
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatApi.getPublicSettings()
      .then((s) => { setAvailable(s.enabled); setWelcome(s.welcomeMessage); })
      .catch(() => setAvailable(false));
    chatApi.listVisibleFaqs().then(setFaqs).catch(() => setFaqs([]));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setInput('');
    setSending(true);
    try {
      const reply = await chatApi.sendMessage(nextMessages);
      setMessages((m) => [...m, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: t('chat.error') }]);
    } finally {
      setSending(false);
    }
  };

  if (!available) return null;

  return (
    <div className="support-chat">
      {open && (
        <div className="support-chat-panel">
          <div className="support-chat-header">
            <span>{t('chat.title')}</span>
            <button className="support-chat-close" onClick={() => setOpen(false)} aria-label={t('chat.close')}>✕</button>
          </div>

          <div className="support-chat-messages" ref={scrollRef}>
            {messages.length === 0 && (
              <div className="support-chat-bubble support-chat-bubble-assistant">{welcome}</div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`support-chat-bubble support-chat-bubble-${m.role}`}>{m.content}</div>
            ))}
            {sending && (
              <div className="support-chat-bubble support-chat-bubble-assistant support-chat-typing">
                <span /><span /><span />
              </div>
            )}

            {messages.length === 0 && faqs.length > 0 && (
              <div className="support-chat-suggestions">
                {faqs.slice(0, 4).map((f) => (
                  <button key={f.id} className="support-chat-suggestion" onClick={() => send(f.question)}>
                    {f.question}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            className="support-chat-input-row"
            onSubmit={(e) => { e.preventDefault(); send(input); }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('chat.placeholder')}
              disabled={sending}
            />
            <button type="submit" disabled={sending || !input.trim()} aria-label={t('chat.send')}>➤</button>
          </form>
        </div>
      )}

      <button className="support-chat-bubble-btn" onClick={() => setOpen((v) => !v)} aria-label={t('chat.open')}>
        {open ? '✕' : '💬'}
      </button>
    </div>
  );
}
