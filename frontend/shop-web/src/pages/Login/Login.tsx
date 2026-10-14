import { useT } from '../../i18n';
import { FormEvent, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/Button/Button';
import '../Register/AuthForm.css';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();
  const { t } = useT();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      setUser(res.user);
      navigate('/');
    } catch (err: any) {
      if (/email not confirmed/i.test(err.message || '')) {
        setError(t('login.notConfirmed'));
        setCanResend(true);
      } else {
        setError(err.message || t('login.failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      await authApi.resendConfirmation(email);
      setError(null);
      setInfo(t('login.resent'));
    } catch (err: any) {
      setError(err.message || t('login.resendFailed'));
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>{t('login.title')}</h1>
        {error && <div className="auth-error">{error}</div>}
        {info && <div className="auth-info">{info}</div>}
        {canResend && <button type="button" className="auth-link-btn" onClick={resend}>{t('login.resend')}</button>}
        <label>{t('auth.email')}</label>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <label>{t('auth.password')}</label>
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" disabled={loading}>{loading ? t('login.submitting') : t('login.submit')}</Button>
        <p className="auth-switch">{t('login.noAccount')} <Link to="/register">{t('login.signUp')}</Link></p>
      </form>
    </div>
  );
}
