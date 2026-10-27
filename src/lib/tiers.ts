// src/lib/tiers.ts
import type { PoolRequestInput, NetworkRequest } from '../types';

export function determineTier(input: PoolRequestInput, history: NetworkRequest[]): 1 | 2 | 3 | 4 {
  const priorSameObject = history.some(r => r.categoryTitle?.includes(input.objectId));
  if (priorSameObject || input.amount > 5000) return 3;
  if (input.amount > 0) return 2; // object-level check for all bill/fee
  return 1;
}
