import { create } from 'zustand';
import { pl, TranslationKey } from './pl';
import { en } from './en';
import { adminEn } from './adminEn';

export type Lang = 'pl' | 'en';
export const LANGS: Lang[] = ['pl', 'en'];

const dictionaries: Record<Lang, Record<TranslationKey, string>> = { pl, en };
const STORAGE_KEY = 'szczyt.lang';

function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'pl' || saved === 'en') return saved;
  } catch { /* storage unavailable */ }
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('pl') ? 'pl' : 'en';
}

interface LangState { lang: Lang; setLang: (lang: Lang) => void }

export const useLangStore = create<LangState>((set) => ({
  lang: detectLang(),
  setLang: (lang) => {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* ignore */ }
    set({ lang });
  },
}));

type Vars = Record<string, string | number>;

function translate(lang: Lang, key: TranslationKey, vars?: Vars): string {
  let text = dictionaries[lang][key] ?? pl[key];
  if (vars) for (const [k, v] of Object.entries(vars)) text = text.split(`{${k}}`).join(String(v));
  return text;
}

/** Translate outside React components (API error messages etc.). */
export function t(key: TranslationKey, vars?: Vars): string {
  return translate(useLangStore.getState().lang, key, vars);
}

/** Admin panel: the Polish text is its own key; English comes from adminEn, missing entries stay Polish. */
function translateAdmin(lang: Lang, pl: string): string {
  return lang === 'en' ? adminEn[pl] ?? pl : pl;
}

/** Hook: re-renders on language change. */
export function useT() {
  const lang = useLangStore((s) => s.lang);
  return {
    lang,
    t: (key: TranslationKey, vars?: Vars) => translate(lang, key, vars),
    /** Admin panel text, e.g. ta('Zapisz zmiany'). */
    ta: (plText: string) => translateAdmin(lang, plText),
    /** Pick the English text when available, else fall back to the Polish original. */
    pick: (plText: string, enText?: string | null) => (lang === 'en' && enText ? enText : plText),
    locale: lang === 'pl' ? 'pl-PL' : 'en-GB',
  };
}
