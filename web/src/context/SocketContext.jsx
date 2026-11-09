// Passo 7: uma só ligação Socket.io para todo o site, com o token da sessão (ou como visitante).
// Volta a ligar quando a sessão muda (entrar/sair), para o servidor saber quem é o utilizador.
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { API_URL, USE_MOCK_DATA } from '../api/client.js';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token, logout } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (USE_MOCK_DATA) return undefined; // sem API não há tempo real
    const s = io(API_URL, { auth: token ? { token } : {} });
    // Token expirado ou inválido: termina a sessão e liga outra vez como visitante
    s.on('connect_error', (e) => { if (token && e.message === 'não autorizado') logout(); });
    setSocket(s);
    return () => { s.disconnect(); setSocket(null); };
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export const useSocket = () => useContext(SocketContext);

// Corre handler sempre que chega um dos eventos (o handler mais recente, sem voltar a registar)
export function useEvents(events, handler) {
  const socket = useSocket();
  const latest = useRef(handler);
  latest.current = handler;

  useEffect(() => {
    if (!socket) return undefined;
    const listener = (...args) => latest.current(...args);
    events.forEach((e) => socket.on(e, listener));
    return () => events.forEach((e) => socket.off(e, listener));
  }, [socket, events.join()]); // eslint-disable-line react-hooks/exhaustive-deps
}
