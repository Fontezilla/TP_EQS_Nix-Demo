@extends('layouts.app')
@php use App\Support\Labels; @endphp

@section('title', 'Leilões')

@section('content')
<div class="page-header">
    <div><h1 class="dashboard-title">Leilões</h1><p>As licitações e o fecho dos leilões são feitos pela API em tempo real; aqui só se consultam.</p></div>
</div>

@include('partials.live-panel')

<section class="panel" aria-label="Lista de leilões">
    <div class="filters">
        @include('partials.segmented', ['param' => 'status', 'label' => 'Filtrar por estado', 'all' => 'Todos', 'options' => Labels::AUCTION_STATUSES])
    </div>

    @if ($auctions->isEmpty())
        <p class="muted mb-0">Nenhum leilão com este estado.</p>
    @else
        <div class="table-scroll">
            <table class="data-table">
                <thead><tr><th>Lote</th><th>Período</th><th class="text-end">Licitação</th><th>Estado</th></tr></thead>
                <tbody>
                @foreach ($auctions as $a)
                    <tr>
                        <td>
                            <b>{{ $a->lot }}</b><br>
                            <small class="muted">{{ $a->producerUser?->name ?? '—' }}, {{ $a->bidCount }} {{ $a->bidCount === 1 ? 'licitação' : 'licitações' }}</small>
                        </td>
                        <td class="text-nowrap small">{{ $a->startsAt?->format('d/m, H:i') }} a {{ $a->endsAt?->format('H:i') }}</td>
                        <td class="text-end text-nowrap">
                            <span class="num">{{ Labels::euro($a->winner['amount'] ?? $a->currentBid['amount'] ?? $a->startPrice) }}</span>
                            @if (! empty($a->winner['name']))<br><small class="muted">{{ $a->winner['name'] }}</small>@endif
                        </td>
                        <td class="text-nowrap">
                            @if ($a->status === 'live')<span class="tag tag-live"><span class="pulse" aria-hidden="true"></span>Ao vivo</span>
                            @elseif ($a->status === 'scheduled')<span class="tag tag-notice">Agendado</span>
                            @elseif ($a->outcome === 'sold')<span class="tag tag-lime">Vendido</span>
                            @elseif ($a->outcome === 'awaiting')<span class="tag tag-notice">À espera do vencedor</span>
                            @else<span class="tag tag-outline">Sem comprador</span>@endif
                        </td>
                    </tr>
                @endforeach
                </tbody>
            </table>
        </div>
    @endif
    {{ $auctions->links() }}
</section>
@endsection
