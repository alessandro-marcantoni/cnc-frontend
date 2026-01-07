import { writable, derived, get } from "svelte/store";
import type { FacilityType } from "$model/facilities/facility-type";
import { fetchFacilitiesCatalog } from "$lib/data/api";

// Configuration
const USE_MOCK_DATA = import.meta.env.DEV && !import.meta.env.VITE_API_URL;

interface FacilitiesCatalogState {
  data: FacilityType[];
  timestamp: number;
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: FacilitiesCatalogState = {
  data: [],
  timestamp: 0,
  isLoading: false,
  error: null,
};

// Internal writable store
const facilitiesCatalogState = writable<FacilitiesCatalogState>(initialState);

/**
 * Fetch facilities catalog from the API or mock data
 */
async function fetchFacilitiesCatalogData(): Promise<FacilityType[]> {
  // Use mock data in development if no API URL is configured
  if (USE_MOCK_DATA) {
    console.info("Using mock data (no API URL configured)");
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    return [
      {
        id: 1,
        name: "Posto Barca",
        description: "Ormeggio per imbarcazioni",
        suggestedPrice: 1000.0,
      },
      {
        id: 2,
        name: "Palestra",
        description: "Accesso alla palestra del circolo",
        suggestedPrice: 200.0,
      },
      {
        id: 3,
        name: "Campo da Basket",
        description: "Utilizzo campo da basket",
        suggestedPrice: 150.0,
      },
    ];
  }

  return fetchFacilitiesCatalog();
}

/**
 * Load facilities catalog - uses cache if valid, otherwise fetches from API
 */
export async function loadFacilitiesCatalog(
  forceRefresh = false,
): Promise<FacilityType[]> {
  const state = get(facilitiesCatalogState);

  // Return cached data if valid and not forcing refresh
  if (!forceRefresh && state.data.length > 0) {
    return state.data;
  }

  // Set loading state
  facilitiesCatalogState.update((s) => ({
    ...s,
    isLoading: true,
    error: null,
  }));

  try {
    const data = await fetchFacilitiesCatalogData();

    // Update cache with fresh data
    facilitiesCatalogState.update((s) => ({
      ...s,
      data,
      timestamp: Date.now(),
      isLoading: false,
      error: null,
    }));

    return data;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    // Update error state
    facilitiesCatalogState.update((s) => ({
      ...s,
      isLoading: false,
      error: errorMessage,
    }));

    throw error;
  }
}

/**
 * Clear the cache
 */
export function clearFacilitiesCatalogCache(): void {
  facilitiesCatalogState.set(initialState);
}

// Exported derived stores for reactive access
export const facilitiesCatalog = derived(
  facilitiesCatalogState,
  ($state) => $state.data,
);

export const isLoadingFacilitiesCatalog = derived(
  facilitiesCatalogState,
  ($state) => $state.isLoading,
);

export const facilitiesCatalogError = derived(
  facilitiesCatalogState,
  ($state) => $state.error,
);

// Computed store for cache age in seconds
export const cacheAge = derived(facilitiesCatalogState, ($state) => {
  if ($state.timestamp === 0) return null;
  return Math.floor((Date.now() - $state.timestamp) / 1000);
});

/**
 * Get facilities count from cache
 */
export const facilitiesCount = derived(
  facilitiesCatalog,
  ($catalog) => $catalog.length,
);
