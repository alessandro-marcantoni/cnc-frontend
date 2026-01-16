import { writable, derived, get } from "svelte/store";
import type { MemberDetail } from "$model/members/member-detail";
import { mockMemberDetails } from "$lib/data/mock-member-details";
import { fetchMemberDetail } from "$lib/data/api";

// Configuration
const USE_MOCK_DATA = import.meta.env.DEV && !import.meta.env.VITE_API_URL;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache structure
interface CacheEntry {
  data: MemberDetail;
  timestamp: number;
}

// Store state
interface MemberDetailState {
  cache: Map<string, CacheEntry>;
  loading: Set<string>;
  errors: Map<string, string>;
}

const initialState: MemberDetailState = {
  cache: new Map(),
  loading: new Set(),
  errors: new Map(),
};

// Internal store
const memberDetailStore = writable<MemberDetailState>(initialState);

/**
 * Creates a cache key from memberId and optional season
 */
function getCacheKey(memberId: number, season?: number): string {
  return season !== undefined ? `${memberId}-${season}` : `${memberId}`;
}

// Public derived stores
export const isLoadingMemberDetail = derived(
  memberDetailStore,
  ($store) => (memberId: number, season?: number) =>
    $store.loading.has(getCacheKey(memberId, season)),
);

export const memberDetailError = derived(
  memberDetailStore,
  ($store) => (memberId: number, season?: number) =>
    $store.errors.get(getCacheKey(memberId, season)) || null,
);

export const memberDetail = derived(
  memberDetailStore,
  ($store) => (memberId: number, season?: number) =>
    $store.cache.get(getCacheKey(memberId, season))?.data || null,
);

/**
 * Fetches member detail from API or mock data
 */
async function fetchMemberDetailData(
  memberId: number,
  season?: number,
): Promise<MemberDetail> {
  if (USE_MOCK_DATA) {
    const memberDetail = mockMemberDetails[memberId];
    if (!memberDetail) {
      throw new Error(`Member with ID ${memberId} not found in mock data`);
    }
    return memberDetail;
  }

  return fetchMemberDetail(memberId, season);
}

/**
 * Checks if cache entry is still valid
 */
function isCacheValid(entry: CacheEntry | undefined): boolean {
  if (!entry) return false;
  return Date.now() - entry.timestamp < CACHE_DURATION;
}

/**
 * Loads member detail with caching
 * @param memberId - The ID of the member to load
 * @param forceRefresh - If true, bypass cache and fetch fresh data
 * @param season - Optional season to filter member data
 */
export async function loadMemberDetail(
  memberId: number,
  forceRefresh = false,
  season?: number,
): Promise<MemberDetail> {
  const cacheKey = getCacheKey(memberId, season);
  const state = get(memberDetailStore);

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
        const currentState = get(memberDetailStore);
        if (!currentState.loading.has(cacheKey)) {
          clearInterval(checkInterval);
          const entry = currentState.cache.get(cacheKey);
          if (entry) {
            resolve(entry.data);
          } else {
            const error = currentState.errors.get(cacheKey);
            reject(new Error(error || "Failed to load member detail"));
          }
        }
      }, 100);
    });
  }

  // Start loading
  memberDetailStore.update((state) => ({
    ...state,
    loading: new Set(state.loading).add(cacheKey),
    errors: (() => {
      const errors = new Map(state.errors);
      errors.delete(cacheKey);
      return errors;
    })(),
  }));

  try {
    // Simulate network delay in development
    if (USE_MOCK_DATA) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    const memberDetail = await fetchMemberDetailData(memberId, season);

    // Update cache
    memberDetailStore.update((state) => {
      const cache = new Map(state.cache);
      cache.set(cacheKey, {
        data: memberDetail,
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

    return memberDetail;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    // Update error state
    memberDetailStore.update((state) => {
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
export function clearMemberDetailCache(
  memberId?: number,
  season?: number,
): void {
  if (memberId !== undefined) {
    memberDetailStore.update((state) => {
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
    memberDetailStore.update((state) => ({
      ...state,
      cache: new Map(),
    }));
  }
}
