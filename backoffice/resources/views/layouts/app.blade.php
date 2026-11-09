@php use App\Support\Labels; @endphp
<!doctype html>
<html lang="pt">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#0F3D2E">
    <meta name="api-url" content="{{ config('services.api.public_url') }}">
    <title>@yield('title') · Backoffice · Do Campo à Mesa</title>
    <link rel="icon" href="{{ asset('favicon.svg') }}" type="image/svg+xml">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,400..800&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
    <link href="{{ asset('css/backoffice.css') }}?v={{ filemtime(public_path('css/backoffice.css')) }}" rel="stylesheet">
</head>
<body>
<header class="container-xl site-header">
    <div class="header-glass" aria-hidden="true"></div>
    <nav class="nav-pill" aria-label="Navegação principal">
        <a class="brand" href="{{ auth()->check() ? route('dashboard') : route('login') }}">
            <img src="{{ asset('favicon.svg') }}" alt="">
            <span class="d-none d-sm-inline">Do Campo à Mesa</span>
            <span class="area">Backoffice</span>
        </a>
        <div class="nav-right">
            <a class="btn btn-outline btn-sm" href="{{ config('app.spa_url') }}"><i class="bi bi-shop" aria-hidden="true"></i><span class="d-none d-sm-inline">Abrir a loja</span></a>
            @auth
                <div class="dropdown account-menu">
                    <button class="avatar" type="button" data-bs-toggle="dropdown" aria-expanded="false" aria-label="Conta de {{ auth()->user()->name }}">
                        {{ Labels::initials(auth()->user()->name) }}
                    </button>
                    <div class="dropdown-menu dropdown-menu-end">
                        <div class="menu-header"><strong>{{ auth()->user()->name }}</strong>{{ auth()->user()->email }}<br>Administração</div>
                        <form method="POST" action="{{ route('logout') }}">
                            @csrf
                            <button class="dropdown-item" type="submit"><i class="bi bi-box-arrow-right me-2" aria-hidden="true"></i>Terminar sessão</button>
                        </form>
                    </div>
                </div>
            @endauth
        </div>
    </nav>
</header>

<main class="container-xl">
    @auth
        <div class="page">
            <div class="dashboard">
                <nav class="dashboard-menu" aria-label="Backoffice">
                    <a href="{{ route('dashboard') }}" @class(['is-active' => request()->routeIs('dashboard')])><i class="bi bi-grid" aria-hidden="true"></i>Resumo</a>
                    <a href="{{ route('producers.pending') }}" @class(['is-active' => request()->routeIs('producers.*')])>
                        <i class="bi bi-person-check" aria-hidden="true"></i>Produtores
                        @if ($menuCounts['producers'] ?? 0)<span class="count" aria-label="{{ $menuCounts['producers'] }} por validar">{{ $menuCounts['producers'] }}</span>@endif
                    </a>
                    <a href="{{ route('reviews.index') }}" @class(['is-active' => request()->routeIs('reviews.*')])>
                        <i class="bi bi-flag" aria-hidden="true"></i>Avaliações
                        @if ($menuCounts['reviews'] ?? 0)<span class="count" aria-label="{{ $menuCounts['reviews'] }} denunciadas">{{ $menuCounts['reviews'] }}</span>@endif
                    </a>
                    <span class="group">Consultar</span>
                    <a href="{{ route('users.index') }}" @class(['is-active' => request()->routeIs('users.*')])><i class="bi bi-people" aria-hidden="true"></i>Utilizadores</a>
                    <a href="{{ route('orders.index') }}" @class(['is-active' => request()->routeIs('orders.*')])><i class="bi bi-box-seam" aria-hidden="true"></i>Encomendas</a>
                    <a href="{{ route('products.index') }}" @class(['is-active' => request()->routeIs('products.*')])><i class="bi bi-basket" aria-hidden="true"></i>Produtos</a>
                    <a href="{{ route('auctions.index') }}" @class(['is-active' => request()->routeIs('auctions.*')])><i class="bi bi-hammer" aria-hidden="true"></i>Leilões</a>
                    <a href="{{ route('payments.index') }}" @class(['is-active' => request()->routeIs('payments.*')])><i class="bi bi-receipt" aria-hidden="true"></i>Pagamentos</a>
                </nav>

                <div class="d-grid gap-4">
                    @if (session('status'))
                        <p class="success-notice" role="status"><i class="bi bi-check-circle-fill" aria-hidden="true"></i>{{ session('status') }}</p>
                    @endif
                    @if ($errors->any())
                        <div class="alert alert-danger py-2 mb-0" role="alert"><i class="bi bi-exclamation-circle me-1" aria-hidden="true"></i>{{ $errors->first() }}</div>
                    @endif
                    @yield('content')
                </div>
            </div>
        </div>
    @else
        @yield('content')
    @endauth
</main>

<footer class="container-xl">
    <div class="site-footer">
        <b>Do Campo à Mesa</b>
        <span>Backoffice de administração · Trabalho prático de Desenvolvimento Web e para a Cloud, IPVC–ESTG, 2026</span>
    </div>
</footer>

@stack('modals')
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
@stack('scripts')
</body>
</html>
