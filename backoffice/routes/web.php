<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ListController;
use App\Http\Controllers\LiveController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProducerController;
use App\Http\Controllers\ReviewController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
});

Route::middleware(['auth', 'admin'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');

    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    Route::get('/producers/pending', [ProducerController::class, 'pending'])->name('producers.pending');
    Route::patch('/producers/{id}/approve', [ProducerController::class, 'approve'])->name('producers.approve');
    Route::delete('/producers/{id}', [ProducerController::class, 'reject'])->name('producers.reject');

    Route::get('/reviews', [ReviewController::class, 'index'])->name('reviews.index');
    Route::patch('/reviews/{id}', [ReviewController::class, 'moderate'])->name('reviews.moderate');

    Route::get('/users', [ListController::class, 'users'])->name('users.index');
    Route::get('/orders', [ListController::class, 'orders'])->name('orders.index');
    Route::get('/products', [ListController::class, 'products'])->name('products.index');
    Route::get('/auctions', [ListController::class, 'auctions'])->name('auctions.index');
    Route::get('/payments', [ListController::class, 'payments'])->name('payments.index');
    Route::patch('/products/{id}/visibility', [ProductController::class, 'toggleVisibility'])->name('products.visibility');

    // Partes do resumo atualizadas sem recarregar (pedidas pelo JavaScript da página)
    Route::get('/auctions/live', [LiveController::class, 'auctions'])->name('auctions.live');
    Route::get('/services', [LiveController::class, 'services'])->name('services');
});
