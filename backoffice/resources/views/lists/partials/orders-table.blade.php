@php use App\Support\Labels; $compact = $compact ?? false; @endphp
@if ($orders->isEmpty())
    <p class="muted mb-0">Não há encomendas com estes filtros.</p>
@else
    <div class="table-scroll">
        <table class="data-table">
            <thead><tr><th>N.º</th><th>Comprador</th>@unless ($compact)<th>Produtor</th><th>Entrega</th>@endunless<th class="text-end">Total</th>@unless ($compact)<th>Pagamento</th>@endunless<th>Estado</th></tr></thead>
            <tbody>
            @foreach ($orders as $o)
                <tr>
                    <td class="text-nowrap"><b>{{ Labels::orderNumber($o->id) }}</b><br><small class="muted">{{ $o->createdAt?->format('d/m/Y, H:i') }}</small></td>
                    <td>
                        {{ $o->buyerUser?->name ?? 'Conta removida' }}
                        @if ($o->source === 'auction')<span class="tag tag-lime ms-1">Leilão</span>@endif
                        @if ($compact)<br><small class="muted">{{ $o->producerUser?->name ?? 'Conta removida' }}</small>@endif
                    </td>
                    @unless ($compact)
                        <td>{{ $o->producerUser?->name ?? 'Conta removida' }}</td>
                        <td>{{ ($o->delivery['type'] ?? 'pickup') === 'delivery' ? 'Entrega' : 'Levantamento' }}</td>
                    @endunless
                    <td class="text-end num text-nowrap">{{ Labels::euro($o->total) }}</td>
                    @unless ($compact)
                        <td class="text-nowrap">
                            @if (! empty($o->payment['reference']))
                                {{ $o->payment['label'] }}<br><small class="muted num">{{ $o->payment['reference'] }}</small>
                            @else<span class="muted">—</span>@endif
                        </td>
                    @endunless
                    <td><span class="status status-{{ $o->status }}">{{ Labels::ORDER_STATUSES[$o->status] ?? $o->status }}</span></td>
                </tr>
            @endforeach
            </tbody>
        </table>
    </div>
@endif
