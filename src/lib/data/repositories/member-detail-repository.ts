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
  cache: Map<number, CacheEntry>;
  loading: Set<number>;
  errors: Map<number, string>;
}

const initialState: MemberDetailState = {
  cache: new Map(),
  loading: new Set(),
  errors: new Map(),
};

// Internal store
const memberDetailStore = writable<MemberDetailState>(initialState);

// Public derived stores
export const isLoadingMemberDetail = derived(
  memberDetailStore,
  ($store) => (memberId: number) => $store.loading.has(memberId),
);

export const memberDetailError = derived(
  memberDetailStore,
  ($store) => (memberId: number) => $store.errors.get(memberId) || null,
);

export const memberDetail = derived(
  memberDetailStore,
  ($store) => (memberId: number) => $store.cache.get(memberId)?.data || null,
);

/**
 * Fetches member detail from API or mock data
 */
async function fetchMemberDetailData(
  memberId: number,
  season?: string,
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
  season?: string,
): Promise<MemberDetail> {
  const state = get(memberDetailStore);

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
        const currentState = get(memberDetailStore);
        if (!currentState.loading.has(memberId)) {
          clearInterval(checkInterval);
          const entry = currentState.cache.get(memberId);
          if (entry) {
            resolve(entry.data);
          } else {
            const error = currentState.errors.get(memberId);
            reject(new Error(error || "Failed to load member detail"));
          }
        }
      }, 100);
    });
  }

  // Start loading
  memberDetailStore.update((state) => ({
    ...state,
    loading: new Set(state.loading).add(memberId),
    errors: (() => {
      const errors = new Map(state.errors);
      errors.delete(memberId);
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
      cache.set(memberId, {
        data: memberDetail,
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

    return memberDetail;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    // Update error state
    memberDetailStore.update((state) => {
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
export function clearMemberDetailCache(memberId?: number): void {
  if (memberId !== undefined) {
    memberDetailStore.update((state) => {
      const cache = new Map(state.cache);
      cache.delete(memberId);
      return { ...state, cache };
    });
  } else {
    memberDetailStore.update((state) => ({
      ...state,
      cache: new Map(),
    }));
  }
}
