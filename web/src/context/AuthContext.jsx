// Estado global da sessão (utilizador + token)
import { createContext, useContext, useEffect, useState } from 'react';
import * as auth from '../api/auth.js';
import { api, USE_MOCK_DATA } from '../api/client.js';

const AuthContext = createContext(null);
const KEY = 'session';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    try { return JSON.parse(localStorage.getItem(KEY)) || null; } catch { return null; }
  });

  // Ao abrir o site, confirma no servidor que a sessão guardada ainda é válida
  // (token expirado, ou conta apagada, por exemplo depois de voltar a correr o seed)
  useEffect(() => {
    if (!session?.token || USE_MOCK_DATA) return;
    const checked = session.token;
    api('/auth/me', { token: checked }).catch((e) => {
      if (e.status !== 401 && e.status !== 404) return;
      // Só termina esta sessão: se entretanto a pessoa voltou a entrar, a sessão nova fica
      setSession((current) => {
        if (current?.token !== checked) return current;
        try { localStorage.removeItem(KEY); } catch { /* ignorar */ }
        return null;
      });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function saveSession(next) {
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* sem armazenamento: fica só em memória */ }
    setSession(next);
  }

  async function login(email, password) {
    const next = await auth.login(email, password);
    saveSession(next);
    return next.user;
  }

  async function register(data) {
    const next = await auth.register(data);
    saveSession(next);
    return next.user;
  }

  // Depois de o utilizador mudar os seus dados (ex.: o nome da exploração)
  function updateUser(partial) {
    saveSession({ ...session, user: { ...session.user, ...partial } });
  }

  function logout() {
    try { localStorage.removeItem(KEY); } catch { /* ignorar */ }
    setSession(null);
  }

  return (
    <AuthContext.Provider value={{
      user: session?.user || null,
      token: session?.token || null,
      login, register, logout, updateUser
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
