@extends('layouts.app')

@section('title', 'Entrar')

@section('content')
<div class="auth-layout">
    <div class="auth-layout__side">
        <h1>Backoffice</h1>
        <p class="mt-3">Valide produtores, modere avaliações e acompanhe as encomendas e os leilões do mercado.</p>
        <p>Só para contas de administrador.</p>
        <div class="tile"><img src="{{ asset('favicon.svg') }}" alt=""></div>
    </div>

    <form class="panel" method="POST" action="{{ url('/login') }}">
        @csrf
        <div class="mb-3">
            <label for="email" class="form-label">Email</label>
            <input id="email" name="email" type="email" class="form-control" value="{{ old('email') }}" autocomplete="email" required autofocus>
        </div>
        <div class="mb-3">
            <label for="password" class="form-label">Password</label>
            <input id="password" name="password" type="password" class="form-control" autocomplete="current-password" required>
        </div>
        @if ($errors->any())
            <div class="alert alert-danger py-2 small" role="alert"><i class="bi bi-exclamation-circle me-1" aria-hidden="true"></i>{{ $errors->first() }}</div>
        @endif
        <button class="btn btn-primary btn-lg w-100" type="submit">Entrar</button>

        <div class="test-accounts">
            <p class="mb-0">Conta de teste: <code>admin@exemplo.pt</code>, password <code>password123</code>.</p>
        </div>
    </form>
</div>
@endsection
