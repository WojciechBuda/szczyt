import { useT, useLangStore, LANGS } from '../../i18n';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { authApi } from '../../api/authApi';
import './Navbar.css';

export function Navbar() {
  const { t, lang } = useT();
  const setLang = useLangStore((s) => s.setLang);
  const { user, logout, isAdmin } = useAuthStore();
  const totalItems = useCartStore((s) => s.totalItems());
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const location = useLocation();

  const closeMenu = () => setMenuOpen(false);

  // Close the menu after any navigation and on Escape.
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const handleLogout = async () => {
    await authApi.logout();
    logout();
    closeMenu();
    navigate('/');
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand" onClick={closeMenu}>🏔️ Szczyt</Link>

        <button
          className="navbar-toggle"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
          aria-expanded={menuOpen}
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        <div className={`navbar-collapse ${menuOpen ? 'navbar-collapse-open' : ''}`}>
          <nav className="navbar-links">
            <Link to="/products" onClick={closeMenu}>{t('nav.products')}</Link>
            <Link to="/blog" onClick={closeMenu}>{t('nav.blog')}</Link>
            {isAdmin() && <Link to="/admin" onClick={closeMenu}>{t('nav.admin')}</Link>}
          </nav>

          <div className="navbar-actions">
            <Link to="/cart" className="cart-link" onClick={closeMenu}>
              🛒<span className="cart-label"> {t('nav.cart')}</span> {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
            </Link>

            {user ? (
              <>
                <Link to="/account" onClick={closeMenu}>{user.firstName}</Link>
                <button className="link-btn" onClick={handleLogout}>{t('nav.logout')}</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={closeMenu}>{t('nav.login')}</Link>
                <Link to="/register" onClick={closeMenu}>{t('nav.register')}</Link>
              </>
            )}
            <div className="lang-switch" role="group" aria-label={t('nav.language')}>
              {LANGS.map((l) => (
                <button key={l} type="button" className={l === lang ? 'is-active' : ''} aria-pressed={l === lang} onClick={() => setLang(l)}>
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
