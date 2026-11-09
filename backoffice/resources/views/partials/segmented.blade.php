{{-- Filtro em pílulas, como na loja: cada opção é uma ligação que mantém os outros filtros e volta à página 1 --}}
<nav class="segmented" aria-label="{{ $label }}">
    <a href="{{ request()->fullUrlWithQuery([$param => null, 'page' => null]) }}" @class(['is-active' => ! request($param)])>{{ $all }}</a>
    @foreach ($options as $code => $text)
        <a href="{{ request()->fullUrlWithQuery([$param => $code, 'page' => null]) }}" @class(['is-active' => request($param) === (string) $code])>{{ $text }}</a>
    @endforeach
</nav>
