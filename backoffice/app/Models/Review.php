<?php

namespace App\Models;

// Avaliação: visible, reported (denunciada) ou hidden (ocultada pelo administrador)
class Review extends Model
{
    protected $table = 'reviews';

    protected function casts(): array
    {
        return ['rating' => 'integer', 'createdAt' => 'datetime', 'updatedAt' => 'datetime'];
    }

    public function producerUser()
    {
        return $this->belongsTo(User::class, 'producer');
    }
}
