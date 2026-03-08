import { create } from 'zustand';
import type { Constellation, DSO, Star } from '../types';

interface CatalogState {
  stars: Star[];
  constellations: Constellation[];
  dsoObjects: DSO[];
  messierObjects: DSO[];
  isLoading: boolean;
  hasLoaded: boolean;
  error: string | null;
  loadCatalogs: () => Promise<void>;
}

export const useCatalogStore = create<CatalogState>((set, get) => ({
  stars: [],
  constellations: [],
  dsoObjects: [],
  messierObjects: [],
  isLoading: false,
  hasLoaded: false,
  error: null,
  loadCatalogs: async () => {
    const state = get();
    if (state.isLoading || state.hasLoaded) return;

    set({ isLoading: true, error: null });

    try {
      const [starsResponse, constellationsResponse, dsoResponse, messierResponse] = await Promise.all([
        fetch('/api/stars'),
        fetch('/api/constellations'),
        fetch('/api/dso'),
        fetch('/api/messier'),
      ]);

      if (!starsResponse.ok || !constellationsResponse.ok) {
        throw new Error('Failed to load Stellarium catalogs from backend.');
      }

      const [stars, constellations] = await Promise.all([
        starsResponse.json() as Promise<Star[]>,
        constellationsResponse.json() as Promise<Constellation[]>,
      ]);

      // DSO catalogs are optional - don't fail if they're not available
      let dsoObjects: DSO[] = [];
      let messierObjects: DSO[] = [];
      
      if (dsoResponse.ok) {
        dsoObjects = await dsoResponse.json() as DSO[];
      }
      if (messierResponse.ok) {
        messierObjects = await messierResponse.json() as DSO[];
      }

      set({
        stars,
        constellations,
        dsoObjects,
        messierObjects,
        isLoading: false,
        hasLoaded: true,
        error: null,
      });
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown catalog loading error.',
      });
    }
  },
}));
