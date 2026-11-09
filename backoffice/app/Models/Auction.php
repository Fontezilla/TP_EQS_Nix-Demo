<?php

namespace App\Models;

// Leilão (só leitura no backoffice: as licitações e o ciclo são da API)
class Auction extends Model
{
    protected $table = 'auctions';

    protected function casts(): array
    {
        return ['startsAt' => 'datetime', 'endsAt' => 'datetime', 'bidCount' => 'integer'];
    }

    public function producerUser()
    {
        return $this->belongsTo(User::class, 'producer');
    }

    // O nome "product" já é o campo com a referência; a relação tem outro nome
    public function productItem()
    {
        return $this->belongsTo(Product::class, 'product');
    }
}
