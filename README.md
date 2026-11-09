# Do Campo à Mesa · código base

Mercado digital de produtores locais com leilões em tempo real.
Trabalho prático individual de **Desenvolvimento Web e para a Cloud** (MEI · IPVC–ESTG), 7 semanas.

Este repositório é um **ponto de partida**. A infraestrutura já está montada, com servidor, ligação à base de dados, routing, estilos, autenticação por token e sockets. As funcionalidades estão marcadas com `TODO (Passo N)`, e os endpoints por fazer respondem `501 Not Implemented`.

## Estrutura

```
do-campo-a-mesa/
├── api/                      Node.js · Express · MongoDB · Socket.io
│   ├── openapi.yaml          Passo 5: especificação OpenAPI (Swagger UI em /api-docs)
│   └── src/
│       ├── server.js         HTTP + Socket.io
│       ├── app.js            Express: middleware, rotas, Swagger
│       ├── config/db.js      ligação ao MongoDB
│       ├── middleware/       auth.js (JWT + papéis), optionalAuth.js, verifiedProducer.js, errorHandler.js
│       ├── models/           User, Product, Order, Auction, Bid, Review (Passo 4)
│       ├── routes/           auth, products, producers, orders, auctions, reviews, admin (Passo 3)
│       ├── sockets/          index.js (autenticação), auctions.js (Passo 7)
│       ├── services/         auctionCycle.js, awarding.js (leilões), images.js: storage na Cloud (Passo 8)
│       └── seed/seed.js      dados de exemplo
├── backoffice/               Laravel 12 (MVC, Blade, Eloquent sobre o MongoDB): administração (ver backoffice/README.md)
├── web/                      React (Vite) · Bootstrap 5 · SASS
│   ├── public/               illustrations.svg (ilustrações das categorias), favicon.svg
│   └── src/
│       ├── App.jsx           rotas (visitante, comprador, produtor, admin)
│       ├── api/              client.js (pedidos à API com o token JWT), products, auctions, orders, reviews, admin, mock
│       ├── context/          AuthContext, CartContext, SocketContext (estado global)
│       ├── hooks/            useData, useAuction (Socket.io), useRefresh, useCountdown, useAddToCart
│       ├── components/       Navbar, ProductCard, AuctionCard, OrdersTable, ProtectedRoute…
│       ├── pages/            Catalog, ProducerProfile, Auctions, AuctionRoom, Cart, Orders, producer/…, admin/…
│       ├── styles/           _variables, _mixins (Mobile First), _theme, _base, _dashboard, main.scss
│       └── data/             users, products, auctions, bids, orders, reviews (.json): dados simulados e do seed
└── docs/
    └── relatorio.md          estrutura sugerida para o relatório
```

## Convenção de nomes

Todo o código está em inglês: ficheiros e pastas, variáveis, funções, componentes, classes CSS, campos da base de dados, valores dos estados (`live`, `pending`, `buyer`…), rotas da API, eventos do Socket.io e endereços da SPA (`/auctions`, `/cart`, `/producer`…). Os comentários e tudo o que o utilizador vê (textos, botões, mensagens de erro, nomes das categorias e dos estados) estão em português. As categorias e as épocas guardam um código (`fruit`, `autumn`) e o nome em português vem de `web/src/utils/labels.js`.

## Backoffice de administração (Laravel)

A administração não está na SPA: é um backoffice em Laravel 12 (`backoffice/`), a componente de valorização do enunciado. Usa Eloquent sobre a mesma base de dados MongoDB Atlas que a API. Tem:
- validar ou rejeitar produtores;
- moderar avaliações denunciadas;
- indicadores;
- listas de utilizadores, encomendas, produtos e leilões.

Corre num contentor Docker (PHP 8.4 + Apache + extensão mongodb), por isso não é preciso instalar PHP:

```bash
npm run backoffice   # http://localhost:8000 (admin@exemplo.pt / password123)
```

Na SPA, a conta de administrador vê a loja como um visitante e tem no menu da conta a ligação "Abrir o backoffice" (`VITE_BACKOFFICE_URL`).

## Contentores (Docker)

`api/Dockerfile` (Node 20) e `backoffice/Dockerfile` (PHP 8.4 + Apache), juntos no `docker-compose.yml` da raiz (`npm run docker`). As mesmas imagens servem para o Azure App Service (Web App for Containers). A SPA não vai em contentor: depois do `vite build` são ficheiros estáticos para o Azure Static Web Apps.

## Pré-requisitos

- Node.js 20 ou superior
- MongoDB local, ou um cluster gratuito no [MongoDB Atlas](https://www.mongodb.com/atlas)

## Arranque

Copiar `api/.env.example` para `api/.env` (preencher `MONGODB_URI` e `JWT_SECRET`) e `web/.env.example` para `web/.env`. Depois, na raiz:

```bash
npm run instalar   # instala as dependências da raiz, da API e da SPA
npm run seed       # dados de exemplo (APAGA as coleções; password: password123)
npm run dev        # API em http://localhost:3000 (docs em /api-docs) e SPA em http://localhost:5173
```

O `npm run dev` arranca os dois servidores no mesmo terminal (prefixos `[api]` e `[web]`). `Ctrl+C` para ambos.

No `api/.env`, `CONFIRMATION_DEADLINE_MIN` (opcional, 60 por omissão) é o tempo que o vencedor de um leilão tem para confirmar a compra antes de o lote passar à licitação seguinte.

Com `VITE_USE_MOCK_DATA=true`, a SPA funciona sem API, a partir dos JSON em `web/src/data` (os mesmos que o seed usa). As datas desses dados são relativas ao momento do seed: se os leilões ao vivo já tiverem terminado, basta correr `npm run seed` outra vez.

### Utilizadores de exemplo (`npm run seed`)

Todos os utilizadores têm a password `password123`.

| Papel | Email |
|---|---|
| admin | admin@exemplo.pt |
| produtor | horta@exemplo.pt |
| produtor | mel@exemplo.pt |
| comprador | tasca@exemplo.pt |

O seed cria também 30 produtos, 16 leilões (5 ao vivo, 1 de teste com 1 minuto e 1 à espera da confirmação do vencedor), encomendas e avaliações.

Atenção: o seed **apaga** todas as coleções antes de inserir os dados.

### Verificar que está tudo a funcionar

| Pedido | Resposta esperada |
|---|---|
| `GET http://localhost:3000/api/health` | `200 { "status": "ok" }` |
| `GET http://localhost:3000/api/products` | `200` com a lista de produtos |
| `http://localhost:3000/api-docs` | Swagger UI |
| `GET /api/admin/stats` sem token | `401` (o middleware de autenticação está ativo) |

## Notas da implementação

### API (`api/`): Node.js · Express · MongoDB · Socket.io

**Já funciona:**

- arranque do servidor HTTP partilhado pela API REST e pelo Socket.io;
- ligação ao MongoDB, configuração por `.env` (ver `.env.example`) e tratamento centralizado de erros (`400` para validação, `500` para o resto);
- middleware `auth(...papeis)`: valida o token JWT e o papel do utilizador (`401` sem token, `403` sem permissão);
- Swagger UI em `/api-docs`, com o recurso `/products` documentado como exemplo;
- sockets: autenticação com o mesmo JWT da API, sala pessoal por utilizador, salas por leilão e contagem de participantes;
- serviço de upload de imagens para Azure Blob Storage (`services/images.js`);
- script `npm run seed` com dados de exemplo.

**Base para rever:**

- modelos User, Product, Order, Auction, Bid e Review, a rever no Passo 4 (embedding vs linking, índices).

**Por fazer:**

- as rotas estão todas definidas, mas só a pesquisa de produtos (`GET /api/products`) está implementada; as restantes respondem `501` com um comentário a explicar o que falta;
- o registo e o login (Passo 6);
- a licitação atómica nos leilões (Passo 7), com a solução indicada em comentário em `sockets/auctions.js`.

### SPA (`web/`): React (Vite) · Bootstrap 5 · SASS

**Já funciona:**

- rotas para os 4 intervenientes (visitante, comprador, produtor, administrador), com páginas protegidas por papel (`ProtectedRoute`);
- menu que se adapta ao utilizador autenticado;
- estado global da sessão (`AuthContext`) e do carrinho (`CartContext`);
- catálogo com dados simulados (pesquisa, categorias e filtro biológico); com `VITE_USE_MOCK_DATA=false` passa a usar a API;
- ligação em tempo real à sala de leilão (hook `useAuction`);
- SASS com as variáveis do tema, o mixin Mobile First `media-up()` e a grelha do catálogo com 3 breakpoints (768, 1024 e 1280 px).

**Por fazer:**

- as páginas ainda por fazer mostram uma caixa tracejada **"Por implementar (Passo N)"** que diz o que falta.

### Onde procurar o trabalho a fazer

Há 25 marcadores `TODO (Passo N)` no código, ligados aos passos da apresentação. Para os listar todos:

```bash
grep -rn "TODO" api/src api/openapi.yaml web/src
```

### Sugestão para distribuir o código

Colocar este código num repositório GitHub marcado como **template**. Cada aluno cria a sua cópia com *Use this template*, partilha-a com o docente e trabalha nela durante as 7 semanas.

## O que já está feito e o que falta

| Passo | Semana | Já feito | Por fazer (`TODO`) |
|---|---|---|---|
| 1 · Frontend | 1 | Bootstrap + SASS com variáveis, mixin `media-up()` e grelha do catálogo | 3 breakpoints em todas as páginas, estilos dos ecrãs restantes |
| 2 · SPA | 2 | Routing, rotas protegidas por papel, contexto do carrinho e da sessão, catálogo | Páginas do produtor, leilões, painéis |
| 3 · API REST | 3 | Todas as rotas definidas; `GET /api/products` implementado | Restantes endpoints (respondem 501) |
| 4 · MongoDB | 3 | Schemas base | Rever embedding vs linking, índices, avaliações |
| 5 · Swagger | 4 | Swagger UI e documentação de `/products` | Documentar os restantes recursos |
| 6 · Segurança | 4 | Middleware `auth(...papeis)` | Registo e login (bcrypt + JWT), formulários |
| 7 · Tempo real | 5 | Autenticação dos sockets, salas, presença, hook `useAuction` | Licitação atómica, contagem decrescente, notificações |
| 8 · Cloud | 6 | Serviço de upload para Azure Blob Storage | Deployment (PaaS), variáveis de ambiente, HTTPS |

Na semana 7 ficam os testes, o relatório (`docs/relatorio.md`) e o vídeo.

## Regras do repositório

- Faça *commits* pequenos e frequentes, com mensagens claras. O histórico é considerado na avaliação.
- O ficheiro `.env` nunca vai para o Git; use `.env.example` como modelo.
- Declare no relatório as bibliotecas e os assistentes de IA que usar.
