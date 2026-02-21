'use client';

import { createContext } from 'react';

export interface MousePositionStore {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => { x: number | null; y: number | null };
}

export const MousePositionContext = createContext<MousePositionStore>({
  subscribe: () => () => { },
  getSnapshot: () => ({ x: null, y: null }),
});