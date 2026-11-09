@php use App\Support\Labels; @endphp
{{-- Leilões a decorrer: a licitação atual e o número de licitações mudam em direto (public/js/live.js) --}}
@if ($auctions->isEmpty())
    <div class="panel-empty">
        <i class="bi bi-hammer fs-3" aria-hidden="true"></i>
        <p class="mb-1 mt-2">Nenhum leilão a decorrer neste momento.</p>
        <a class="text-link small" href="{{ route('auctions.index', ['status' => 'scheduled']) }}">Ver os próximos leilões</a>
    </div>
@else
    <ul class="rows">
        @foreach ($auctions as $a)
            <li class="row-item" data-auction="{{ $a->id }}" data-cat="{{ $a->productItem?->category ?? 'other' }}">
                <span class="cat-bar" aria-hidden="true"></span>
                <div class="main">
                    <b>{{ $a->lot }}</b>
                    <small>{{ $a->producerUser?->name ?? '—' }}, <span class="bids">{{ $a->bidCount }} {{ $a->bidCount === 1 ? 'licitação' : 'licitações' }}</span></small>
                </div>
                <div class="end">
                    <div>
                        <b class="amount num">{{ Labels::euro($a->currentBid['amount'] ?? $a->startPrice) }}</b>
                        <small class="num" data-ends="{{ $a->endsAt?->toIso8601String() }}">termina às {{ $a->endsAt?->format('H:i') }}</small>
                    </div>
                </div>
            </li>
        @endforeach
    </ul>
@endif
