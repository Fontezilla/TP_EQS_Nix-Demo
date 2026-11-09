// Moldura comum a Entrar e Criar conta: texto à esquerda, formulário à direita
import { useState } from 'react';
import CategoryTile from '../CategoryTile/CategoryTile.jsx';
import './AuthLayout.scss';

export default function AuthLayout({ title, text, footer, category, children }) {
  return (
    <div className="auth-layout page">
      <div className="auth-layout__side">
        <h1>{title}</h1>
        <p className="mt-3">{text}</p>
        <p>{footer}</p>
        <CategoryTile category={category} />
      </div>
      {children}
    </div>
  );
}

// Campo de password com botão para mostrar ou esconder o que se escreveu
export function PasswordField({ id, value, onChange, autoComplete, describedBy, invalid }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="input-group has-validation">
      <input id={id} type={visible ? 'text' : 'password'} className={`form-control ${invalid ? 'is-invalid' : ''}`} required
        autoComplete={autoComplete} value={value} onChange={onChange} aria-describedby={describedBy} />
      <button className="btn btn-outline" type="button" onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Esconder password' : 'Mostrar password'} aria-pressed={visible}>
        <i className={`bi bi-eye${visible ? '-slash' : ''}`} aria-hidden="true" />
      </button>
    </div>
  );
}
