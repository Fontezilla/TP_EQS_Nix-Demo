@extends('layouts.app')

@section('title', 'Avaliações denunciadas')

@section('content')
<div class="page-header">
    <div>
        <h1 class="dashboard-title">Avaliações denunciadas</h1>
        <p>Manter volta a deixá-la visível e limpa as denúncias. Ocultar tira-a das páginas da loja.</p>
    </div>
</div>

<section class="panel" aria-label="Avaliações por moderar">
    @if ($reviews->isEmpty())
        <div class="empty-state">
            <h2 class="h3">Não há avaliações por moderar.</h2>
            <p class="muted mb-0">Quando alguém denunciar uma avaliação, ela aparece aqui.</p>
        </div>
    @else
        <ul class="admin-list">
            @foreach ($reviews as $r)
                @php $n = count($r->reportedBy ?? []); @endphp
                <li class="align-items-start">
                    <i class="bi bi-flag-fill flag mt-1" aria-hidden="true"></i>
                    <div class="flex-fill" style="min-width: 220px">
                        <p class="mb-1">“{{ $r->comment ?: 'Sem comentário' }}” <span class="rating-text">{{ $r->rating }}/5</span></p>
                        <small class="muted">
                            De {{ $r->authorName }} sobre {{ $r->producerUser?->name ?? 'produtor removido' }}, {{ $r->createdAt?->format('d/m/Y') }},
                            denunciada {{ $n === 1 ? 'por 1 utilizador' : "por $n utilizadores" }}
                        </small>
                    </div>
                    <form method="POST" action="{{ route('reviews.moderate', $r->id) }}" class="d-flex gap-2">
                        @csrf @method('PATCH')
                        <button class="btn btn-outline btn-sm" name="decision" value="keep" type="submit">Manter</button>
                        <button class="btn btn-danger-soft btn-sm" name="decision" value="hide" type="submit">Ocultar</button>
                    </form>
                </li>
            @endforeach
        </ul>
    @endif
</section>
@endsection
