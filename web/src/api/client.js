// Cliente HTTP da API: junta o URL base e o token JWT a cada pedido
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
export const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA === 'true';

export async function api(path, { method = 'GET', body, token } = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}/api${path}`, {
      method,
      headers: {
        // Com FormData (ficheiros), o browser define sozinho o Content-Type multipart
        ...(body && !(body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined
    });
  } catch {
    // O fetch só falha assim quando não chega ao servidor (API desligada ou sem rede)
    throw new Error('Não foi possível ligar ao servidor. Tente novamente daqui a pouco.');
  }
  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(data?.error || `Erro ${response.status}`);
    error.status = response.status; // ex.: 401 -> a sessão terminou
    throw error;
  }
  return data;
}
