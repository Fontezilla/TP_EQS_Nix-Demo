// Ecrã de carregamento inicial (#loader em index.html).
// Sai quando a página, a letra e os primeiros pedidos de dados terminaram; depois não volta a aparecer.
let pending = 0;
let finished = false;
let check;

export function requestStarted() {
  if (!finished) pending += 1;
}

export function requestFinished() {
  if (finished) return;
  pending = Math.max(0, pending - 1);
  scheduleCheck();
}

// Espera um instante: um pedido pode levar a outro (ex.: depois do login)
function scheduleCheck() {
  clearTimeout(check);
  check = setTimeout(() => { if (pending === 0) hide(); }, 120);
}

function hide() {
  if (finished) return;
  finished = true;
  const screen = document.getElementById('loader');
  if (!screen) return;
  screen.classList.add('done');
  screen.addEventListener('transitionend', () => screen.remove(), { once: true });
  setTimeout(() => screen.remove(), 600); // se a transição não correr (movimento reduzido)
}

export function startLoadingScreen() {
  const pageLoaded = document.readyState === 'complete'
    ? Promise.resolve()
    : new Promise((ok) => window.addEventListener('load', ok, { once: true }));

  Promise.all([pageLoaded, document.fonts?.ready]).then(scheduleCheck);
  setTimeout(hide, 8000); // nunca prende o utilizador, mesmo que a API não responda
}
