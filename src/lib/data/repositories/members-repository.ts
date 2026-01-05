import { writable, derived, get } from "svelte/store";
import type { Member } from "$model/members/member";
import { mockMembers } from "$lib/data/mock-members";
import { parseDate, type DateValue } from "@internationalized/date";

// Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";
const USE_MOCK_DATA = import.meta.env.DEV && !import.meta.env.VITE_API_URL;

interface MembersCache {
  data: Member[];
  timestamp: number;
  isLoading: boolean;
  error: string | null;
}

// Initial cache state
const initialCache: MembersCache = {
  data: [],
  timestamp: 0,
  isLoading: false,
  error: null,
};

// Internal writable store
const membersCache = writable<MembersCache>(initialCache);

/**
 * Fetch members from the API
 */
async function fetchMembersFromAPI(): Promise<Member[]> {
  // Use mock data in development if no API URL is configured
  if (USE_MOCK_DATA) {
    console.info("Using mock data (no API URL configured)");
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));
    return mockMembers;
  }

  const response = await fetch(`${API_BASE_URL}/api/v1.0/members`);

  if (!response.ok) {
    throw new Error(`Failed to fetch members: ${response.statusText}`);
  }

  const jsonResponse = await response.json();

  const members: Member[] = jsonResponse.map((member: any) => ({
    id: member.id,
    firstName: member.firstName,
    lastName: member.lastName,
    email: member.email,
    birthDate: parseDate(member.birthDate),
    membership: {
      id: member.membership.id,
      status: member.membership.status,
      number: member.membership.number,
      validFrom: parseDate(member.membership.validFrom),
      expiresAt: parseDate(member.membership.expiresAt),
    },
    addresses: member.addresses.map((address: any) => ({
      city: address.city,
      country: address.country,
      street: address.street,
      streetNumber: address.streetNumber,
      zipCode: address.zipCode,
    })),
  }));

  return members;
}

/**
 * Load members - uses cache if valid, otherwise fetches from API
 */
export async function loadMembers(forceRefresh = false): Promise<Member[]> {
  const cache = get(membersCache);

  // Return cached data if valid and not forcing refresh
  if (!forceRefresh && cache.data.length > 0) {
    return cache.data;
  }

  // Set loading state
  membersCache.update((state) => ({
    ...state,
    isLoading: true,
    error: null,
  }));

  try {
    const data = await fetchMembersFromAPI();

    // Update cache with fresh data
    membersCache.set({
      data,
      timestamp: Date.now(),
      isLoading: false,
      error: null,
    });

    return data;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";

    // Update error state
    membersCache.update((state) => ({
      ...state,
      isLoading: false,
      error: errorMessage,
    }));

    throw error;
  }
}

/**
 * Clear the cache
 */
export function clearMembersCache(): void {
  membersCache.set(initialCache);
}

/**
 * Add a new member to the cache (optimistic update)
 */
export function addMemberToCache(member: Member): void {
  membersCache.update((state) => ({
    ...state,
    data: [...state.data, member],
    timestamp: Date.now(),
  }));
}

/**
 * Update a member in the cache (optimistic update)
 */
export function updateMemberInCache(updatedMember: Member): void {
  membersCache.update((state) => ({
    ...state,
    data: state.data.map((member) =>
      member.id === updatedMember.id ? updatedMember : member,
    ),
    timestamp: Date.now(),
  }));
}

/**
 * Remove a member from the cache (optimistic update)
 */
export function removeMemberFromCache(memberId: number): void {
  membersCache.update((state) => ({
    ...state,
    data: state.data.filter((member) => member.id !== memberId),
    timestamp: Date.now(),
  }));
}

// Exported derived stores for reactive access
export const members = derived(membersCache, ($cache) => $cache.data);
export const isLoadingMembers = derived(
  membersCache,
  ($cache) => $cache.isLoading,
);
export const membersError = derived(membersCache, ($cache) => $cache.error);

// Computed store for cache age in seconds
export const cacheAge = derived(membersCache, ($cache) => {
  if ($cache.timestamp === 0) return null;
  return Math.floor((Date.now() - $cache.timestamp) / 1000);
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
    $members.filter((member) => member.membership.status === status),
  );
}
