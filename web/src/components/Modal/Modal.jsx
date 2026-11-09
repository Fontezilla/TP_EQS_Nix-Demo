// Janela modal com as classes do Bootstrap, controlada pelo estado do React (aberta/fechada)
import { useEffect, useRef } from 'react';
import './Modal.scss';

export default function Modal({ title, open, onClose, children, footer, wide = false, onSubmit }) {
  const box = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    (box.current?.querySelector('.modal-body :is(input, select, textarea)') || box.current?.querySelector('button'))?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.classList.add('modal-open');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('modal-open');
      previous?.focus?.(); // devolve o foco ao botão que abriu a janela
    };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;

  return (
    <>
      <div className="modal d-block app-modal" role="dialog" aria-modal="true" aria-labelledby="t-modal"
        onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
        <div className={`modal-dialog modal-dialog-centered modal-dialog-scrollable ${wide ? 'modal-lg' : ''}`} ref={box}>
          <form className="modal-content" onSubmit={(e) => { e.preventDefault(); onSubmit?.(); }}>
            <div className="modal-header border-0 pb-0">
              <h2 className="modal-title h3" id="t-modal">{title}</h2>
              <button type="button" className="btn-close" aria-label="Fechar" onClick={onClose} />
            </div>
            <div className="modal-body">{children}</div>
            {footer && <div className="modal-footer border-0 pt-0">{footer}</div>}
          </form>
        </div>
      </div>
      <div className="modal-backdrop show" />
    </>
  );
}
