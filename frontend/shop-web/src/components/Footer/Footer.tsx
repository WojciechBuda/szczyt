import { useT } from '../../i18n';
import { useEffect, useState } from 'react';
import { footerApi } from '../../api/footerApi';
import { Footer as FooterData } from '../../types/Footer';
import './Footer.css';

const platformIcons: Record<string, string> = {
  facebook: '📘',
  instagram: '📷',
  youtube: '▶️',
  twitter: '🐦',
  x: '🐦',
  linkedin: '💼',
  tiktok: '🎵',
  strava: '🏃',
  pinterest: '📌',
};

function iconFor(platform: string) {
  return platformIcons[platform.trim().toLowerCase()] || '🔗';
}

export function Footer() {
  const [footer, setFooter] = useState<FooterData | null>(null);
  const { pick } = useT();

  useEffect(() => {
    footerApi.get().then(setFooter).catch(() => setFooter(null));
  }, []);

  if (!footer) return null;

  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <p className="site-footer-text">{pick(footer.footerText, footer.footerTextEn)}</p>

        {footer.socialLinks.length > 0 && (
          <div className="site-footer-social">
            {footer.socialLinks.map((link) => (
              <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" title={link.platform}>
                <span aria-hidden="true">{iconFor(link.platform)}</span>
                <span className="sr-only">{link.platform}</span>
              </a>
            ))}
          </div>
        )}

        {footer.contactEmail && (
          <a className="site-footer-contact" href={`mailto:${footer.contactEmail}`}>{footer.contactEmail}</a>
        )}

        <p className="site-footer-copy">© {new Date().getFullYear()} Szczyt</p>
      </div>
    </footer>
  );
}
