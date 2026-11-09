// Escolha da ordenação: menu junto ao botão no computador e folha de baixo no telemóvel
import { useEffect, useRef, useState } from 'react';
import './SortMenu.scss';

export default function SortMenu({ value, options, onChange, title = 'Ordenar por' }) {
  const [open, setOpen] = useState(false);
  const trigger = useRef(null);
  const panel = useRef(null);
  const current = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    if (!open) return undefined;
    panel.current?.querySelector('[aria-checked="true"]')?.focus();
    const outside = (e) => {
      if (!panel.current?.contains(e.target) && !trigger.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [open]);

  function close() {
    setOpen(false);
    trigger.current?.focus();
  }

  function pick(v) {
    if (v !== value) onChange(v);
    close();
  }

  function keys(e) {
    const items = [...panel.current.querySelectorAll('[role="menuitemradio"]')];
    const i = items.indexOf(document.activeElement);
    if (e.key === 'Escape' || e.key === 'Tab') { e.preventDefault(); close(); }
    if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    if (e.key === 'ArrowUp') { e.preventDefault(); items[(i - 1 + items.length) % items.length].focus(); }
  }

  return (
    <div className="sort-menu">
      <button ref={trigger} type="button" className="sort-menu__trigger" aria-haspopup="menu" aria-expanded={open}
        aria-label={`${title}: ${current.label}`} onClick={() => setOpen((o) => !o)}>
        <i className="bi bi-arrow-down-up" aria-hidden="true" />
        <span>{current.label}</span>
        <i className="bi bi-chevron-down sort-menu__chevron" aria-hidden="true" />
      </button>

      {open && (
        <>
          <div className="sort-menu__backdrop" aria-hidden="true" />
          <div ref={panel} className="sort-menu__panel" role="menu" aria-label={title} onKeyDown={keys}>
            <p className="sort-menu__title">{title}</p>
            {options.map((o) => (
              <button key={o.value} type="button" role="menuitemradio" aria-checked={o.value === value} onClick={() => pick(o.value)}>
                <i className={`bi bi-${o.icon}`} aria-hidden="true" />
                <span>{o.label}</span>
                {o.value === value && <i className="bi bi-check-lg sort-menu__check" aria-hidden="true" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
