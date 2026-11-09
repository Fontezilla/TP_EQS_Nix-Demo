<?php

namespace App\Support;

// Os códigos (em inglês) vêm da base de dados; aqui ficam os nomes que o administrador vê
class Labels
{
    const ROLES = ['buyer' => 'Comprador', 'producer' => 'Produtor', 'admin' => 'Administrador'];

    const CATEGORIES = [
        'fruit' => 'Fruta', 'vegetables' => 'Hortícolas', 'honey' => 'Mel', 'wine' => 'Vinho',
        'cheese' => 'Queijo', 'bakery' => 'Padaria', 'other' => 'Outros',
    ];

    const ORDER_STATUSES = ['pending' => 'Pendente', 'confirmed' => 'Confirmada', 'ready' => 'Pronta', 'delivered' => 'Entregue'];

    const AUCTION_STATUSES = ['scheduled' => 'Agendado', 'live' => 'Ao vivo', 'ended' => 'Terminado'];

    const OUTCOMES = ['awaiting' => 'À espera do vencedor', 'sold' => 'Vendido', 'unsold' => 'Sem comprador'];

    public static function euro(float $amount): string
    {
        return number_format($amount, 2, ',', ' ') . ' €';
    }

    // As mesmas iniciais da loja: as duas primeiras palavras com mais de 2 letras
    public static function initials(string $name): string
    {
        return collect(explode(' ', $name))->filter(fn ($w) => mb_strlen($w) > 2)->take(2)
            ->map(fn ($w) => mb_strtoupper(mb_substr($w, 0, 1)))->join('');
    }

    public static function orderNumber(string $id): string
    {
        return '#DCM-' . strtoupper(substr($id, -5));
    }
}
