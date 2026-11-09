# Nix Demo · Do Campo à Mesa

Demonstração do **Nix** para a unidade curricular de Engenharia e Qualidade de Software (MEI · IPVC–ESTG).

O projeto usado como cobaia é o "Do Campo à Mesa", um mercado de produtores locais com leilões em tempo real, feito para outra unidade curricular. Tem três linguagens e quatro ferramentas, e corria com Docker. Aqui corre **só com um `flake.nix`**: o mesmo ambiente, com as mesmas versões, em qualquer máquina com Nix.

| Parte | Tecnologia | Porta |
|---|---|---|
| SPA (`web/`) | React · Vite | 5173 |
| API (`api/`) | Node.js · Express · Socket.io | 3000 |
| Backoffice (`backoffice/`) | Laravel 12 · PHP 8.4 + extensão `mongodb` | 8000 |
| Base de dados | MongoDB (local, em `.nix-data/`) | 27017 |

## Arranque rápido

Precisa de **Nix com flakes ativas**, em Linux, macOS ou WSL2 (Windows).

```bash
git clone https://github.com/Fontezilla/TP_EQS_Nix-Demo.git
cd TP_EQS_Nix-Demo
nix develop
```

Dentro do shell:

```bash
setup          # cria os .env, instala as dependências (npm + composer) e gera a APP_KEY
db-start       # arranca o MongoDB local
npm run seed   # dados de exemplo (apaga as coleções)
start          # API, SPA e backoffice no mesmo terminal
```

| Endereço | O quê |
|---|---|
| http://localhost:5173 | Loja (SPA) |
| http://localhost:3000/api-docs | Documentação da API (Swagger) |
| http://localhost:8000 | Backoffice |

`Ctrl+C` pára os servidores. Antes de sair do shell, `db-stop` pára o MongoDB (corre em background e não pára com o `exit`).

Da segunda vez, o `setup` e o `seed` já não são precisos: `nix develop`, `db-start` e `start`.

### Contas de teste

Todas com a password `password123`.

| Papel | Email |
|---|---|
| admin (backoffice) | admin@exemplo.pt |
| produtor | horta@exemplo.pt |
| comprador | tasca@exemplo.pt |

## O que o ambiente tem

| Ferramenta | Versão | Substitui |
|---|---|---|
| Node.js | 22 | `node:20-alpine` (o Node 20 chegou ao fim de vida e o nixpkgs recusa-o por ser inseguro) |
| PHP | 8.4 + `mongodb` + `zip`, com OPcache | `php:8.4-apache` + `pecl` |
| Composer | 2.x | `composer:2` |
| MongoDB CE + mongosh | 8.2 | MongoDB Atlas |

As versões exatas vêm do commit do nixpkgs fixado no `flake.lock`. Só mudam com `nix flake update`.

| Comando | O que faz |
|---|---|
| `setup` | Cria `api/.env`, `web/.env` e `backoffice/.env` a partir dos `.env.example`, com o MongoDB local e um `JWT_SECRET` aleatório; instala as dependências e gera a `APP_KEY` |
| `db-start` / `db-stop` | Liga e desliga o MongoDB, com os dados em `.nix-data/` |
| `start` | API, SPA e backoffice. `BACKOFFICE_PORT=8001 start` muda a porta do backoffice |

## Antes (Docker) e depois (Nix)

O `backoffice/Dockerfile` existia para instalar o PHP com a extensão `mongodb`:

```dockerfile
FROM php:8.4-apache
RUN apt-get update \
 && apt-get install -y --no-install-recommends git unzip libzip-dev libssl-dev pkg-config \
 && pecl install mongodb-2.5.5 \
 && docker-php-ext-enable mongodb \
 && docker-php-ext-install zip \
 && a2enmod rewrite ...
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
```

No `flake.nix`:

```nix
php = pkgs.php84.buildEnv {
  extensions = { enabled, all }: enabled ++ [ all.mongodb all.zip ];
};
composer = php.packages.composer;
```

- A extensão vem compilada da cache binária (`cache.nixos.org`): não há `apt-get` nem `pecl`.
- Em desenvolvimento não é preciso Apache: o `php artisan serve` serve a pasta `public/`.
- O `flake.lock` fixa o commit do nixpkgs. O `apt-get update` do Dockerfile instala versões diferentes conforme o dia em que se constrói a imagem.

Os Dockerfiles e o `docker-compose.yml` continuam no repositório para a comparação. Para a cloud continua a ser precisa uma imagem de contentor, que também se pode gerar com o Nix (`pkgs.dockerTools.buildImage`).

## Guião da demonstração

1. **Sem nada instalado:** `node --version` e `php --version` dão `command not found`.
2. **Entrar no ambiente:** `nix develop` mostra as versões no cabeçalho.
3. **De onde vêm as ferramentas:** `which php` aponta para `/nix/store/<hash>-php-with-extensions-8.4.27/bin/php`. O hash é **igual em todas as máquinas** com o mesmo `flake.lock`.
4. **Correr o projeto:** `db-start && start` e abrir a loja e o backoffice no browser.
5. **Trocar de versão:** mudar `pkgs.nodejs_22` para `pkgs.nodejs_24` no `flake.nix`, sair e voltar a entrar; `node --version` mostra a nova versão. Voltar ao 22 é instantâneo, porque continua na store.
6. **Sair:** `exit` e repetir o passo 1. As ferramentas desaparecem e o sistema fica como estava.

## Notas

- **WSL:** clonar o repositório para dentro do Linux (por exemplo `~/TP_EQS_Nix-Demo`). A partir de `/mnt/c` ou `/mnt/d`, o `npm install` e o backoffice ficam muitas vezes mais lentos.
- **Primeira vez:** o `nix develop` descarrega cerca de 414 MiB da cache. Daí em diante entra de imediato.
- **Flakes e Git:** as flakes só veem os ficheiros que estão no Git. Um ficheiro novo tem de ser adicionado com `git add` antes do `nix develop`.
- **Segredos:** os `.env` nunca vão para o Git (estão no `.gitignore`). O `setup` gera-os em cada máquina, com valores locais e aleatórios.
- **Espaço em disco:** `nix-collect-garbage -d` apaga da `/nix/store` o que já não é usado.
