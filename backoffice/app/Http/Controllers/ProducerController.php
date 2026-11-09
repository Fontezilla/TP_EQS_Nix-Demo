<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\User;

// Validar produtores: aprovar põe os produtos no catálogo; rejeitar apaga a conta e o que preparou
class ProducerController extends Controller
{
    public function pending()
    {
        $producers = User::pendingProducers()->orderBy('createdAt')->get();
        $productCounts = Product::whereIn('producer', $producers->map(fn ($u) => User::oid($u->id))->all())
            ->get()->countBy(fn ($p) => (string) $p->producer);

        return view('producers.pending', compact('producers', 'productCounts'));
    }

    public function approve(string $id)
    {
        // O filtro inclui "ainda por validar": dois administradores ao mesmo tempo não aprovam duas vezes
        $updated = User::pendingProducers()->where('_id', $id)->update(['producer.verified' => true]);
        if (! $updated) {
            return back()->withErrors('Pedido não encontrado (já foi tratado?).');
        }

        return back()->with('status', 'Produtor aprovado. Os produtos já aparecem no catálogo.');
    }

    public function reject(string $id)
    {
        $user = User::pendingProducers()->where('_id', $id)->first();
        if (! $user) {
            return back()->withErrors('Pedido não encontrado (já foi tratado?).');
        }

        Product::where('producer', User::oid($user->id))->delete();
        $user->delete();

        return back()->with('status', "A conta de {$user->name} foi rejeitada e apagada.");
    }
}
