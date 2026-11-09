<?php

namespace App\Http\Controllers;

use App\Models\Review;
use Illuminate\Http\Request;

// Moderar avaliações denunciadas: manter (volta a ficar visível) ou ocultar
class ReviewController extends Controller
{
    public function index()
    {
        $reviews = Review::with('producerUser')->where('status', 'reported')->get()
            ->sortByDesc(fn ($r) => count($r->reportedBy ?? []));

        return view('reviews.index', compact('reviews'));
    }

    public function moderate(Request $request, string $id)
    {
        $decision = $request->validate(
            ['decision' => 'required|in:keep,hide'],
            ['decision.*' => 'Escolha manter ou ocultar.']
        )['decision'];

        $changes = $decision === 'keep' ? ['status' => 'visible', 'reportedBy' => []] : ['status' => 'hidden'];
        $updated = Review::where('_id', $id)->where('status', 'reported')->update($changes);
        if (! $updated) {
            return back()->withErrors('Avaliação não encontrada (já foi moderada?).');
        }

        return back()->with('status', $decision === 'keep' ? 'Avaliação mantida.' : 'Avaliação ocultada.');
    }
}
