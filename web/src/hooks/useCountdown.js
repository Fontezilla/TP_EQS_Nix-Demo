// Contagem decrescente até endsAt. No Passo 7 recebe o desvio do relógio do servidor.
import { useEffect, useState } from 'react';

export function useCountdown(endsAt, offset = 0) {
  const compute = () => Math.max(0, Date.parse(endsAt) - (Date.now() + offset));
  const [remaining, setRemaining] = useState(compute);

  useEffect(() => {
    setRemaining(compute());
    const id = setInterval(() => setRemaining(compute()), 1000);
    return () => clearInterval(id);
  }, [endsAt, offset]); // eslint-disable-line react-hooks/exhaustive-deps

  const s = Math.floor(remaining / 1000);
  const h = Math.floor(s / 3600);
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return { remaining, text: h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`, finished: remaining === 0 };
}
