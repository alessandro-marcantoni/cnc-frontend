import { writable, derived, get } from "svelte/store";
import type { RentedFacility } from "$model/facilities/rented-facility";
import { fetchRentedFacilities } from "$lib/data/api";

// Configuration
const USE_MOCK_DATA = import.meta.env.DEV && !import.meta.env.VITE_API_URL;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache structure
interface CacheEntry {
  data: RentedFacility[];
  timestamp: number;
}

// Store state
interface RentedFacilitiesState {
  cache: Map<string, CacheEntry>;
  loading: Set<string>;
  errors: Map<string, string>;
}

const initialState: RentedFacilitiesState = {
  cache: new Map(),
  loading: new Set(),
  errors: new Map(),
};

// Internal store
const rentedFacilitiesStore = writable<RentedFacilitiesState>(initialState);

/**
 * Creates a cache key from memberId and optional season
 */
function getCacheKey(memberId: number, season?: number): string {
  return season !== undefined ? `${memberId}-${season}` : `${memberId}`;
}

// Public derived stores
export const isLoadingRentedFacilities = derived(
  rentedFacilitiesStore,
  ($store) => (memberId: number, season?: number) =>
    $store.loading.has(getCacheKey(memberId, season)),
);

export const rentedFacilitiesError = derived(
  rentedFacilitiesStore,
  ($store) => (memberId: number, season?: number) =>
    $store.errors.get(getCacheKey(memberId, season)) || null,
);

export const rentedFacilities = derived(
  rentedFacilitiesStore,
  ($store) => (memberId: number, season?: number) =>
    $store.cache.get(getCacheKey(memberId, season))?.data || [],
);

/**
 * Fetches rented facilities from API or mock data
 */
async function fetchRentedFacilitiesData(
  memberId: number,
  season?: number,
): Promise<RentedFacility[]> {
  if (USE_MOCK_DATA) {
    console.info(
      "Using mock data for rented facilities (no API URL configured)",
    );
    // Simulate network delay in development
    await new Promise((resolve) => setTimeout(resolve, 500));
    // Return empty array for mock data (or add mock data if needed)
    return [];
  }

  return fetchRentedFacilities(memberId, season);
}

/**
 * Checks if cache entry is still valid
 */
function isCacheValid(entry: CacheEntry | undefined): boolean {
  if (!entry) return false;
  return Date.now() - entry.timestamp < CACHE_DURATION;
}

/**
 * Loads rented facilities for a member with caching
 * @param memberId - The ID of the member
 * @param forceRefresh - If true, bypass cache and fetch fresh data
 * @param season - Optional season to filter facilities
 */
export async function loadRentedFacilities(
  memberId: number,
  forceRefresh = false,
  season?: number,
): Promise<RentedFacility[]> {
  const cacheKey = getCacheKey(memberId, season);
  const state = get(rentedFacilitiesStore);

  // Check cache
  const cachedEntry = state.cache.get(cacheKey);
  if (!forceRefresh && isCacheValid(cachedEntry)) {
    return cachedEntry!.data;
  }

  // Check if already loading
  if (state.loading.has(cacheKey)) {
    // Wait for the ongoing request
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        const currentState = get(rentedFacilitiesStore);
        if (!currentState.loading.has(cacheKey)) {
          clearInterval(checkInterval);
          const entry = currentState.cache.get(cacheKey);
          if (entry) {
            resolve(entry.data);
          } else {
            const error = currentState.errors.get(cacheKey);
            reject(new Error(error || "Failed to load rented facilities"));
          }
        }
      }, 100);
    });
  }

  // Start loading
  rentedFacilitiesStore.update((state) => ({
    ...state,
    loading: new Set(state.loading).add(cacheKey),
    errors: (() => {
      const errors = new Map(state.errors);
      errors.delete(cacheKey);
      return errors;
    })(),
  }));

  try {
    const facilities = await fetchRentedFacilitiesData(memberId, season);

    // Update cache
    rentedFacilitiesStore.update((state) => {
      const cache = new Map(state.cache);
      cache.set(cacheKey, {
        data: facilities,
        timestamp: Date.now(),
      });

      const loading = new Set(state.loading);
      loading.delete(cacheKey);

      return {
        ...state,
        cache,
        loading,
      };
    });

    return facilities;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    // Update error state
    rentedFacilitiesStore.update((state) => {
      const errors = new Map(state.errors);
      errors.set(cacheKey, errorMessage);

      const loading = new Set(state.loading);
      loading.delete(cacheKey);

      return {
        ...state,
        errors,
        loading,
      };
    });

    throw error;
  }
}

/**
 * Clears the cache for a specific member or all members
 * @param memberId - Optional member ID to clear cache for
 * @param season - Optional season to clear cache for (only used if memberId is provided)
 */
export function clearRentedFacilitiesCache(
  memberId?: number,
  season?: number,
): void {
  if (memberId !== undefined) {
    rentedFacilitiesStore.update((state) => {
      const cache = new Map(state.cache);
      if (season !== undefined) {
        // Clear specific season for member
        cache.delete(getCacheKey(memberId, season));
      } else {
        // Clear all seasons for member
        const keysToDelete = Array.from(cache.keys()).filter(
          (key) => key.startsWith(`${memberId}-`) || key === `${memberId}`,
        );
        keysToDelete.forEach((key) => cache.delete(key));
      }
      return { ...state, cache };
    });
  } else {
    rentedFacilitiesStore.update((state) => ({
      ...state,
      cache: new Map(),
    }));
  }
}

/**
 * Add a rented facility to the cache (optimistic update)
 * @param memberId - The member ID
 * @param facility - The facility to add
 * @param season - Optional season to update cache for
 */
export function addRentedFacilityToCache(
  memberId: number,
  facility: RentedFacility,
  season?: number,
): void {
  rentedFacilitiesStore.update((state) => {
    const cache = new Map(state.cache);
    const cacheKey = getCacheKey(memberId, season);
    const entry = cache.get(cacheKey);
    if (entry) {
      cache.set(cacheKey, {
        data: [...entry.data, facility],
        timestamp: Date.now(),
      });
    }
    return { ...state, cache };
  });
}

/**
 * Remove a rented facility from the cache (optimistic update)
 * @param memberId - The member ID
 * @param facilityId - The facility ID to remove
 * @param season - Optional season to update cache for
 */
export function removeRentedFacilityFromCache(
  memberId: number,
  facilityId: number,
  season?: number,
): void {
  rentedFacilitiesStore.update((state) => {
    const cache = new Map(state.cache);
    const cacheKey = getCacheKey(memberId, season);
    const entry = cache.get(cacheKey);
    if (entry) {
      cache.set(cacheKey, {
        data: entry.data.filter((f) => f.id !== facilityId),
        timestamp: Date.now(),
      });
    }
    return { ...state, cache };
  });
}
