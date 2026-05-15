import type { TransitMode } from './ors';

export const CONTOURS_BY_MODE: Record<TransitMode, number[]> = {
  walking: [5, 10, 20, 30, 45, 60],
  biking: [5, 10, 15, 20, 30, 45],
};

export const POI_TARGET_BY_MODE: Record<TransitMode, number> = {
  walking: 30,
  biking: 15,
};
