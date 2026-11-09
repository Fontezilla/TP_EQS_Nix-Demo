@extends('layouts.app')
@php use App\Support\Labels; @endphp

@section('title', 'Utilizadores')

@section('content')
<div class="page-header">
    <div><h1 class="dashboard-title">Utilizadores</h1><p>{{ $users->total() }} {{ $users->total() === 1 ? 'conta' : 'contas' }} com estes filtros.</p></div>
</div>

<section class="panel" aria-label="Lista de utilizadores">
    <div class="filters">
        @include('partials.search', ['placeholder' => 'Nome ou email'])
        @include('partials.segmented', ['param' => 'role', 'label' => 'Filtrar por papel', 'all' => 'Todos',
            'options' => ['buyer' => 'Compradores', 'producer' => 'Produtores', 'admin' => 'Administradores']])
    </div>

    @if ($users->isEmpty())
        <p class="muted mb-0">Nenhuma conta com estes filtros.</p>
    @else
        <div class="table-scroll">
            <table class="data-table">
                <thead><tr><th>Nome</th><th>Papel</th><th>Concelho</th><th>Registo</th></tr></thead>
                <tbody>
                @foreach ($users as $u)
                    <tr>
                        <td>
                            <div class="mini-product">
                                <span class="initials" aria-hidden="true">{{ Labels::initials($u->name) }}</span>
                                <div><b>{{ $u->name }}</b><br><small class="muted">{{ $u->email }}</small></div>
                            </div>
                        </td>
                        <td class="text-nowrap">
                            @if ($u->role === 'admin')<span class="tag tag-forest">Administrador</span>
                            @elseif ($u->role === 'producer')
                                <span class="tag tag-outline">Produtor</span>
                                @if ($u->producer['verified'] ?? false)<span class="tag tag-lime">Validado</span>@else<span class="tag tag-notice">Por validar</span>@endif
                            @else<span class="tag tag-outline">Comprador</span>@endif
                        </td>
                        <td>{{ $u->producer['city'] ?? '—' }}</td>
                        <td class="text-nowrap">{{ $u->createdAt?->format('d/m/Y') ?? '—' }}</td>
                    </tr>
                @endforeach
                </tbody>
            </table>
        </div>
    @endif
    {{ $users->links() }}
</section>
@endsection
