import { createContext } from "react";
export const MapProjection = createContext<{
  project: (coordinate: [number, number]) => Promise<[number, number]>;
  revision: number;
} | null>(null);
