import { writable, derived, get } from "svelte/store";
import type { MemberDetail } from "$model/members/member-detail";
import { mockMemberDetails } from "$lib/data/mock-member-details";

// Configuration
const API_URL = import.meta.env.VITE_API_URL;
const USE_MOCK_DATA = !API_URL || import.meta.env.DEV;
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
  ($store) => (memberId: number) => $store.loading.has(memberId)
);

export const memberDetailError = derived(
  memberDetailStore,
  ($store) => (memberId: number) => $store.errors.get(memberId) || null
);

export const memberDetail = derived(
  memberDetailStore,
  ($store) => (memberId: number) => $store.cache.get(memberId)?.data || null
);

/**
 * Fetches member detail from API
 */
async function fetchMemberDetailFromAPI(
  memberId: number
): Promise<MemberDetail> {
  const response = await fetch(`${API_URL}/members/${memberId}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Member with ID ${memberId} not found`);
    }
    throw new Error(`Failed to fetch member detail: ${response.statusText}`);
  }

  const data = await response.json();

  // Parse dates
  return {
    ...data,
    birthDate: new Date(data.birthDate),
    memberships: data.memberships.map((m: any) => ({
      ...m,
      validFrom: new Date(m.validFrom),
      expiresAt: new Date(m.expiresAt),
    })),
    rentedFacilities: data.rentedFacilities.map((f: any) => ({
      ...f,
      rentedAt: new Date(f.rentedAt),
      expiresAt: new Date(f.expiresAt),
      payment: f.payment
        ? {
            ...f.payment,
            paidAt: new Date(f.payment.paidAt),
          }
        : null,
    })),
  };
}

/**
 * Fetches member detail from mock data
 */
function fetchMemberDetailFromMock(memberId: number): MemberDetail {
  const memberDetail = mockMemberDetails[memberId];
  if (!memberDetail) {
    throw new Error(`Member with ID ${memberId} not found in mock data`);
  }
  return memberDetail;
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
 */
export async function loadMemberDetail(
  memberId: number,
  forceRefresh = false
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
    let memberDetail: MemberDetail;

    if (USE_MOCK_DATA) {
      // Simulate network delay in development
      await new Promise((resolve) => setTimeout(resolve, 500));
      memberDetail = fetchMemberDetailFromMock(memberId);
    } else {
      memberDetail = await fetchMemberDetailFromAPI(memberId);
    }

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
