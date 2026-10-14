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
        setError('Adres e-mail nie został jeszcze potwierdzony. Kliknij link z wiadomości od nas albo wyślij ją ponownie.');
        setCanResend(true);
      } else {
        setError(err.message || 'Nie udało się zalogować.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      await authApi.resendConfirmation(email);
      setError(null);
      setInfo('Wysłaliśmy link potwierdzający ponownie.');
    } catch (err: any) {
      setError(err.message || 'Nie udało się wysłać wiadomości.');
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Zaloguj się</h1>
        {error && <div className="auth-error">{error}</div>}
        {info && <div className="auth-info">{info}</div>}
        {canResend && <button type="button" className="auth-link-btn" onClick={resend}>Wyślij link ponownie</button>}
        <label>E-mail</label>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <label>Hasło</label>
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        <Button type="submit" disabled={loading}>{loading ? 'Logowanie...' : 'Zaloguj się'}</Button>
        <p className="auth-switch">Nie masz konta? <Link to="/register">Zarejestruj się</Link></p>
      </form>
    </div>
  );
}
