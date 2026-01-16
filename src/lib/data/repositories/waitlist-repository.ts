import { writable, derived, get } from "svelte/store";
import type { WaitlistMemberDetail } from "$lib/data/api";
import { fetchWaitlistWithDetails } from "$lib/data/api";
import { loadMembers, members as membersStore } from "./members-repository";
import { getCurrentSeason } from "./seasons-repository";

interface WaitlistCache {
  data: WaitlistMemberDetail[];
  timestamp: number;
  facilityTypeId: number;
}

interface WaitlistState {
  caches: Map<string, WaitlistCache>;
  isLoading: Set<string>;
  errors: Map<string, string>;
}

const initialState: WaitlistState = {
  caches: new Map(),
  isLoading: new Set(),
  errors: new Map(),
};

const waitlistState = writable<WaitlistState>(initialState);

/**
 * Generate cache key for a specific facility type
 */
function getCacheKey(facilityTypeId: number): string {
  return `facility-${facilityTypeId}`;
}

/**
 * Load waitlist for a specific facility type
 */
export async function loadWaitlist(
  facilityTypeId: number,
  forceRefresh = false,
): Promise<WaitlistMemberDetail[]> {
  const state = get(waitlistState);
  const cacheKey = getCacheKey(facilityTypeId);

  // Check if we have cached data
  const cached = state.caches.get(cacheKey);

  // Return cached data if valid and not forcing refresh
  if (!forceRefresh && cached && cached.data.length >= 0) {
    return cached.data;
  }

  // Set loading state
  waitlistState.update((s) => ({
    ...s,
    isLoading: new Set([...s.isLoading, cacheKey]),
    errors: new Map([...s.errors].filter(([k]) => k !== cacheKey)),
  }));

  try {
    // First ensure we have members loaded
    const currentSeason = getCurrentSeason();
    await loadMembers(false, currentSeason.id);
    const members = get(membersStore);

    // Fetch waitlist with member details
    const data = await fetchWaitlistWithDetails(facilityTypeId, members);

    // Update cache with fresh data
    waitlistState.update((s) => {
      const newCaches = new Map(s.caches);
      newCaches.set(cacheKey, {
        data,
        timestamp: Date.now(),
        facilityTypeId,
      });

      const newIsLoading = new Set(s.isLoading);
      newIsLoading.delete(cacheKey);

      return {
        ...s,
        caches: newCaches,
        isLoading: newIsLoading,
      };
    });

    return data;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    // Update error state
    waitlistState.update((s) => {
      const newIsLoading = new Set(s.isLoading);
      newIsLoading.delete(cacheKey);

      const newErrors = new Map(s.errors);
      newErrors.set(cacheKey, errorMessage);

      return {
        ...s,
        isLoading: newIsLoading,
        errors: newErrors,
      };
    });

    throw error;
  }
}

/**
 * Clear cache for a specific facility type
 */
export function clearWaitlistCache(facilityTypeId: number): void {
  const cacheKey = getCacheKey(facilityTypeId);
  waitlistState.update((s) => {
    const newCaches = new Map(s.caches);
    newCaches.delete(cacheKey);
    return {
      ...s,
      caches: newCaches,
    };
  });
}

/**
 * Clear all waitlist caches
 */
export function clearAllWaitlistCaches(): void {
  waitlistState.set(initialState);
}

/**
 * Optimistically remove a member from the waitlist cache
 */
export function removeMemberFromWaitlistCache(
  facilityTypeId: number,
  memberId: number,
): void {
  const cacheKey = getCacheKey(facilityTypeId);
  waitlistState.update((s) => {
    const cached = s.caches.get(cacheKey);
    if (!cached) return s;

    const newCaches = new Map(s.caches);
    newCaches.set(cacheKey, {
      ...cached,
      data: cached.data.filter((entry) => entry.memberId !== memberId),
      timestamp: Date.now(),
    });

    return {
      ...s,
      caches: newCaches,
    };
  });
}

/**
 * Optimistically add a member to the waitlist cache
 */
export function addMemberToWaitlistCache(
  facilityTypeId: number,
  entry: WaitlistMemberDetail,
): void {
  const cacheKey = getCacheKey(facilityTypeId);
  waitlistState.update((s) => {
    const cached = s.caches.get(cacheKey);
    if (!cached) return s;

    const newCaches = new Map(s.caches);
    newCaches.set(cacheKey, {
      ...cached,
      data: [...cached.data, entry],
      timestamp: Date.now(),
    });

    return {
      ...s,
      caches: newCaches,
    };
  });
}

// Exported derived stores for reactive access

/**
 * Get waitlist for a specific facility type
 */
export function waitlist(facilityTypeId: number) {
  return derived(waitlistState, ($state) => {
    const cached = $state.caches.get(getCacheKey(facilityTypeId));
    return cached?.data || [];
  });
}

/**
 * Get loading state for a specific facility type
 */
export function isLoadingWaitlist(facilityTypeId: number) {
  return derived(waitlistState, ($state) => {
    return $state.isLoading.has(getCacheKey(facilityTypeId));
  });
}

/**
 * Get error for a specific facility type
 */
export function waitlistError(facilityTypeId: number) {
  return derived(waitlistState, ($state) => {
    return $state.errors.get(getCacheKey(facilityTypeId)) || null;
  });
}

/**
 * Get cache age in seconds for a specific facility type
 */
export function waitlistCacheAge(facilityTypeId: number) {
  return derived(waitlistState, ($state) => {
    const cached = $state.caches.get(getCacheKey(facilityTypeId));
    if (!cached || cached.timestamp === 0) return null;
    return Math.floor((Date.now() - cached.timestamp) / 1000);
  });
}

/**
 * Get waitlist count for a specific facility type
 */
export function waitlistCount(facilityTypeId: number) {
  return derived(waitlist(facilityTypeId), ($waitlist) => $waitlist.length);
}
