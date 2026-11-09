# Backoffice Laravel: PHP 8.4 + Apache + extensão mongodb (para o Eloquent chegar ao MongoDB Atlas).
# Na Cloud corre no Azure App Service (Web App for Containers), na porta 80.
FROM php:8.4-apache

# libssl-dev: a extensão mongodb precisa de TLS para ligar ao Atlas
RUN apt-get update \
 && apt-get install -y --no-install-recommends git unzip libzip-dev libssl-dev pkg-config \
 && pecl install mongodb-2.5.5 \
 && docker-php-ext-enable mongodb \
 && docker-php-ext-install zip \
 && a2enmod rewrite \
 && rm -rf /var/lib/apt/lists/* /tmp/pear

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# O Apache serve a pasta public/ e respeita o .htaccess do Laravel
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf \
 && sed -ri 's!AllowOverride None!AllowOverride All!g' /etc/apache2/apache2.conf

WORKDIR /var/www/html

COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --no-interaction --prefer-dist

COPY . .
RUN composer dump-autoload --optimize --no-dev \
 && chown -R www-data:www-data storage bootstrap/cache

EXPOSE 80
