import { useContext } from 'react';
import { AddToCartBarContext } from '../context/AddToCartBarContext';

export function useAddToCartBar() {
  const ctx = useContext(AddToCartBarContext);
  if (!ctx) throw new Error('useAddToCartBar must be used within AddToCartBarProvider');
  return ctx;
}
