// Passo 7: sala de um leilão em tempo real, sobre a ligação partilhada (SocketContext).
// Visitantes assistem; compradores licitam. A validação da licitação é sempre feita no servidor.
import { useEffect, useState } from 'react';
import { USE_MOCK_DATA } from '../api/client.js';
import { getAuction } from '../api/auctions.js';
import { useSocket } from '../context/SocketContext.jsx';

export function useAuction(id) {
  const socket = useSocket();
  const [auction, setAuction] = useState(null);
  const [bids, setBids] = useState([]);
  const [viewers, setViewers] = useState(0);
  const [offset, setOffset] = useState(0); // relógio do servidor - relógio deste computador
  const [rejection, setRejection] = useState(null);
  const [connected, setConnected] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    // Sem API (dados simulados) não há tempo real: mostra o leilão tal como está
    if (USE_MOCK_DATA) {
      getAuction(id).then(({ bids: list, ...a }) => { setAuction(a); setBids(list); }).catch(() => setNotFound(true));
      return undefined;
    }
    if (!socket) return undefined;

    const isThis = (e) => String(e?.auction) === id; // ignora eventos de uma sala que já se deixou
    const handlers = {
      // Também ao voltar a ligar (ex.: a rede caiu): entra outra vez na sala e recebe o estado atual
      connect: () => { setConnected(true); socket.emit('join', id); },
      disconnect: () => setConnected(false),
      state: (e) => {
        if (e.auction._id !== id) return;
        setAuction(e.auction);
        setBids(e.bids);
        setOffset(e.now - Date.now());
      },
      'not-found': (e) => isThis(e) && setNotFound(true),
      presence: (e) => isThis(e) && setViewers(e.n),
      'new-bid': (e) => {
        if (!isThis(e)) return;
        setAuction((a) => a && { ...a, currentBid: e.currentBid, bidCount: e.bidCount });
        setBids((list) => [e.bid, ...list].slice(0, 20));
        setRejection(null);
      },
      rejected: setRejection,
      started: (e) => isThis(e) && socket.emit('join', id),
      ended: (e) => isThis(e) && setAuction((a) => a && { ...a, status: 'ended', currentBid: e.currentBid }),
      // Depois de terminar: à espera da confirmação do vencedor, vendido ou sem comprador
      outcome: (e) => isThis(e) && setAuction((a) => a && { ...a, status: 'ended', outcome: e.outcome, winner: e.winner, order: e.order })
    };

    Object.entries(handlers).forEach(([event, fn]) => socket.on(event, fn));
    if (socket.connected) socket.emit('join', id);

    return () => {
      socket.emit('leave', id); // sai da sala ao mudar de página; a ligação continua para o resto do site
      Object.entries(handlers).forEach(([event, fn]) => socket.off(event, fn));
    };
  }, [socket, id]);

  const placeBid = (amount) => {
    if (USE_MOCK_DATA || !socket) return setRejection({ message: 'Licitar precisa da API ligada.' });
    setRejection(null);
    socket.emit('bid', { auctionId: id, amount });
  };

  // Volta a pedir o estado atual da sala (ex.: depois de confirmar ou recusar a compra)
  const refresh = () => socket?.emit('join', id);

  return {
    auction, bids, viewers, offset, rejection, notFound, placeBid, refresh,
    connectionError: connected ? '' : 'Sem ligação ao servidor. A tentar outra vez…'
  };
}
