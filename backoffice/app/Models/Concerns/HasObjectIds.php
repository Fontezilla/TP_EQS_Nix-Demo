<?php

namespace App\Models\Concerns;

use MongoDB\BSON\ObjectId;

trait HasObjectIds
{
    // As referências entre coleções são ObjectId: um id em texto não encontraria nada
    public static function oid(string $id): ?ObjectId
    {
        return preg_match('/^[a-f0-9]{24}$/i', $id) ? new ObjectId($id) : null;
    }
}
