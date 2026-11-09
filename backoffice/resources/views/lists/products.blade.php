@extends('layouts.app')
@php use App\Support\Labels; @endphp

@section('title', 'Produtos')

@section('content')
<div class="page-header">
    <div><h1 class="dashboard-title">Produtos</h1><p>{{ $products->total() }} {{ $products->total() === 1 ? 'produto' : 'produtos' }} de todos os produtores com estes filtros.</p></div>
    <div class="d-flex gap-2 flex-wrap">
        @foreach (['low' => ['bi-exclamation-triangle', 'Só stock baixo'], 'hidden' => ['bi-eye-slash', 'Só ocultos']] as $param => [$icon, $text])
            <a @class(['btn btn-sm', 'btn-primary' => request()->boolean($param), 'btn-outline' => ! request()->boolean($param)])
               href="{{ request()->fullUrlWithQuery([$param => request()->boolean($param) ? null : 1, 'page' => null]) }}"
               aria-pressed="{{ request()->boolean($param) ? 'true' : 'false' }}">
                <i class="bi {{ $icon }}" aria-hidden="true"></i>{{ $text }}
            </a>
        @endforeach
    </div>
</div>

<section class="panel" aria-label="Lista de produtos">
    <div class="filters">
        @include('partials.search', ['placeholder' => 'Nome do produto'])
        @include('partials.segmented', ['param' => 'category', 'label' => 'Filtrar por categoria', 'all' => 'Todas', 'options' => Labels::CATEGORIES])
    </div>

    @if ($products->isEmpty())
        <p class="muted mb-0">Nenhum produto com estes filtros.</p>
    @else
        <div class="table-scroll">
            <table class="data-table">
                <thead><tr><th>Produto</th><th>Produtor</th><th class="text-end">Preço</th><th class="text-end">Stock</th><th><span class="visually-hidden">Moderação</span></th></tr></thead>
                <tbody>
                @foreach ($products as $p)
                    <tr @class(['is-hidden' => $p->hidden])>
                        <td>
                            <b>{{ $p->name }}</b>@if ($p->hidden) <span class="tag tag-error ms-1">Oculto</span>@endif<br>
                            <small class="muted">{{ Labels::CATEGORIES[$p->category] ?? $p->category }}</small>
                            @if ($p->organic)<span class="tag tag-lime ms-1">Biológico</span>@endif
                        </td>
                        <td>{{ $p->owner?->name ?? '—' }}</td>
                        <td class="text-end num text-nowrap">{{ Labels::euro($p->price) }} / {{ $p->unit }}</td>
                        <td class="text-end text-nowrap">
                            @if ($p->stock === 0)<span class="tag tag-notice">Esgotado</span>
                            @elseif ($p->isLowStock())<span class="tag tag-notice">{{ $p->stock }} {{ $p->unit }}</span>
                            @else<span class="num">{{ $p->stock }} {{ $p->unit }}</span>@endif
                        </td>
                        <td class="text-end">
                            <form method="POST" action="{{ route('products.visibility', $p->id) }}">
                                @csrf @method('PATCH')
                                @if ($p->hidden)
                                    <button class="btn btn-outline btn-sm" type="submit"><i class="bi bi-eye" aria-hidden="true"></i>Mostrar</button>
                                @else
                                    <button class="btn btn-danger-soft btn-sm" type="submit" title="Tira o produto do catálogo da loja"><i class="bi bi-eye-slash" aria-hidden="true"></i>Ocultar</button>
                                @endif
                            </form>
                        </td>
                    </tr>
                @endforeach
                </tbody>
            </table>
        </div>
    @endif
    {{ $products->links() }}
</section>
@endsection
