<?php

namespace App\Http\Controllers;

use App\Models\Auction;
use App\Support\ApiClient;
use Illuminate\Support\Facades\DB;
use Throwable;

// Partes do resumo que se atualizam sem recarregar a página: leilões ao vivo e estado dos serviços
class LiveController extends Controller
{
    public static function liveAuctions()
    {
        return Auction::with(['producerUser', 'productItem'])->where('status', 'live')->orderBy('endsAt')->get();
    }

    // GET /auctions/live: a lista é pedida outra vez quando a API avisa que um leilão começou ou terminou
    public function auctions()
    {
        return view('partials.live-auctions', ['auctions' => self::liveAuctions()]);
    }

    // GET /services: os serviços vistos pela API e os do próprio backoffice
    public function services()
    {
        $rows = [];
        try {
            $rows = ApiClient::services();
        } catch (Throwable $e) {
            $rows[] = ['name' => 'API REST', 'detail' => 'Node.js · Express', 'status' => 'down', 'ms' => 0,
                'info' => 'sem resposta: os outros serviços não puderam ser verificados'];
        }

        $start = microtime(true);
        try {
            DB::connection('mongodb')->getDatabase()->command(['ping' => 1]);
            $rows[] = ['name' => 'Backoffice', 'detail' => 'Laravel ' . app()->version() . ' · PHP ' . PHP_MAJOR_VERSION . '.' . PHP_MINOR_VERSION,
                'status' => 'ok', 'ms' => (int) ((microtime(true) - $start) * 1000), 'info' => 'ligado ao MongoDB Atlas'];
        } catch (Throwable $e) {
            $rows[] = ['name' => 'Backoffice', 'detail' => 'Laravel', 'status' => 'down', 'ms' => 0, 'info' => 'sem ligação ao MongoDB Atlas'];
        }

        return view('partials.services', ['services' => $rows, 'checkedAt' => now()]);
    }
}
