import { writable, derived, get } from "svelte/store";
import type { Member } from "$model/members/member";
import { mockMembers } from "$lib/data/mock-members";
import { fetchMembers } from "$lib/data/api";
import { getCurrentSeason } from "./seasons-repository";

// Configuration
const USE_MOCK_DATA = import.meta.env.DEV && !import.meta.env.VITE_API_URL;

interface SeasonCache {
  data: Member[];
  timestamp: number;
}

interface MembersState {
  cachesBySeason: Map<string, SeasonCache>;
  currentSeason: string;
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: MembersState = {
  cachesBySeason: new Map(),
  currentSeason: "all", // Default to "all" seasons
  isLoading: false,
  error: null,
};

// Internal writable store
const membersState = writable<MembersState>(initialState);

/**
 * Fetch members from the API or mock data
 */
async function fetchMembersData(season?: string): Promise<Member[]> {
  // Use mock data in development if no API URL is configured
  if (USE_MOCK_DATA) {
    console.info("Using mock data (no API URL configured)");
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    return mockMembers;
  }

  return fetchMembers(season);
}

/**
 * Load members - uses cache if valid, otherwise fetches from API
 */
export async function loadMembers(
  forceRefresh = false,
  season?: string | number,
): Promise<Member[]> {
  const state = get(membersState);

  // Use "all" as a special key for when no season is specified
  const cacheKey = season?.toString() || "all";
  const apiSeason = season?.toString(); // undefined if no season

  // Check if we have cached data for this cache key
  const cached = state.cachesBySeason.get(cacheKey);

  // Return cached data if valid and not forcing refresh
  if (!forceRefresh && cached && cached.data.length > 0) {
    // Update current season if different
    if (state.currentSeason !== cacheKey) {
      membersState.update((s) => ({
        ...s,
        currentSeason: cacheKey,
      }));
    }
    return cached.data;
  }

  // Set loading state
  membersState.update((s) => ({
    ...s,
    isLoading: true,
    error: null,
    currentSeason: cacheKey,
  }));

  try {
    const data = await fetchMembersData(apiSeason);

    // Update cache with fresh data for this cache key
    membersState.update((s) => {
      const newCaches = new Map(s.cachesBySeason);
      newCaches.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });

      return {
        ...s,
        cachesBySeason: newCaches,
        isLoading: false,
        error: null,
      };
    });

    return data;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    // Update error state
    membersState.update((s) => ({
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
export function clearMembersCache(): void {
  membersState.set(initialState);
}

/**
 * Clear cache for a specific season
 */
export function clearSeasonCache(season: string): void {
  membersState.update((s) => {
    const newCaches = new Map(s.cachesBySeason);
    newCaches.delete(season);
    return {
      ...s,
      cachesBySeason: newCaches,
    };
  });
}

/**
 * Add a new member to the cache (optimistic update)
 * Updates the cache for the current season
 */
export function addMemberToCache(member: Member): void {
  membersState.update((s) => {
    const cached = s.cachesBySeason.get(s.currentSeason);
    if (!cached) return s;

    const newCaches = new Map(s.cachesBySeason);
    newCaches.set(s.currentSeason, {
      data: [...cached.data, member],
      timestamp: Date.now(),
    });

    return {
      ...s,
      cachesBySeason: newCaches,
    };
  });
}

/**
 * Update a member in the cache (optimistic update)
 * Updates the cache for the current season
 */
export function updateMemberInCache(updatedMember: Member): void {
  membersState.update((s) => {
    const cached = s.cachesBySeason.get(s.currentSeason);
    if (!cached) return s;

    const newCaches = new Map(s.cachesBySeason);
    newCaches.set(s.currentSeason, {
      data: cached.data.map((member) =>
        member.id === updatedMember.id ? updatedMember : member,
      ),
      timestamp: Date.now(),
    });

    return {
      ...s,
      cachesBySeason: newCaches,
    };
  });
}

/**
 * Remove a member from the cache (optimistic update)
 * Updates the cache for the current season
 */
export function removeMemberFromCache(memberId: number): void {
  membersState.update((s) => {
    const cached = s.cachesBySeason.get(s.currentSeason);
    if (!cached) return s;

    const newCaches = new Map(s.cachesBySeason);
    newCaches.set(s.currentSeason, {
      data: cached.data.filter((member) => member.id !== memberId),
      timestamp: Date.now(),
    });

    return {
      ...s,
      cachesBySeason: newCaches,
    };
  });
}

// Exported derived stores for reactive access
export const members = derived(membersState, ($state) => {
  const cached = $state.cachesBySeason.get($state.currentSeason);
  return cached?.data || [];
});

export const isLoadingMembers = derived(
  membersState,
  ($state) => $state.isLoading,
);

export const membersError = derived(membersState, ($state) => $state.error);

export const currentSeason = derived(
  membersState,
  ($state) => $state.currentSeason,
);

// Computed store for cache age in seconds for current season
export const cacheAge = derived(membersState, ($state) => {
  const cached = $state.cachesBySeason.get($state.currentSeason);
  if (!cached || cached.timestamp === 0) return null;
  return Math.floor((Date.now() - cached.timestamp) / 1000);
});

/**
 * Get a single member by ID from cache
 */
export function getMemberById(id: number) {
  return derived(members, ($members) =>
    $members.find((member) => member.id === id),
  );
}

/**
 * Get members count from cache
 */
export const membersCount = derived(members, ($members) => $members.length);

/**
 * Get members by status from cache
 */
export function getMembersByStatus(status: string) {
  return derived(members, ($members) =>
    $members.filter((member) => member.membershipStatus === status),
  );
}
