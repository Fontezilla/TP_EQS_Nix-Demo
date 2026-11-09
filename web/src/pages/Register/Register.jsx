import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import AuthLayout, { PasswordField } from '../../components/AuthLayout/AuthLayout.jsx';
import { HOME } from '../../components/Navbar/links.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { MUNICIPALITIES } from '../../utils/format.js';

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ role: 'buyer', name: '', email: '', password: '', city: '', address: '', description: '' });
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const isProducer = form.role === 'producer';
  const shortPassword = form.password.length > 0 && form.password.length < 8;

  const change = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    if (form.password.length < 8) return;
    setError('');
    setSending(true);
    try {
      const { role, name, email, password, city, address, description } = form;
      const u = await register({ role, name, email, password, ...(isProducer && { producer: { city, address, description } }) });
      navigate(HOME[u.role], { replace: true });
    } catch (err) {
      setError(err.message);
      setSending(false);
    }
  }

  // Quem já tem sessão não precisa desta página
  if (user && !sending) return <Navigate to={HOME[user.role]} replace />;

  return (
    <AuthLayout title="Criar conta" category="vegetables"
      text="Compre diretamente a quem produz no Alto Minho, ou venda aqui o que produz."
      footer={<>Já tem conta? <Link className="text-link" to="/login">Entrar</Link></>}>
      <form className="panel" onSubmit={submit}>
        <fieldset className="mb-4">
          <legend className="form-label">Como vai usar o mercado?</legend>
          <div className="role-choice">
            <label>
              <input type="radio" name="role" value="buyer" checked={!isProducer} onChange={change('role')} />
              <i className="bi bi-basket" aria-hidden="true" /><b>Quero comprar</b><small>Encomendar e licitar nos leilões.</small>
            </label>
            <label>
              <input type="radio" name="role" value="producer" checked={isProducer} onChange={change('role')} />
              <i className="bi bi-flower1" aria-hidden="true" /><b>Quero vender</b><small>Publicar produtos e organizar leilões.</small>
            </label>
          </div>
        </fieldset>

        <div className="mb-3">
          <label htmlFor="name" className="form-label">{isProducer ? 'Nome da exploração' : 'O seu nome'}</label>
          <input id="name" className="form-control" autoComplete={isProducer ? 'organization' : 'name'} required
            placeholder={isProducer ? 'Ex.: Quinta da Lameira' : ''} value={form.name} onChange={change('name')} />
          {isProducer && <div className="form-text">É o nome que os compradores veem nos produtos e na sua página.</div>}
        </div>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">Email</label>
          <input id="email" type="email" className="form-control" autoComplete="email" required value={form.email} onChange={change('email')} />
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">Password</label>
          <PasswordField id="password" autoComplete="new-password" describedBy="pw-help" invalid={shortPassword}
            value={form.password} onChange={change('password')} />
          <div id="pw-help" className={`form-text ${shortPassword ? 'text-danger' : ''}`}>Pelo menos 8 caracteres.</div>
        </div>

        {isProducer && (
          <div className="pt-3 mt-2 border-top">
            <h3 className="mb-3">A sua exploração</h3>
            <div className="mb-3">
              <label htmlFor="city" className="form-label">Concelho</label>
              <select id="city" className="form-select" required value={form.city} onChange={change('city')}>
                <option value="" disabled>Escolha o concelho</option>
                {MUNICIPALITIES.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="mb-3">
              <label htmlFor="address" className="form-label">Morada de levantamento</label>
              <input id="address" className="form-control" autoComplete="street-address" required
                placeholder="Ex.: Lugar da Ribeira" value={form.address} onChange={change('address')} />
              <div className="form-text">Aparece no mapa da sua página.</div>
            </div>
            <div className="mb-3">
              <label htmlFor="description" className="form-label">O que produz <span className="muted fw-normal">(opcional)</span></label>
              <textarea id="description" className="form-control" rows="3" value={form.description} onChange={change('description')} />
            </div>
            <div className="verification-notice mb-3">
              <i className="bi bi-hourglass-split" aria-hidden="true" />
              <span>A conta fica ativa depois de o administrador a validar. Até lá pode preparar os produtos, mas ainda não aparecem aos compradores.</span>
            </div>
          </div>
        )}

        {error && <div className="alert alert-danger py-2 small" role="alert"><i className="bi bi-exclamation-circle me-1" aria-hidden="true" />{error}</div>}
        <button type="submit" className="btn btn-primary btn-lg w-100" disabled={sending}>
          {sending ? 'A criar conta…' : isProducer ? 'Criar conta de produtor' : 'Criar conta'}
        </button>
      </form>
    </AuthLayout>
  );
}
