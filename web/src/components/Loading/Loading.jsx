// Rebento a crescer enquanto uma página espera pelos dados.
// A animação (.sprout-anim) está em index.html, partilhada com o ecrã de carregamento inicial.
import './Loading.scss';

export default function Loading({ text = 'A carregar' }) {
  return (
    <div className="loading" role="status" aria-live="polite">
      <svg className="sprout-anim" viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="16" cy="16" r="16" fill="#0F3D2E" />
        <path className="stem" d="M16 25v-9" stroke="#C8E86B" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        <path className="leaf leaf-r" d="M16 17c0-5 3-8 8-8 0 5-3 8-8 8z" fill="#C8E86B" />
        <path className="leaf leaf-l" d="M16 19c0-4-3-7-7-7 0 4 3 7 7 7z" fill="#C8E86B" />
      </svg>
      <span>{text}</span>
    </div>
  );
}
