@extends('layouts.app')
@php use App\Support\Labels; @endphp

@section('title', 'Pagamentos')

@section('content')
<div class="page-header">
    <div>
        <h1 class="dashboard-title">Pagamentos</h1>
        <p>O registo dos pagamentos (fictícios) da loja e dos leilões: {{ Labels::euro($totalPaid) }} recebidos no total. Do cartão só se guardam a marca e os últimos 4 dígitos.</p>
    </div>
</div>

<section class="panel" aria-label="Lista de pagamentos">
    <div class="filters">
        @include('partials.search', ['placeholder' => 'Referência (PAY-…)'])
        @include('partials.segmented', ['param' => 'method', 'label' => 'Filtrar por método', 'all' => 'Todos',
            'options' => ['card' => 'Cartão', 'mbway' => 'MB WAY']])
    </div>

    @if ($payments->isEmpty())
        <p class="muted mb-0">Nenhum pagamento com estes filtros.</p>
    @else
        <div class="table-scroll">
            <table class="data-table">
                <thead><tr><th>Referência</th><th>Comprador</th><th>Método</th><th>Encomendas</th><th class="text-end">Valor</th></tr></thead>
                <tbody>
                @foreach ($payments as $p)
                    <tr>
                        <td class="text-nowrap"><b class="num">{{ $p->reference }}</b><br><small class="muted">{{ $p->createdAt?->format('d/m/Y, H:i') }}</small></td>
                        <td>{{ $p->buyerUser?->name ?? 'Conta removida' }}</td>
                        <td class="text-nowrap">{{ $p->label() }}</td>
                        <td class="text-nowrap">
                            @foreach ($p->orders ?? [] as $orderId)
                                <span class="num">{{ Labels::orderNumber((string) $orderId) }}</span>@if (! $loop->last)<br>@endif
                            @endforeach
                            @if ($p->auction)<span class="tag tag-lime ms-1">Leilão</span>@endif
                        </td>
                        <td class="text-end num text-nowrap"><b>{{ Labels::euro($p->amount) }}</b></td>
                    </tr>
                @endforeach
                </tbody>
            </table>
        </div>
    @endif
    {{ $payments->links() }}
</section>
@endsection
