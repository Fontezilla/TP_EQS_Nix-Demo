// Autenticação. Simulado: todas as contas de teste usam a password "password123".
import { api, USE_MOCK_DATA } from './client.js';
import { db, respond, fail } from './mock.js';

const TEST_PASSWORD = 'password123';
const toPublic = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role });

export function login(email, password) {
  if (!USE_MOCK_DATA) return api('/auth/login', { method: 'POST', body: { email, password } });

  const u = db.users.find((x) => x.email === email.trim().toLowerCase());
  // A mesma mensagem para email e password errados, para não revelar que contas existem
  if (!u || password !== (u.password || TEST_PASSWORD)) return fail(401, 'O email ou a password não estão corretos.');
  return respond({ token: `mock.${u._id}`, user: toPublic(u) });
}

// data: { role, name, email, password, producer?: { city, address, description } }
export function register(data) {
  if (!USE_MOCK_DATA) return api('/auth/register', { method: 'POST', body: data });

  const email = data.email.trim().toLowerCase();
  if (db.users.some((u) => u.email === email)) return fail(409, 'Já existe uma conta com este email.');
  const u = {
    _id: `u-${Date.now()}`, name: data.name.trim(), email, role: data.role, password: data.password,
    createdAt: new Date().toISOString(),
    ...(data.role === 'producer' && { producer: { ...data.producer, verified: false } })
  };
  db.users.push(u);
  return respond({ token: `mock.${u._id}`, user: toPublic(u) });
}
