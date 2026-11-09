// Partes do backoffice que se atualizam sem recarregar a página:
// - leilões ao vivo: o mesmo Socket.io da loja (como visitante), com os eventos auction-updated e auctions-changed;
// - estado dos serviços: pedido ao abrir a página e no botão "Verificar agora".
(function () {
  const apiUrl = document.querySelector('meta[name="api-url"]')?.content;
  const euro = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

  // Contagem decrescente de cada leilão
  function tick() {
    document.querySelectorAll('[data-ends]').forEach((el) => {
      const ms = Date.parse(el.dataset.ends) - Date.now();
      if (Number.isNaN(ms)) return;
      if (ms <= 0) { el.textContent = 'a fechar'; return; }
      const s = Math.floor(ms / 1000);
      const h = Math.floor(s / 3600);
      const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
      const ss = String(s % 60).padStart(2, '0');
      el.textContent = `termina em ${h ? `${h}:` : ''}${mm}:${ss}`;
    });
  }
  tick();
  setInterval(tick, 1000);

  // Pede um bocado da página ao backoffice; se a sessão terminou, volta ao login
  async function fragment(url) {
    const r = await fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
    if (r.redirected) { window.location.reload(); return null; }
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.text();
  }

  const live = document.querySelector('[data-live-auctions]');
  if (live && window.io && apiUrl) {
    const status = document.querySelector('[data-live-status]');
    const socket = window.io(apiUrl, { transports: ['websocket', 'polling'] });
    let timer;
    // Vários avisos seguidos dão um só pedido
    const reload = () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        const html = await fragment(live.dataset.src).catch(() => null);
        if (html !== null) { live.innerHTML = html; tick(); }
      }, 300);
    };

    socket.on('connect', () => {
      status.textContent = 'em direto';
      status.classList.add('on');
      reload(); // apanha o que mudou enquanto a ligação esteve em baixo
    });
    socket.on('disconnect', () => {
      status.textContent = 'sem ligação, a tentar outra vez';
      status.classList.remove('on');
    });
    socket.on('connect_error', () => { status.textContent = 'sem ligação à API'; });
    socket.on('auctions-changed', reload);
    socket.on('auction-updated', (e) => {
      const row = live.querySelector(`[data-auction="${e._id}"]`);
      if (!row) return reload();
      row.querySelector('.amount').textContent = euro.format(e.currentBid.amount);
      row.querySelector('.bids').textContent = `${e.bidCount} ${e.bidCount === 1 ? 'licitação' : 'licitações'}`;
      row.classList.remove('flash');
      void row.offsetWidth; // reinicia a animação
      row.classList.add('flash');
    });
  }

  const services = document.querySelector('[data-services]');
  if (services) {
    const body = services.querySelector('[data-services-body]');
    const button = services.querySelector('[data-services-refresh]');
    const load = async () => {
      button.disabled = true;
      body.setAttribute('aria-busy', 'true');
      body.innerHTML = '<p class="muted mb-0">A verificar os serviços…</p>';
      const html = await fragment(services.dataset.src).catch(() => null);
      body.innerHTML = html ?? '<p class="attention mb-0">Não foi possível verificar os serviços.</p>';
      body.removeAttribute('aria-busy');
      button.disabled = false;
    };
    button.addEventListener('click', load);
    load();
  }
})();
