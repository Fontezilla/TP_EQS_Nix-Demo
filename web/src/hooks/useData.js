// Pede dados (simulados ou à API) e guarda o resultado, o erro e se ainda está a carregar
import { useEffect, useState } from 'react';
import { requestStarted, requestFinished } from '../utils/loader.js';

export function useData(fetcher, deps = []) {
  const [state, setState] = useState({ data: null, error: '', loading: true });

  useEffect(() => {
    let active = true; // ignora respostas que chegam depois de os filtros mudarem
    setState((s) => ({ ...s, loading: true }));
    requestStarted();
    fetcher()
      .then((data) => active && setState({ data, error: '', loading: false }))
      .catch((e) => active && setState({ data: null, error: e.message, loading: false }))
      .finally(requestFinished);
    return () => { active = false; };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  return state;
}
