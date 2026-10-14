import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

/**
 * Landing page for the link in the confirmation e-mail (emailRedirectTo).
 * supabase-js reads the tokens from the URL on load and starts the session,
 * so by the time the profile is available the user is already signed in.
 */
export function EmailConfirmed() {
  const { user, initialized } = useAuthStore();

  return (
    <div className="page-message">
      <h1>Adres e-mail potwierdzony ✅</h1>
      {!initialized && <p>Kończymy logowanie…</p>}
      {initialized && user && <p>Witaj, {user.firstName || user.email}! Twoje konto jest aktywne i jesteś zalogowany.</p>}
      {initialized && !user && <p>Twoje konto jest aktywne. Zaloguj się, aby kontynuować.</p>}
      <p>
        {user
          ? <Link to="/products" className="btn btn-primary">Przejdź do sklepu</Link>
          : <Link to="/login" className="btn btn-primary">Zaloguj się</Link>}
      </p>
    </div>
  );
}
