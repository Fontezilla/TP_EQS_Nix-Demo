import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout, { PasswordField } from '../../components/AuthLayout/AuthLayout.jsx';
import { HOME } from '../../components/Navbar/links.js';
import { useAuth } from '../../context/AuthContext.jsx';

const TEST_ACCOUNTS = [
  { label: 'Comprador', email: 'tasca@exemplo.pt' },
  { label: 'Produtor', email: 'horta@exemplo.pt' }
];

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const from = location.state?.from;

  async function signIn(email, password) {
    setError('');
    setSending(true);
    try {
      const u = await login(email, password);
      // Volta à página que pediu o login; senão, vai para a página inicial do papel
      navigate(from && from !== '/' ? from : HOME[u.role], { replace: true });
    } catch (e) {
      setError(e.message);
      setSending(false);
    }
  }

  // Quem já tem sessão não precisa desta página
  if (user && !sending) return <Navigate to={HOME[user.role]} replace />;

  return (
    <AuthLayout title="Entrar" category="fruit"
      text={from?.startsWith('/auctions') ? 'Entre como comprador para licitar no leilão.' : 'Entre para encomendar, licitar ou gerir a sua exploração.'}
      footer={<>Ainda não tem conta? <Link className="text-link" to="/register">Criar conta</Link></>}>
      <form className="panel" onSubmit={(e) => { e.preventDefault(); signIn(form.email, form.password); }}>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">Email</label>
          <input id="email" type="email" className="form-control" autoComplete="email" required
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">Password</label>
          <PasswordField id="password" autoComplete="current-password"
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </div>
        {error && (
          <div className="alert alert-danger py-2 small" role="alert">
            <i className="bi bi-exclamation-circle me-1" aria-hidden="true" />{error}
          </div>
        )}
        <button type="submit" className="btn btn-primary btn-lg w-100" disabled={sending}>{sending ? 'A entrar…' : 'Entrar'}</button>

        <div className="test-accounts">
          <p className="mb-2">Contas de teste, com a password <code>password123</code>:</p>
          <div className="d-flex flex-wrap gap-2">
            {TEST_ACCOUNTS.map((a) => (
              <button key={a.email} type="button" className="btn btn-outline btn-sm" disabled={sending}
                onClick={() => signIn(a.email, 'password123')}>{a.label}</button>
            ))}
          </div>
        </div>
      </form>
    </AuthLayout>
  );
}
