import { useT } from '../../i18n';
import { FormEvent, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/Button/Button';
import './AuthForm.css';

export function Register() {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();
  const { t } = useT();

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const res = await authApi.register(form);
      if (res.needsEmailConfirmation) {
        setAwaitingConfirmation(true);
      } else {
        setUser(res.user);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.message || t('register.failed'));
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setError(null);
    setInfo(null);
    try {
      await authApi.resendConfirmation(form.email);
      setInfo(t('register.resent'));
    } catch (err: any) {
      setError(err.message || t('register.resendFailed'));
    }
  };

  if (awaitingConfirmation) {
    return (
      <div className="auth-page">
        <div className="auth-form">
          <h1>{t('register.checkInbox')}</h1>
          <p>{t('register.sentTo', { email: form.email })}</p>
          {error && <div className="auth-error">{error}</div>}
          {info && <div className="auth-info">{info}</div>}
          <Button type="button" variant="secondary" onClick={resend}>{t('register.resend')}</Button>
          <p className="auth-switch"><Link to="/login">{t('register.goLogin')}</Link></p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>{t('register.title')}</h1>
        {error && <div className="auth-error">{error}</div>}
        <label>{t('auth.firstName')}</label>
        <input required value={form.firstName} onChange={update('firstName')} />
        <label>{t('auth.lastName')}</label>
        <input required value={form.lastName} onChange={update('lastName')} />
        <label>{t('auth.email')}</label>
        <input type="email" required value={form.email} onChange={update('email')} />
        <label>{t('auth.password')}</label>
        <input type="password" required minLength={6} value={form.password} onChange={update('password')} />
        <Button type="submit" disabled={loading}>{loading ? t('register.submitting') : t('register.submit')}</Button>
        <p className="auth-switch">{t('register.haveAccount')} <Link to="/login">{t('login.submit')}</Link></p>
      </form>
    </div>
  );
}
