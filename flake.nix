{
  description = "Do Campo à Mesa: reproducible development environment";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";

      pkgs = import nixpkgs {
        inherit system;
        config.allowUnfreePredicate = pkg: nixpkgs.lib.getName pkg == "mongodb-ce";
      };

      php = pkgs.php84.buildEnv {
        extensions = { enabled, all }: enabled ++ [ all.mongodb all.zip ];
        extraConfig = ''
          opcache.enable_cli = 1
        '';
      };

      composer = php.packages.composer;

      dataDir = ".nix-data";

      db-start = pkgs.writeShellScriptBin "db-start" ''
        mkdir -p ${dataDir}/db
        ${pkgs.mongodb-ce}/bin/mongod --dbpath ${dataDir}/db --bind_ip 127.0.0.1 --port 27017 \
          --logpath ${dataDir}/mongod.log --fork
      '';

      db-stop = pkgs.writeShellScriptBin "db-stop" ''
        ${pkgs.mongodb-ce}/bin/mongod --dbpath ${dataDir}/db --shutdown
      '';

      setup = pkgs.writeShellScriptBin "setup" ''
        set -e
        secret=$(${pkgs.openssl}/bin/openssl rand -hex 32)
        local_uri="mongodb://127.0.0.1:27017/do-campo-a-mesa"

        if [ ! -f api/.env ]; then
          sed -e "s|^MONGODB_URI=.*|MONGODB_URI=$local_uri|" \
              -e "s|^JWT_SECRET=.*|JWT_SECRET=$secret|" api/.env.example > api/.env
          echo "created api/.env"
        fi
        if [ ! -f web/.env ]; then
          sed -e "s|^VITE_USE_MOCK_DATA=.*|VITE_USE_MOCK_DATA=false|" web/.env.example > web/.env
          echo "created web/.env"
        fi
        if [ ! -f backoffice/.env ]; then
          api_secret=$(grep '^JWT_SECRET=' api/.env | cut -d= -f2-)
          sed -e "s|^MONGODB_URI=.*|MONGODB_URI=$local_uri|" \
              -e "s|^JWT_SECRET=.*|JWT_SECRET=$api_secret|" \
              -e "s|^API_URL=.*|API_URL=http://localhost:3000|" backoffice/.env.example > backoffice/.env
          echo "created backoffice/.env"
        fi

        npm install
        npm install --prefix api
        npm install --prefix web
        (cd backoffice && composer install --no-interaction)
        grep -q '^APP_KEY=base64' backoffice/.env || (cd backoffice && php artisan key:generate)
      '';

      start = pkgs.writeShellScriptBin "start" ''
        port=''${BACKOFFICE_PORT:-8000}
        npx concurrently -k -n api,web,backoffice -c green,cyan,magenta \
          "npm run dev --prefix api" \
          "npm run dev --prefix web" \
          "cd backoffice && php artisan serve --port $port"
      '';
    in
    {
      devShells.${system}.default = pkgs.mkShell {
        packages = [
          pkgs.nodejs_22
          php
          composer
          pkgs.mongodb-ce
          pkgs.mongosh
          db-start
          db-stop
          setup
          start
        ];

        shellHook = ''
          echo "Do Campo à Mesa · Nix environment"
          echo "  node     $(node --version)"
          echo "  php      $(php -r 'echo PHP_VERSION;')  (mongodb $(php -r 'echo phpversion("mongodb");'))"
          echo "  composer $(composer --version 2>/dev/null | cut -d' ' -f3)"
          echo "  mongod   $(mongod --version | head -1 | cut -d' ' -f3)"
          echo
          echo "  setup | db-start | npm run seed | start | db-stop"
        '';
      };
    };
}
