# Backoffice (Laravel)

Painel de administração do Do Campo à Mesa, em Laravel 12 (MVC, Blade, Eloquent). Corresponde à componente de valorização "Backoffice Laravel" do enunciado. A loja (SPA React) não tem administração: esta é a única área do administrador.

## Como funciona

- **Mesma base de dados da API:** os modelos Eloquent (`app/Models`) usam o pacote `mongodb/laravel-mongodb` e leem as mesmas coleções do MongoDB Atlas que a API Node (`users`, `products`, `orders`, `auctions`, `reviews`), com os mesmos nomes de campos.
- **Login:** só contas com `role: 'admin'`. A password é verificada com `password_verify` sobre o `passwordHash` em bcrypt que a API guardou. O middleware `EnsureAdmin` confirma o papel em cada pedido, e o guard volta a ler o utilizador da BD, por isso uma conta apagada perde logo o acesso.
- **Sessões e cache em ficheiro:** o backoffice não cria coleções nem campos novos na base de dados partilhada.

| Página | Rota | Controlador |
| --- | --- | --- |
| Resumo (indicadores, pedidos, últimas encomendas) | `/` | `DashboardController` |
| Produtores por validar (aprovar / rejeitar) | `/producers/pending` | `ProducerController` |
| Avaliações denunciadas (manter / ocultar) | `/reviews` | `ReviewController` |
| Utilizadores, Encomendas, Produtos, Leilões (filtros e paginação) | `/users`, `/orders`, `/products`, `/auctions` | `ListController` |
| Ocultar / mostrar um produto (moderação de conteúdos) | `PATCH /products/{id}/visibility` | `ProductController` |
| Pagamentos (fictícios), filtro por método e pesquisa por referência | `/payments` | `ListController` |
| Leilões ao vivo em tempo real e estado dos serviços (no resumo) | `/auctions/live`, `/services` | `LiveController` |

**Tempo real:** os leilões ao vivo usam o mesmo Socket.io da loja, como visitante (`public/js/live.js`): `auction-updated` muda a licitação e o número de licitações na linha, e `auctions-changed` volta a pedir a lista.

**Estado dos serviços:** o backoffice chama `GET /api/admin/services` da API com um JWT de administrador. Assina-o com o mesmo `JWT_SECRET` (`app/Support/ApiClient.php`), em nome do admin com sessão. Junta ainda a verificação do próprio Laravel ao Atlas.

**Ocultar produtos:** guarda `hidden: true` no produto. A API tira-o do catálogo, recusa encomendas e leilões com ele e só o mostra ao próprio produtor, com a indicação "Ocultado pelo administrador".

As alterações usam filtros condicionais (ex.: só aprova um produtor que ainda esteja por validar), por isso dois administradores ao mesmo tempo não tratam o mesmo pedido duas vezes.

## Arranque (Docker)

O PHP corre num contentor (PHP 8.4 + Apache + extensão `mongodb`), por isso não é preciso instalar PHP no Windows.

1. Copiar `.env.example` para `.env` e preencher `MONGODB_URI` e `JWT_SECRET` (os mesmos da API); `API_URL` e `API_PUBLIC_URL` já apontam para a API em desenvolvimento e `APP_KEY` (`docker compose run --rm backoffice php artisan key:generate --show`).
2. Na raiz do repositório: `docker compose up --build backoffice` (ou `docker compose up --build` para a API e o backoffice).
3. Abrir http://localhost:8000 e entrar com `admin@exemplo.pt` / `password123` (contas do seed).

## Na Cloud

A mesma imagem corre no Azure App Service (Web App for Containers), no mesmo plano da API. As variáveis do `.env` passam para as App Settings (`APP_KEY`, `APP_ENV=production`, `APP_DEBUG=false`, `MONGODB_URI`, `DB_DATABASE`, `SPA_URL`).
