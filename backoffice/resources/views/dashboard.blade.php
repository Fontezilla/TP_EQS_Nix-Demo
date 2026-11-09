@extends('layouts.app')
@php use App\Support\Labels; @endphp

@section('title', 'Resumo')

@section('content')
<div class="page-header">
    <div>
        <h1 class="dashboard-title">Administração</h1>
        <p>{{ ucfirst(now()->locale('pt')->isoFormat('dddd, D [de] MMMM')) }}</p>
    </div>
</div>

<div class="stats">
    <div class="stat">
        <small>Utilizadores registados</small><b>{{ $stats['users'] }}</b>
        <span><span class="good">+{{ $stats['newThisWeek'] }}</span> nos últimos 7 dias</span>
    </div>
    <div class="stat">
        <small>Produtores ativos</small><b>{{ $stats['producers'] }}</b>
        <span>@if ($stats['pending'])<span class="attention">{{ $stats['pending'] }}</span> por validar @else Nenhum por validar @endif</span>
    </div>
    <div class="stat">
        <small>Encomendas hoje</small><b>{{ $stats['ordersToday'] }}</b>
        <span>{{ Labels::euro($stats['salesToday']) }} em vendas</span>
    </div>
    <div class="stat">
        <small>Leilões ao vivo</small><b>{{ $stats['liveAuctions'] }}</b>
        <span>@if ($stats['reported'])<span class="attention">{{ $stats['reported'] }}</span> {{ $stats['reported'] === 1 ? 'avaliação denunciada' : 'avaliações denunciadas' }} @else Sem denúncias @endif</span>
    </div>
</div>

{{-- Mosaico 2 x 2: colunas iguais, e os painéis da mesma linha com a mesma altura --}}
<div class="home-grid">
    <section class="panel" aria-labelledby="t-pending">
        <div class="panel-head">
            <h2 id="t-pending" class="h3">Produtores por validar</h2>
            <a class="text-link small" href="{{ route('producers.pending') }}">Ver todos</a>
        </div>
        @if ($pending->isEmpty())
            <p class="panel-empty">Não há pedidos por validar.</p>
        @else
            <ul class="rows">
                @foreach ($pending as $u)
                    <li class="row-item">
                        <span class="initials" aria-hidden="true">{{ Labels::initials($u->name) }}</span>
                        <div class="main">
                            <b>{{ $u->name }}</b>
                            <small>{{ $u->producer['city'] ?? 'Sem concelho' }}, pedido {{ $u->createdAt?->diffForHumans() }}</small>
                        </div>
                        <form class="end" method="POST" action="{{ route('producers.approve', $u->id) }}">
                            @csrf @method('PATCH')
                            <button class="btn btn-primary btn-sm" type="submit">Aprovar</button>
                        </form>
                    </li>
                @endforeach
            </ul>
        @endif
    </section>

    <section class="panel" aria-labelledby="t-orders">
        <div class="panel-head">
            <h2 id="t-orders" class="h3">Últimas encomendas</h2>
            <a class="text-link small" href="{{ route('orders.index') }}">Ver todas</a>
        </div>
        @if ($recentOrders->isEmpty())
            <p class="panel-empty">Ainda não há encomendas.</p>
        @else
            <ul class="rows">
                @foreach ($recentOrders as $o)
                    <li class="row-item">
                        <span class="initials" aria-hidden="true">{{ Labels::initials($o->buyerUser?->name ?? '?') }}</span>
                        <div class="main">
                            <b>{{ $o->buyerUser?->name ?? 'Conta removida' }}</b>
                            <small>{{ Labels::orderNumber($o->id) }}, {{ $o->producerUser?->name ?? 'produtor removido' }}{{ $o->source === 'auction' ? ', leilão' : '' }}</small>
                        </div>
                        <div class="end stacked">
                            <b class="num">{{ Labels::euro($o->total) }}</b>
                            <span class="status status-{{ $o->status }}">{{ Labels::ORDER_STATUSES[$o->status] ?? $o->status }}</span>
                        </div>
                    </li>
                @endforeach
            </ul>
        @endif
    </section>

    @include('partials.live-panel')
    @include('partials.services-panel')
</div>
@endsection
