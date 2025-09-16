import { useEffect, useMemo, useRef } from 'react';
import { useStockContext } from '../context/StockContext';

export function useStockSubscription(ids: string[] | undefined) {
  const { updateWatched } = useStockContext();
  const prevKey = useRef<string>('');

  const list = useMemo(() => Array.from(new Set((ids || []).filter(Boolean))), [ids]);
  const key = list.join(',');

  useEffect(() => {
    if (key === prevKey.current) return;
    prevKey.current = key;
    updateWatched(list);
  }, [key, list, updateWatched]);
}
