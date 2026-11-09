@php $names = ['ok' => 'Operacional', 'slow' => 'Resposta lenta', 'down' => 'Em baixo']; @endphp
<ul class="rows">
    @foreach ($services as $s)
        <li class="row-item">
            <span class="light light-{{ $s['status'] }}" aria-hidden="true"></span>
            <div class="main">
                <b>{{ $s['name'] }}</b>
                <small>{{ $s['detail'] }}, {{ $s['info'] }}</small>
            </div>
            <span class="end small muted" title="{{ $s['ms'] }} ms">{{ $names[$s['status']] ?? $s['status'] }}</span>
        </li>
    @endforeach
</ul>
<p class="panel-foot">Verificado às {{ $checkedAt->format('H:i:s') }}.</p>
