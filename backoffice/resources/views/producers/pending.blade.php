@extends('layouts.app')
@php use App\Support\Labels; @endphp

@section('title', 'Produtores por validar')

@section('content')
<div class="page-header">
    <div>
        <h1 class="dashboard-title">Produtores por validar</h1>
        <p>Aprovar põe os produtos no catálogo. Rejeitar apaga a conta e os produtos que preparou.</p>
    </div>
</div>

<section class="panel" aria-label="Pedidos de validação">
    @if ($producers->isEmpty())
        <div class="empty-state">
            <h2 class="h3">Não há pedidos por validar.</h2>
            <p class="muted mb-0">Os produtores que se registarem aparecem aqui.</p>
        </div>
    @else
        <ul class="admin-list">
            @foreach ($producers as $u)
                @php $n = $productCounts[$u->id] ?? 0; @endphp
                <li class="align-items-start">
                    <span class="initials" aria-hidden="true">{{ Labels::initials($u->name) }}</span>
                    <div class="flex-fill" style="min-width: 220px">
                        <b>{{ $u->name }}</b><br>
                        <small class="muted">
                            {{ $u->producer['city'] ?? 'Sem concelho' }}@if (! empty($u->producer['address'])), {{ $u->producer['address'] }}@endif,
                            pedido {{ $u->createdAt?->format('d/m/Y') }}, {{ $u->email }}
                        </small>
                        @if (! empty($u->producer['description']))<p class="small mb-0 mt-1">{{ $u->producer['description'] }}</p>@endif
                        <p class="small muted mb-0 mt-1">{{ $n }} {{ $n === 1 ? 'produto preparado' : 'produtos preparados' }}</p>
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-danger-soft btn-sm" type="button" data-bs-toggle="modal" data-bs-target="#reject-{{ $u->id }}">Rejeitar</button>
                        <form method="POST" action="{{ route('producers.approve', $u->id) }}">
                            @csrf @method('PATCH')
                            <button class="btn btn-primary btn-sm" type="submit">Aprovar</button>
                        </form>
                    </div>
                </li>

            @endforeach
        </ul>

        {{-- Confirmação de cada rejeição, no fim do <body> (como o Bootstrap recomenda) --}}
        @push('modals')
        @foreach ($producers as $u)
            @php $n = $productCounts[$u->id] ?? 0; @endphp
            <div class="modal fade" id="reject-{{ $u->id }}" tabindex="-1" aria-labelledby="t-reject-{{ $u->id }}" aria-hidden="true">
                <div class="modal-dialog modal-dialog-centered">
                    <form class="modal-content" method="POST" action="{{ route('producers.reject', $u->id) }}">
                        @csrf @method('DELETE')
                        <div class="modal-header border-0 pb-0">
                            <h2 class="modal-title h3" id="t-reject-{{ $u->id }}">Rejeitar {{ $u->name }}?</h2>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Fechar"></button>
                        </div>
                        <div class="modal-body">
                            <p class="mb-0">
                                @if ($n === 0) A conta é apagada
                                @elseif ($n === 1) A conta e o produto que preparou são apagados
                                @else A conta e os {{ $n }} produtos que preparou são apagados @endif
                                e a pessoa deixa logo de ter acesso. Não é possível desfazer.
                            </p>
                        </div>
                        <div class="modal-footer border-0 pt-0">
                            <button type="button" class="btn btn-outline" data-bs-dismiss="modal">Cancelar</button>
                            <button type="submit" class="btn btn-danger-soft">Rejeitar e apagar a conta</button>
                        </div>
                    </form>
                </div>
            </div>

        @endforeach
        @endpush
    @endif
</section>
@endsection
