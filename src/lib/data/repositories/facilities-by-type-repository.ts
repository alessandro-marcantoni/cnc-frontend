import { writable, derived, get } from "svelte/store";
import type { FacilityWithStatus } from "$model/facilities/facility-with-status";
import { fetchFacilitiesByType } from "$lib/data/api";

// Configuration
const USE_MOCK_DATA = import.meta.env.DEV && !import.meta.env.VITE_API_URL;

interface TypeCache {
  data: FacilityWithStatus[];
  timestamp: number;
}

interface FacilitiesByTypeState {
  cachesByType: Map<number, TypeCache>;
  currentTypeId: number | null;
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: FacilitiesByTypeState = {
  cachesByType: new Map(),
  currentTypeId: null,
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
): Promise<FacilityWithStatus[]> {
  // Use mock data in development if no API URL is configured
  if (USE_MOCK_DATA) {
    console.info("Using mock data (no API URL configured)");
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Generate mock facilities based on type ID
    const mockFacilities: FacilityWithStatus[] = [];
    for (let i = 1; i <= 10; i++) {
      mockFacilities.push({
        id: facilityTypeId * 100 + i,
        facilityTypeId: facilityTypeId,
        identifier: `FACILITY-${facilityTypeId}-${i}`,
        facilityTypeName: `Type ${facilityTypeId}`,
        facilityTypeDescription: `Description for type ${facilityTypeId}`,
        suggestedPrice: 100.0 + facilityTypeId * 10,
        isRented: i % 3 === 0,
        expiresAt:
          i % 3 === 0
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            : undefined,
      });
    }
    return mockFacilities;
  }

  return fetchFacilitiesByType(facilityTypeId);
}

/**
 * Load facilities by type - uses cache if valid, otherwise fetches from API
 */
export async function loadFacilitiesByType(
  facilityTypeId: number,
  forceRefresh = false,
): Promise<FacilityWithStatus[]> {
  const state = get(facilitiesByTypeState);

  // Check if we have cached data for this type
  const cached = state.cachesByType.get(facilityTypeId);

  // Return cached data if valid and not forcing refresh
  if (!forceRefresh && cached && cached.data.length > 0) {
    // Update current type ID if different
    if (state.currentTypeId !== facilityTypeId) {
      facilitiesByTypeState.update((s) => ({
        ...s,
        currentTypeId: facilityTypeId,
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
  }));

  try {
    const data = await fetchFacilitiesByTypeData(facilityTypeId);

    // Update cache with fresh data for this type
    facilitiesByTypeState.update((s) => {
      const newCaches = new Map(s.cachesByType);
      newCaches.set(facilityTypeId, {
        data,
        timestamp: Date.now(),
      });

      return {
        ...s,
        cachesByType: newCaches,
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
 * Clear cache for a specific type
 */
export function clearTypeCache(facilityTypeId: number): void {
  facilitiesByTypeState.update((s) => {
    const newCaches = new Map(s.cachesByType);
    newCaches.delete(facilityTypeId);
    return {
      ...s,
      cachesByType: newCaches,
    };
  });
}

// Exported derived stores for reactive access
export const facilitiesByType = derived(facilitiesByTypeState, ($state) => {
  if ($state.currentTypeId === null) return [];
  const cached = $state.cachesByType.get($state.currentTypeId);
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

// Computed store for cache age in seconds for current type
export const cacheAge = derived(facilitiesByTypeState, ($state) => {
  if ($state.currentTypeId === null) return null;
  const cached = $state.cachesByType.get($state.currentTypeId);
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
