<?php

namespace App\Http\Controllers;

use App\Models\Product;

// Moderação de conteúdos: um produto oculto sai do catálogo da loja e não pode ser encomendado
// nem ir a leilão (a API ignora-o); o produtor continua a vê-lo, com a indicação de que foi ocultado.
class ProductController extends Controller
{
    public function toggleVisibility(string $id)
    {
        $product = Product::find($id);
        if (! $product) {
            return back()->withErrors('Produto não encontrado.');
        }

        $product->update(['hidden' => ! $product->hidden]);

        return back()->with('status', $product->hidden
            ? "{$product->name} foi ocultado: saiu do catálogo da loja."
            : "{$product->name} voltou a aparecer no catálogo.");
    }
}
