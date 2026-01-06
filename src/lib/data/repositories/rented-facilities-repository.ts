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
  cache: Map<number, CacheEntry>;
  loading: Set<number>;
  errors: Map<number, string>;
}

const initialState: RentedFacilitiesState = {
  cache: new Map(),
  loading: new Set(),
  errors: new Map(),
};

// Internal store
const rentedFacilitiesStore = writable<RentedFacilitiesState>(initialState);

// Public derived stores
export const isLoadingRentedFacilities = derived(
  rentedFacilitiesStore,
  ($store) => (memberId: number) => $store.loading.has(memberId),
);

export const rentedFacilitiesError = derived(
  rentedFacilitiesStore,
  ($store) => (memberId: number) => $store.errors.get(memberId) || null,
);

export const rentedFacilities = derived(
  rentedFacilitiesStore,
  ($store) => (memberId: number) => $store.cache.get(memberId)?.data || [],
);

/**
 * Fetches rented facilities from API or mock data
 */
async function fetchRentedFacilitiesData(
  memberId: number,
): Promise<RentedFacility[]> {
  if (USE_MOCK_DATA) {
    console.info("Using mock data for rented facilities (no API URL configured)");
    // Simulate network delay in development
    await new Promise((resolve) => setTimeout(resolve, 500));
    // Return empty array for mock data (or add mock data if needed)
    return [];
  }

  return fetchRentedFacilities(memberId);
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
 */
export async function loadRentedFacilities(
  memberId: number,
  forceRefresh = false,
): Promise<RentedFacility[]> {
  const state = get(rentedFacilitiesStore);

  // Check cache
  const cachedEntry = state.cache.get(memberId);
  if (!forceRefresh && isCacheValid(cachedEntry)) {
    return cachedEntry!.data;
  }

  // Check if already loading
  if (state.loading.has(memberId)) {
    // Wait for the ongoing request
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        const currentState = get(rentedFacilitiesStore);
        if (!currentState.loading.has(memberId)) {
          clearInterval(checkInterval);
          const entry = currentState.cache.get(memberId);
          if (entry) {
            resolve(entry.data);
          } else {
            const error = currentState.errors.get(memberId);
            reject(new Error(error || "Failed to load rented facilities"));
          }
        }
      }, 100);
    });
  }

  // Start loading
  rentedFacilitiesStore.update((state) => ({
    ...state,
    loading: new Set(state.loading).add(memberId),
    errors: (() => {
      const errors = new Map(state.errors);
      errors.delete(memberId);
      return errors;
    })(),
  }));

  try {
    const facilities = await fetchRentedFacilitiesData(memberId);

    // Update cache
    rentedFacilitiesStore.update((state) => {
      const cache = new Map(state.cache);
      cache.set(memberId, {
        data: facilities,
        timestamp: Date.now(),
      });

      const loading = new Set(state.loading);
      loading.delete(memberId);

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
      errors.set(memberId, errorMessage);

      const loading = new Set(state.loading);
      loading.delete(memberId);

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
 */
export function clearRentedFacilitiesCache(memberId?: number): void {
  if (memberId !== undefined) {
    rentedFacilitiesStore.update((state) => {
      const cache = new Map(state.cache);
      cache.delete(memberId);
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
 */
export function addRentedFacilityToCache(
  memberId: number,
  facility: RentedFacility,
): void {
  rentedFacilitiesStore.update((state) => {
    const cache = new Map(state.cache);
    const entry = cache.get(memberId);
    if (entry) {
      cache.set(memberId, {
        data: [...entry.data, facility],
        timestamp: Date.now(),
      });
    }
    return { ...state, cache };
  });
}

/**
 * Remove a rented facility from the cache (optimistic update)
 */
export function removeRentedFacilityFromCache(
  memberId: number,
  facilityId: number,
): void {
  rentedFacilitiesStore.update((state) => {
    const cache = new Map(state.cache);
    const entry = cache.get(memberId);
    if (entry) {
      cache.set(memberId, {
        data: entry.data.filter((f) => f.id !== facilityId),
        timestamp: Date.now(),
      });
    }
    return { ...state, cache };
  });
}
