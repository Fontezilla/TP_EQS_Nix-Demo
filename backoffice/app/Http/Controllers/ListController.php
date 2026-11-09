<?php

namespace App\Http\Controllers;

use App\Models\Auction;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\User;
use App\Support\Labels;
use Illuminate\Http\Request;

// Painel global: listas de utilizadores, encomendas, produtos e leilões, com filtros e paginação
class ListController extends Controller
{
    const PER_PAGE = 15;

    // Texto do utilizador escapado antes de ir para o $regex
    private function like(?string $q): ?string
    {
        return $q ? preg_quote(trim($q), '/') : null;
    }

    public function users(Request $request)
    {
        $query = User::query()->orderByDesc('createdAt');
        if (array_key_exists($request->role, Labels::ROLES)) {
            $query->where('role', $request->role);
        }
        if ($q = $this->like($request->q)) {
            $query->where(fn ($w) => $w->where('name', 'regex', "/$q/i")->orWhere('email', 'regex', "/$q/i"));
        }

        return view('lists.users', ['users' => $query->paginate(self::PER_PAGE)->withQueryString()]);
    }

    public function orders(Request $request)
    {
        $query = Order::with(['buyerUser', 'producerUser'])->orderByDesc('createdAt');
        if (in_array($request->status, Order::STATUSES, true)) {
            $query->where('status', $request->status);
        }
        if (in_array($request->source, ['shop', 'auction'], true)) {
            $query->where('source', $request->source);
        }

        return view('lists.orders', ['orders' => $query->paginate(self::PER_PAGE)->withQueryString()]);
    }

    public function products(Request $request)
    {
        $query = Product::with('owner')->orderBy('name');
        if (array_key_exists($request->category, Labels::CATEGORIES)) {
            $query->where('category', $request->category);
        }
        if ($q = $this->like($request->q)) {
            $query->where('name', 'regex', "/$q/i");
        }
        if ($request->boolean('hidden')) {
            $query->where('hidden', true);
        }
        if ($request->boolean('low')) {
            $query->whereRaw(['$expr' => ['$lte' => ['$stock', '$minStock']]]);
        }

        return view('lists.products', ['products' => $query->paginate(self::PER_PAGE)->withQueryString()]);
    }

    public function payments(Request $request)
    {
        $query = Payment::with('buyerUser')->orderByDesc('createdAt');
        if (in_array($request->method, ['card', 'mbway'], true)) {
            $query->where('method', $request->method);
        }
        if ($q = $this->like($request->q)) {
            $query->where('reference', 'regex', "/$q/i");
        }

        return view('lists.payments', [
            'payments' => $query->paginate(self::PER_PAGE)->withQueryString(),
            'totalPaid' => (float) Payment::sum('amount'),
        ]);
    }

    public function auctions(Request $request)
    {
        $query = Auction::with('producerUser')->orderByDesc('endsAt');
        if (array_key_exists($request->status, Labels::AUCTION_STATUSES)) {
            $query->where('status', $request->status);
        }

        return view('lists.auctions', [
            'auctions' => $query->paginate(self::PER_PAGE)->withQueryString(),
            'liveAuctions' => LiveController::liveAuctions(),
        ]);
    }
}
