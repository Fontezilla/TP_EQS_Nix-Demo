<?php

namespace App\Support;

use Illuminate\Support\Facades\Http;

// Pedidos do backoffice à API Node. As rotas /api/admin exigem um JWT de administrador:
// o backoffice assina-o com o mesmo JWT_SECRET da API, em nome do administrador com sessão iniciada.
class ApiClient
{
    private static function base64url(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    // JWT HS256 com o mesmo formato que a API emite ({ id, role, name }), válido só por 1 minuto
    public static function adminToken(): string
    {
        $user = auth()->user();
        $header = self::base64url(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $payload = self::base64url(json_encode([
            'id' => (string) $user->id, 'role' => 'admin', 'name' => $user->name,
            'iat' => time(), 'exp' => time() + 60,
        ]));
        $signature = self::base64url(hash_hmac('sha256', "$header.$payload", config('services.api.jwt_secret'), true));

        return "$header.$payload.$signature";
    }

    // O estado dos serviços, tal como a API o vê (API, Socket.io, Atlas, Blob Storage, Swagger UI)
    public static function services(): array
    {
        return Http::withToken(self::adminToken())->timeout(10)
            ->get(config('services.api.url') . '/api/admin/services')
            ->throw()->json();
    }
}
