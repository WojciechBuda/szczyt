import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { authApi } from '../../api/authApi';
import './Navbar.css';

export function Navbar() {
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
          aria-label={menuOpen ? 'Zamknij menu' : 'Otwórz menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? '✕' : '☰'}
        </button>

        <div className={`navbar-collapse ${menuOpen ? 'navbar-collapse-open' : ''}`}>
          <nav className="navbar-links">
            <Link to="/products" onClick={closeMenu}>Produkty</Link>
            <Link to="/blog" onClick={closeMenu}>Blog</Link>
            {isAdmin() && <Link to="/admin" onClick={closeMenu}>Panel admina</Link>}
          </nav>

          <div className="navbar-actions">
            <Link to="/cart" className="cart-link" onClick={closeMenu}>
              🛒<span className="cart-label"> Koszyk</span> {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
            </Link>

            {user ? (
              <>
                <Link to="/account" onClick={closeMenu}>{user.firstName}</Link>
                <button className="link-btn" onClick={handleLogout}>Wyloguj</button>
              </>
            ) : (
              <>
                <Link to="/login" onClick={closeMenu}>Zaloguj</Link>
                <Link to="/register" onClick={closeMenu}>Rejestracja</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
