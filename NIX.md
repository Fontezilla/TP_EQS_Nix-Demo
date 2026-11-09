# Demo: o "Do Campo à Mesa" com Nix, sem Docker

Cópia do trabalho prático de DWC usada como cobaia para a apresentação do Nix.
O original corre com Docker. Aqui, o mesmo projeto corre só com um `flake.nix`.

## Antes (Docker) vs depois (Nix)

O `backoffice/Dockerfile` existe para instalar o PHP com a extensão `mongodb`:

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

No `flake.nix`, o mesmo resultado fica assim:

```nix
php = pkgs.php84.buildEnv {
  extensions = { enabled, all }: enabled ++ [ all.mongodb all.zip ];
};
composer = php.packages.composer;
```

- Não é preciso compilar nada: a extensão vem pronta da cache binária (`cache.nixos.org`).
- Não é preciso Apache em desenvolvimento: `php artisan serve` serve a pasta `public/`.
- O `flake.lock` fixa o commit exato do nixpkgs. O `apt-get update` do Dockerfile instala versões diferentes conforme o dia em que se constrói a imagem.

## O que o ambiente tem

| Ferramenta | Versão | Substitui |
|---|---|---|
| Node.js | 22 | `node:20-alpine` (o 20 está em fim de vida: o Nix recusa-o por ser inseguro) |
| PHP | 8.4 + `mongodb` + `zip` | `php:8.4-apache` + `pecl` |
| Composer | 2.x | `composer:2` |
| MongoDB CE + mongosh | 8.2 | MongoDB Atlas (base de dados local, em `.nix-data/`) |

Comandos disponíveis dentro do shell: `setup`, `db-start`, `db-stop` e `start`.

## Guião da demo (WSL)

> **Preparação, antes da apresentação:** copiar a pasta para dentro do WSL, porque correr a partir de `/mnt/d/...` é muito lento,
> e correr a demo uma vez para descarregar tudo para a `/nix/store`. No dia, entra tudo instantaneamente.
>
> ```bash
> cp -r "/mnt/d/University Stuff/EQS - Nix/projeto" ~/demo-nix && cd ~/demo-nix
> ```

1. **Mostrar que não há nada instalado.**
   ```bash
   node --version; php --version; composer --version   # command not found
   ```
2. **Entrar no ambiente.**
   ```bash
   nix develop
   ```
   Aparecem as versões. Mostrar `which php`, que aponta para `/nix/store/<hash>-php-with-extensions-8.4…`, e `php -m | grep mongodb`.
3. **Preparar e arrancar.**
   ```bash
   setup               # .env, npm install, composer install, APP_KEY
   db-start            # MongoDB local
   npm run seed        # dados de exemplo
   start               # API :3000 · SPA :5173 · backoffice :8000
   ```
   Abrir http://localhost:8000 no Windows e entrar com `admin@exemplo.pt` / `password123`.
   Se o contentor Docker do backoffice estiver ligado, usar `BACKOFFICE_PORT=8001 start`.
4. **Sair (`exit`) e repetir o passo 1**: as ferramentas desaparecem e o sistema fica limpo.
5. **Mostrar o `flake.lock`**: o commit fixado garante o mesmo ambiente em qualquer máquina.

No fim, `db-stop` pára o MongoDB.

## Notas

- Se a pasta estiver dentro de um repositório Git, as flakes só veem os ficheiros adicionados ao Git (`git add flake.nix flake.lock`).
  Em alternativa, usa-se `nix develop path:.`.
- Os `.env` (segredos) continuam fora do Nix e fora do Git. O `setup` cria-os a partir dos `.env.example`.
- Para o Azure continua a ser preciso uma imagem de contentor. Pode manter-se o Dockerfile ou gerá-la com o Nix (`pkgs.dockerTools.buildImage`).
