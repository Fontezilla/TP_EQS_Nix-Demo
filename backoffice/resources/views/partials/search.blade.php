{{-- A barra de pesquisa do catálogo da loja; mantém os outros filtros escolhidos --}}
<form class="search-bar" method="GET" role="search">
    <i class="bi bi-search" aria-hidden="true"></i>
    <label for="q" class="visually-hidden">{{ $placeholder }}</label>
    <input id="q" type="search" name="q" value="{{ request('q') }}" placeholder="{{ $placeholder }}">
    @foreach (request()->except(['q', 'page']) as $key => $value)
        <input type="hidden" name="{{ $key }}" value="{{ $value }}">
    @endforeach
    <button class="btn btn-primary btn-sm" type="submit">Procurar</button>
</form>
