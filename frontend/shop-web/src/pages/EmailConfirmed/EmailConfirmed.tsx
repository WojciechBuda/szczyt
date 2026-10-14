import { useT } from '../../i18n';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

/**
 * Landing page for the link in the confirmation e-mail (emailRedirectTo).
 * supabase-js reads the tokens from the URL on load and starts the session,
 * so by the time the profile is available the user is already signed in.
 */
export function EmailConfirmed() {
  const { user, initialized } = useAuthStore();
  const { t } = useT();

  return (
    <div className="page-message">
      <h1>{t('confirmed.title')}</h1>
      {!initialized && <p>{t('confirmed.finishing')}</p>}
      {initialized && user && <p>{t('confirmed.welcome', { name: user.firstName || user.email })}</p>}
      {initialized && !user && <p>{t('confirmed.active')}</p>}
      <p>
        {user
          ? <Link to="/products" className="btn btn-primary">{t('confirmed.shop')}</Link>
          : <Link to="/login" className="btn btn-primary">{t('login.submit')}</Link>}
      </p>
    </div>
  );
}
