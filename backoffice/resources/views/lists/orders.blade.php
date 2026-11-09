@extends('layouts.app')
@php use App\Support\Labels; @endphp

@section('title', 'Encomendas')

@section('content')
<div class="page-header">
    <div><h1 class="dashboard-title">Encomendas</h1><p>As encomendas da loja e dos leilões, de todos os produtores ({{ $orders->total() }} com estes filtros).</p></div>
</div>

<section class="panel" aria-label="Lista de encomendas">
    <div class="filters">
        @include('partials.segmented', ['param' => 'status', 'label' => 'Filtrar por estado', 'all' => 'Todas', 'options' => Labels::ORDER_STATUSES])
        @include('partials.segmented', ['param' => 'source', 'label' => 'Filtrar por origem', 'all' => 'Loja e leilões',
            'options' => ['shop' => 'Só loja', 'auction' => 'Só leilões']])
    </div>
    @include('lists.partials.orders-table', ['orders' => $orders])
    {{ $orders->links() }}
</section>
@endsection
