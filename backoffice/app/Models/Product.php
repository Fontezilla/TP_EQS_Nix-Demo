<?php

namespace App\Models;

class Product extends Model
{
    protected $table = 'products';

    protected function casts(): array
    {
        return ['price' => 'float', 'stock' => 'integer', 'minStock' => 'integer', 'organic' => 'boolean', 'hidden' => 'boolean', 'createdAt' => 'datetime'];
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'producer');
    }

    public function isLowStock(): bool
    {
        return $this->stock <= ($this->minStock ?? 10);
    }
}
