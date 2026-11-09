// Contador que sobe quando o servidor avisa (Socket.io) que algo mudou: usado como dependência
// do useData para voltar a pedir os dados só quando é preciso, sem estar sempre a perguntar.
// Também sobe ao voltar a ligar, para apanhar o que mudou enquanto a ligação esteve em baixo.
import { useRef, useState } from 'react';
import { useEvents } from '../context/SocketContext.jsx';

export function useRefresh(events) {
  const [version, setVersion] = useState(0);
  const timer = useRef(null);

  // Vários avisos seguidos (ex.: licitações rápidas) dão um só pedido
  useEvents([...events, 'connect'], () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setVersion((v) => v + 1), 300);
  });

  return version;
}

// Eventos que mudam as listas de leilões (estado ou licitação atual)
export const AUCTION_EVENTS = ['auctions-changed', 'auction-updated'];
