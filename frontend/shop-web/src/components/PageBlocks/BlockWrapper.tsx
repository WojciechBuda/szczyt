import { ReactNode } from 'react';
import { BlockStyle } from '../../types/PageBuilder';

const PADDING: Record<string, string> = {
  sm: '2rem 1.25rem',
  md: 'clamp(2.25rem, 6vw, 3.5rem) 1.25rem',
  lg: 'clamp(3rem, 9vw, 5rem) 1.25rem',
};

/**
 * Nakłada wspólną "kopertę" stylu (tło/kolor/czcionka) na dowolny typ bloku —
 * to jest generalizacja, dzięki której admin ustawia te same rzeczy niezależnie
 * od tego, czy edytuje hero, galerię czy baner.
 */
export function BlockWrapper({ style, children }: { style: BlockStyle; children: ReactNode }) {
  const hasImage = !!style.backgroundImageUrl;

  const wrapperStyle: React.CSSProperties = {
    backgroundColor: style.backgroundColor || undefined,
    backgroundImage: hasImage
      ? `linear-gradient(rgba(20,25,20,0.5), rgba(20,25,20,0.5)), url(${style.backgroundImageUrl})`
      : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    color: style.textColor || undefined,
    fontFamily: style.fontFamily || undefined,
    padding: PADDING[style.paddingSize || 'md'],
  };

  return <section style={wrapperStyle}>{children}</section>;
}
