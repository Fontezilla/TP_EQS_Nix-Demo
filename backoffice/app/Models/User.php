<?php

namespace App\Models;

use App\Models\Concerns\HasObjectIds;
use MongoDB\Laravel\Auth\User as Authenticatable;

// Utilizador (coleção users da API): buyer, producer ou admin. Os dados do produtor estão embebidos em "producer".
class User extends Authenticatable
{
    use HasObjectIds;

    protected $connection = 'mongodb';
    protected $table = 'users';

    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';

    protected $guarded = [];
    protected $hidden = ['passwordHash'];

    protected function casts(): array
    {
        return ['createdAt' => 'datetime', 'updatedAt' => 'datetime'];
    }

    // A password é guardada pela API em passwordHash (bcrypt)
    public function getAuthPassword(): string
    {
        return $this->passwordHash;
    }

    // Sem "lembrar-me": o documento do utilizador é partilhado com a API e não ganha campos novos
    public function getRememberTokenName(): string
    {
        return '';
    }

    public function scopeProducers($query)
    {
        return $query->where('role', 'producer');
    }

    public function scopePendingProducers($query)
    {
        return $query->where('role', 'producer')->where('producer.verified', false);
    }

    // Produtos deste produtor (a referência "producer" é um ObjectId)
    public function products()
    {
        return Product::where('producer', self::oid($this->id));
    }
}
