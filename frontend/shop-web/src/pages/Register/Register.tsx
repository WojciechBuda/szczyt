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
      setError(err.message || 'Nie udało się utworzyć konta.');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setError(null);
    setInfo(null);
    try {
      await authApi.resendConfirmation(form.email);
      setInfo('Wysłaliśmy wiadomość ponownie. Sprawdź też folder spam.');
    } catch (err: any) {
      setError(err.message || 'Nie udało się wysłać wiadomości ponownie.');
    }
  };

  if (awaitingConfirmation) {
    return (
      <div className="auth-page">
        <div className="auth-form">
          <h1>Sprawdź skrzynkę</h1>
          <p>Wysłaliśmy link potwierdzający na adres <strong>{form.email}</strong>. Kliknij go, aby aktywować konto.</p>
          {error && <div className="auth-error">{error}</div>}
          {info && <div className="auth-info">{info}</div>}
          <Button type="button" variant="secondary" onClick={resend}>Wyślij ponownie</Button>
          <p className="auth-switch"><Link to="/login">Przejdź do logowania</Link></p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h1>Załóż konto</h1>
        {error && <div className="auth-error">{error}</div>}
        <label>Imię</label>
        <input required value={form.firstName} onChange={update('firstName')} />
        <label>Nazwisko</label>
        <input required value={form.lastName} onChange={update('lastName')} />
        <label>E-mail</label>
        <input type="email" required value={form.email} onChange={update('email')} />
        <label>Hasło</label>
        <input type="password" required minLength={6} value={form.password} onChange={update('password')} />
        <Button type="submit" disabled={loading}>{loading ? 'Tworzenie konta...' : 'Zarejestruj się'}</Button>
        <p className="auth-switch">Masz już konto? <Link to="/login">Zaloguj się</Link></p>
      </form>
    </div>
  );
}
