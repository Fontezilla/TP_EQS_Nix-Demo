<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use MongoDB\BSON\UTCDateTime;

// O PHP faz as consultas uma a seguir à outra e cada ida ao Atlas custa ~110 ms.
// Por isso o resumo usa 3 agregações (uma por coleção) em vez de ~11 consultas soltas.
class DashboardController extends Controller
{
    // Resultados como arrays PHP, para poderem ser hidratados em modelos Eloquent
    const ARRAYS = ['typeMap' => ['root' => 'array', 'document' => 'array', 'array' => 'array']];

    public function index()
    {
        $db = DB::connection('mongodb');
        $today = new UTCDateTime(now()->startOfDay());
        $weekAgo = new UTCDateTime(now()->subDays(7));
        $count = fn (array $facet) => $facet[0]['n'] ?? 0;

        // 1) Utilizadores: totais, produtores por estado e os pedidos de validação mais antigos
        [$u] = $db->getCollection('users')->aggregate([['$facet' => [
            'total' => [['$count' => 'n']],
            'newThisWeek' => [['$match' => ['createdAt' => ['$gte' => $weekAgo]]], ['$count' => 'n']],
            'verified' => [['$match' => ['role' => 'producer', 'producer.verified' => true]], ['$count' => 'n']],
            'pending' => [['$match' => ['role' => 'producer', 'producer.verified' => false]], ['$count' => 'n']],
            'oldestPending' => [
                ['$match' => ['role' => 'producer', 'producer.verified' => false]],
                ['$sort' => ['createdAt' => 1]], ['$limit' => 5], ['$project' => ['passwordHash' => 0]],
            ],
        ]]], self::ARRAYS)->toArray();

        // 2) Encomendas: vendas de hoje e as últimas 5, já com o nome do comprador e do produtor ($lookup)
        $total = ['$reduce' => ['input' => '$items', 'initialValue' => 0,
            'in' => ['$add' => ['$$value', ['$multiply' => ['$$this.unitPrice', '$$this.quantity']]]]]];
        $name = [['$project' => ['name' => 1]]];
        [$o] = $db->getCollection('orders')->aggregate([['$facet' => [
            'today' => [['$match' => ['createdAt' => ['$gte' => $today]]], ['$group' => ['_id' => null, 'n' => ['$sum' => 1], 'total' => ['$sum' => $total]]]],
            'recent' => [
                ['$sort' => ['createdAt' => -1]], ['$limit' => 5],
                ['$lookup' => ['from' => 'users', 'localField' => 'buyer', 'foreignField' => '_id', 'pipeline' => $name, 'as' => 'buyerUser']],
                ['$lookup' => ['from' => 'users', 'localField' => 'producer', 'foreignField' => '_id', 'pipeline' => $name, 'as' => 'producerUser']],
            ],
        ]]], self::ARRAYS)->toArray();

        // 3) Leilões ao vivo e avaliações denunciadas numa só ida ($unionWith junta as duas coleções)
        $other = collect($db->getCollection('auctions')->aggregate([
            ['$match' => ['status' => 'live']], ['$count' => 'n'], ['$set' => ['k' => 'live']],
            ['$unionWith' => ['coll' => 'reviews', 'pipeline' => [
                ['$match' => ['status' => 'reported']], ['$count' => 'n'], ['$set' => ['k' => 'reported']],
            ]]],
        ], self::ARRAYS)->toArray())->pluck('n', 'k');

        return view('dashboard', [
            'stats' => [
                'users' => $count($u['total']),
                'newThisWeek' => $count($u['newThisWeek']),
                'producers' => $count($u['verified']),
                'pending' => $count($u['pending']),
                'ordersToday' => $o['today'][0]['n'] ?? 0,
                'salesToday' => $o['today'][0]['total'] ?? 0,
                'liveAuctions' => $other['live'] ?? 0,
                'reported' => $other['reported'] ?? 0,
            ],
            'pending' => User::hydrate($u['oldestPending']),
            'recentOrders' => collect($o['recent'])->map(fn ($row) => $this->orderWithNames($row)),
            'liveAuctions' => LiveController::liveAuctions(),
        ]);
    }

    // Transforma uma linha da agregação num modelo Order com as relações já preenchidas (sem mais consultas)
    private function orderWithNames(array $row): Order
    {
        $buyer = $row['buyerUser'][0] ?? null;
        $producer = $row['producerUser'][0] ?? null;
        unset($row['buyerUser'], $row['producerUser']);

        $order = Order::hydrate([$row])->first();
        $order->setRelation('buyerUser', $buyer ? User::hydrate([$buyer])->first() : null);
        $order->setRelation('producerUser', $producer ? User::hydrate([$producer])->first() : null);

        return $order;
    }
}
