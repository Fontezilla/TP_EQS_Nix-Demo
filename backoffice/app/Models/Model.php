<?php

namespace App\Models;

use App\Models\Concerns\HasObjectIds;
use MongoDB\Laravel\Eloquent\Model as MongoModel;

// Base dos modelos: as mesmas coleções e os mesmos nomes de campos que a API Node (Mongoose)
abstract class Model extends MongoModel
{
    use HasObjectIds;

    protected $connection = 'mongodb';

    // O Mongoose usa createdAt/updatedAt (camelCase)
    const CREATED_AT = 'createdAt';
    const UPDATED_AT = 'updatedAt';

    protected $guarded = [];
}
