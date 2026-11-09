<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

// Só administradores entram no backoffice. O guard volta a ler o utilizador da BD em cada pedido,
// por isso uma conta apagada ou que mudou de papel perde logo o acesso.
class EnsureAdmin
{
    public function handle(Request $request, Closure $next)
    {
        if (Auth::user()?->role !== 'admin') {
            Auth::logout();
            $request->session()->invalidate();

            return redirect()->route('login')->withErrors(['email' => 'A sessão terminou. Volte a entrar.']);
        }

        return $next($request);
    }
}
