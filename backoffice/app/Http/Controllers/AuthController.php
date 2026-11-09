<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function showLogin()
    {
        return view('auth.login');
    }

    // As contas são as da API: a password está em bcrypt (bcryptjs), que o password_verify do PHP aceita
    public function login(Request $request)
    {
        $data = $request->validate(
            ['email' => 'required|email', 'password' => 'required'],
            ['email.required' => 'Indique o email.', 'email.email' => 'O email não é válido.', 'password.required' => 'Indique a password.']
        );

        $user = User::where('email', strtolower(trim($data['email'])))->first();

        // A mesma mensagem para tudo, para não revelar que contas existem nem quais são de administrador
        if (! $user || $user->role !== 'admin' || ! password_verify($data['password'], $user->passwordHash)) {
            return redirect()->route('login')->withErrors(['email' => 'O email ou a password não estão corretos.'])->onlyInput('email');
        }

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->intended(route('dashboard'));
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
