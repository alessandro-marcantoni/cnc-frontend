import { writable, derived, get } from "svelte/store";
import type { FacilityWithStatus } from "$model/facilities/facility-with-status";
import { fetchFacilitiesByType } from "$lib/data/api";

// Configuration
const USE_MOCK_DATA = import.meta.env.DEV && !import.meta.env.VITE_API_URL;

interface TypeSeasonCache {
  data: FacilityWithStatus[];
  timestamp: number;
}

interface FacilitiesByTypeState {
  cachesByTypeAndSeason: Map<string, TypeSeasonCache>;
  currentTypeId: number | null;
  currentSeasonId: number | null;
  isLoading: boolean;
  error: string | null;
}

// Helper function to create cache key
function getCacheKey(facilityTypeId: number, seasonId: number): string {
  return `${facilityTypeId}-${seasonId}`;
}

// Initial state
const initialState: FacilitiesByTypeState = {
  cachesByTypeAndSeason: new Map(),
  currentTypeId: null,
  currentSeasonId: null,
  isLoading: false,
  error: null,
};

// Internal writable store
const facilitiesByTypeState = writable<FacilitiesByTypeState>(initialState);

/**
 * Fetch facilities by type from the API or mock data
 */
async function fetchFacilitiesByTypeData(
  facilityTypeId: number,
  seasonId: number,
): Promise<FacilityWithStatus[]> {
  return fetchFacilitiesByType(facilityTypeId, seasonId);
}

/**
 * Load facilities by type - uses cache if valid, otherwise fetches from API
 */
export async function loadFacilitiesByType(
  facilityTypeId: number,
  seasonId: number,
  forceRefresh = false,
): Promise<FacilityWithStatus[]> {
  const state = get(facilitiesByTypeState);
  const cacheKey = getCacheKey(facilityTypeId, seasonId);

  // Check if we have cached data for this type and season combination
  const cached = state.cachesByTypeAndSeason.get(cacheKey);

  // Return cached data if valid and not forcing refresh
  if (!forceRefresh && cached && cached.data.length > 0) {
    // Update current type ID and season ID if different
    if (
      state.currentTypeId !== facilityTypeId ||
      state.currentSeasonId !== seasonId
    ) {
      facilitiesByTypeState.update((s) => ({
        ...s,
        currentTypeId: facilityTypeId,
        currentSeasonId: seasonId,
      }));
    }
    return cached.data;
  }

  // Set loading state
  facilitiesByTypeState.update((s) => ({
    ...s,
    isLoading: true,
    error: null,
    currentTypeId: facilityTypeId,
    currentSeasonId: seasonId,
  }));

  try {
    const data = await fetchFacilitiesByTypeData(facilityTypeId, seasonId);

    // Update cache with fresh data for this type and season
    facilitiesByTypeState.update((s) => {
      const newCaches = new Map(s.cachesByTypeAndSeason);
      newCaches.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });

      return {
        ...s,
        cachesByTypeAndSeason: newCaches,
        isLoading: false,
        error: null,
      };
    });

    return data;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    // Update error state
    facilitiesByTypeState.update((s) => ({
      ...s,
      isLoading: false,
      error: errorMessage,
    }));

    throw error;
  }
}

/**
 * Clear all caches
 */
export function clearFacilitiesByTypeCache(): void {
  facilitiesByTypeState.set(initialState);
}

/**
 * Clear cache for a specific type (all seasons)
 */
export function clearTypeCache(facilityTypeId: number): void {
  facilitiesByTypeState.update((s) => {
    const newCaches = new Map(s.cachesByTypeAndSeason);
    // Remove all entries that start with the facility type ID
    for (const key of newCaches.keys()) {
      if (key.startsWith(`${facilityTypeId}-`)) {
        newCaches.delete(key);
      }
    }
    return {
      ...s,
      cachesByTypeAndSeason: newCaches,
    };
  });
}

/**
 * Clear cache for a specific type and season combination
 */
export function clearTypeSeasonCache(
  facilityTypeId: number,
  seasonId: number,
): void {
  const cacheKey = getCacheKey(facilityTypeId, seasonId);
  facilitiesByTypeState.update((s) => {
    const newCaches = new Map(s.cachesByTypeAndSeason);
    newCaches.delete(cacheKey);
    return {
      ...s,
      cachesByTypeAndSeason: newCaches,
    };
  });
}

// Exported derived stores for reactive access
export const facilitiesByType = derived(facilitiesByTypeState, ($state) => {
  if ($state.currentTypeId === null || $state.currentSeasonId === null)
    return [];
  const cacheKey = getCacheKey($state.currentTypeId, $state.currentSeasonId);
  const cached = $state.cachesByTypeAndSeason.get(cacheKey);
  return cached?.data || [];
});

export const isLoadingFacilitiesByType = derived(
  facilitiesByTypeState,
  ($state) => $state.isLoading,
);

export const facilitiesByTypeError = derived(
  facilitiesByTypeState,
  ($state) => $state.error,
);

export const currentFacilityTypeId = derived(
  facilitiesByTypeState,
  ($state) => $state.currentTypeId,
);

export const currentSeasonId = derived(
  facilitiesByTypeState,
  ($state) => $state.currentSeasonId,
);

// Computed store for cache age in seconds for current type and season
export const cacheAge = derived(facilitiesByTypeState, ($state) => {
  if ($state.currentTypeId === null || $state.currentSeasonId === null)
    return null;
  const cacheKey = getCacheKey($state.currentTypeId, $state.currentSeasonId);
  const cached = $state.cachesByTypeAndSeason.get(cacheKey);
  if (!cached || cached.timestamp === 0) return null;
  return Math.floor((Date.now() - cached.timestamp) / 1000);
});

/**
 * Get facilities count from cache for current type
 */
export const facilitiesCount = derived(
  facilitiesByType,
  ($facilities) => $facilities.length,
);

/**
 * Get available (not rented) facilities from cache
 */
export const availableFacilities = derived(facilitiesByType, ($facilities) =>
  $facilities.filter((f) => !f.isRented),
);

/**
 * Get rented facilities from cache for current type
 */
export const rentedFacilitiesByType = derived(facilitiesByType, ($facilities) =>
  $facilities.filter((f) => f.isRented),
);
