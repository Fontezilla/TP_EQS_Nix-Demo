// Ligações de cada papel: navbar (desktop) e barra de separadores (telemóvel).
// O administrador usa a loja como visitante; o painel dele é o backoffice em Laravel.
export const BACKOFFICE_URL = import.meta.env.VITE_BACKOFFICE_URL || 'http://localhost:8000';

export const HOME = { guest: '/', buyer: '/', producer: '/producer', admin: '/' };

export const LINKS = {
  guest: [{ to: '/', label: 'Produtos' }, { to: '/auctions', label: 'Leilões' }],
  buyer: [{ to: '/', label: 'Produtos' }, { to: '/auctions', label: 'Leilões' }, { to: '/orders', label: 'Encomendas' }],
  producer: [{ to: '/', label: 'Produtos' }, { to: '/auctions', label: 'Leilões' }, { to: '/producer', label: 'Painel' }],
  admin: [{ to: '/', label: 'Produtos' }, { to: '/auctions', label: 'Leilões' }]
};

export const TABS = {
  guest: [
    { to: '/', icon: 'house', label: 'Início' },
    { to: '/auctions', icon: 'broadcast', label: 'Leilões', noFill: true },
    { to: '/login', icon: 'person', label: 'Entrar' }
  ],
  buyer: [
    { to: '/', icon: 'house', label: 'Início' },
    { to: '/auctions', icon: 'broadcast', label: 'Leilões', noFill: true },
    { to: '/cart', icon: 'basket', label: 'Cesto', cart: true },
    { to: '/orders', icon: 'box-seam', label: 'Encomendas' }
  ],
  producer: [
    { to: '/', icon: 'house', label: 'Início' },
    { to: '/auctions', icon: 'broadcast', label: 'Leilões', noFill: true },
    { to: '/producer', icon: 'clipboard-data', label: 'Painel', panel: true }
  ],
  admin: [
    { to: '/', icon: 'house', label: 'Início' },
    { to: '/auctions', icon: 'broadcast', label: 'Leilões', noFill: true }
  ]
};

// Secções do painel do produtor: menu do painel e barra que abre por cima do separador "Painel"
// (short: rótulo de uma palavra para a barra do telemóvel)
export const panelLinks = (userId) => [
  { to: '/producer', icon: 'grid', label: 'Resumo', end: true },
  { to: '/producer/orders', icon: 'box-seam', label: 'Encomendas', orders: true },
  { to: '/producer/products', icon: 'basket', label: 'Produtos' },
  { to: '/producer/auctions/new', icon: 'hammer', label: 'Criar leilão', short: 'Leiloar' },
  { to: `/producers/${userId}`, icon: 'shop', label: 'Página pública', short: 'Página' }
];
