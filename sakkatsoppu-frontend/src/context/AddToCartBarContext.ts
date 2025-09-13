import { createContext } from 'react';

export type AddToCartBarCtx = {
  showBar: (addedCount: number) => void;
};

export const AddToCartBarContext = createContext<AddToCartBarCtx | undefined>(undefined);
