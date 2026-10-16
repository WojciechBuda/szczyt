import { useState } from 'react';
import { translateToEnglish } from '../../api/translateApi';
import { useT } from '../../i18n';

interface Props {
  /** Polish source texts, keyed by whatever the caller wants back. */
  sources: () => Record<string, string>;
  /** Receives English texts under the same keys (empty strings are dropped). */
  onResult: (translations: Record<string, string>) => void;
  disabled?: boolean;
}

/** "Przetłumacz na EN" — fills the English fields of an admin form; the admin can still edit the result. */
export function TranslateButton({ sources, onResult, disabled }: Props) {
  const { ta } = useT();
  const [busy, setBusy] = useState(false);

  const run = async () => {
    const texts = sources();
    if (!Object.values(texts).some((v) => v && v.trim())) {
      alert(ta('Najpierw wpisz tekst po polsku.'));
      return;
    }
    setBusy(true);
    try {
      const result = await translateToEnglish(texts);
      onResult(Object.fromEntries(Object.entries(result).filter(([, v]) => v)));
    } catch (err: any) {
      alert(`${ta('Nie udało się przetłumaczyć:')} ${err?.message || ta('nieznany błąd')}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button type="button" className="translate-btn" onClick={run} disabled={busy || disabled}>
      {busy ? ta('Tłumaczenie...') : `🌐 ${ta('Przetłumacz na EN')}`}
    </button>
  );
}
