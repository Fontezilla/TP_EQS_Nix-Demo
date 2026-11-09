@if ($paginator->hasPages())
<nav class="pager" aria-label="Páginas">
    @if ($paginator->onFirstPage())
        <span class="btn btn-outline btn-sm disabled" aria-disabled="true"><i class="bi bi-chevron-left" aria-hidden="true"></i>Anterior</span>
    @else
        <a class="btn btn-outline btn-sm" href="{{ $paginator->previousPageUrl() }}" rel="prev"><i class="bi bi-chevron-left" aria-hidden="true"></i>Anterior</a>
    @endif

    <ol>
        @foreach ($elements as $element)
            @if (is_string($element))
                <li><span aria-hidden="true">…</span></li>
            @endif
            @if (is_array($element))
                @foreach ($element as $page => $url)
                    <li>
                        @if ($page == $paginator->currentPage())
                            <span class="is-active" aria-current="page">{{ $page }}</span>
                        @else
                            <a href="{{ $url }}" aria-label="Página {{ $page }}">{{ $page }}</a>
                        @endif
                    </li>
                @endforeach
            @endif
        @endforeach
    </ol>

    @if ($paginator->hasMorePages())
        <a class="btn btn-outline btn-sm" href="{{ $paginator->nextPageUrl() }}" rel="next">Seguinte<i class="bi bi-chevron-right" aria-hidden="true"></i></a>
    @else
        <span class="btn btn-outline btn-sm disabled" aria-disabled="true">Seguinte<i class="bi bi-chevron-right" aria-hidden="true"></i></span>
    @endif
</nav>
@endif
