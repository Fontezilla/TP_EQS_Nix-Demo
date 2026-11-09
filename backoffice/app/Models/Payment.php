<?php

namespace App\Models;

// Pagamento fictício (coleção payments da API): só a marca e os últimos 4 dígitos do cartão
class Payment extends Model
{
    protected $table = 'payments';

    protected function casts(): array
    {
        return ['amount' => 'float', 'createdAt' => 'datetime'];
    }

    public function buyerUser()
    {
        return $this->belongsTo(User::class, 'buyer');
    }

    public function label(): string
    {
        return $this->method === 'card'
            ? ($this->card['brand'] ?? 'Cartão') . ' •••• ' . ($this->card['last4'] ?? '')
            : 'MB WAY ' . $this->phone;
    }
}
