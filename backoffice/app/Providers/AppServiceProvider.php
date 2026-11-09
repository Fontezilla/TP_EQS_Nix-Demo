<?php

namespace App\Providers;

use Illuminate\Pagination\Paginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\View;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // A paginação com o mesmo desenho da loja (resources/views/pagination/pager.blade.php)
        Paginator::defaultView('pagination.pager');

        // Os números do menu (produtores e avaliações por tratar), numa só ida à base de dados
        View::composer('layouts.app', function ($view) {
            if (! auth()->check()) {
                return;
            }
            $counts = collect(DB::connection('mongodb')->getCollection('users')->aggregate([
                ['$match' => ['role' => 'producer', 'producer.verified' => false]], ['$count' => 'n'], ['$set' => ['k' => 'producers']],
                ['$unionWith' => ['coll' => 'reviews', 'pipeline' => [
                    ['$match' => ['status' => 'reported']], ['$count' => 'n'], ['$set' => ['k' => 'reviews']],
                ]]],
            ], ['typeMap' => ['root' => 'array', 'document' => 'array']])->toArray())->pluck('n', 'k');
            $view->with('menuCounts', $counts);
        });
    }
}
