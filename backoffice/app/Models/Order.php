<?php

namespace App\Models;

// Encomenda: as linhas (items) e o histórico estão embebidos, como na API
class Order extends Model
{
    protected $table = 'orders';

    const STATUSES = ['pending', 'confirmed', 'ready', 'delivered'];

    protected function casts(): array
    {
        return ['createdAt' => 'datetime', 'reviewed' => 'boolean'];
    }

    public function buyerUser()
    {
        return $this->belongsTo(User::class, 'buyer');
    }

    public function producerUser()
    {
        return $this->belongsTo(User::class, 'producer');
    }

    // O total não é guardado: soma das linhas (o mesmo virtual que a API calcula)
    public function getTotalAttribute(): float
    {
        return collect($this->items ?? [])->sum(fn ($i) => $i['unitPrice'] * $i['quantity']);
    }
}
