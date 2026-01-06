# Repositories Documentation

Svelte store-based repositories that manage application data with automatic caching and API integration.

## Overview

The repository layer manages application state, caching, and provides reactive Svelte stores for components. It acts as an intermediary between the UI components and the API layer.

## Architecture

```
Component → Repository → API Layer → Backend
         ← Store      ← Transform   ← Response
```

- **Repositories**: Handle caching, state management, and provide reactive stores
- **API Layer**: Handle HTTP requests and data transformation (see `../api/README.md`)

## Features

- ✅ **Automatic Caching**: Caches data to reduce API calls
- ✅ **Reactive Stores**: Subscribe to data changes reactively
- ✅ **Loading States**: Built-in loading and error state management
- ✅ **Optimistic Updates**: Update cache immediately for better UX
- ✅ **Development Fallback**: Automatically uses mock data when API is unavailable
- ✅ **Type-Safe**: Full TypeScript support

## Available Repositories

### Members Repository (`members-repository.ts`)

Manages the list of all members with caching and reactive stores.

### Member Detail Repository (`member-detail-repository.ts`)

Manages individual member details with per-member caching.

### Rented Facilities Repository (`rented-facilities-repository.ts`)

Manages rented facilities for members with per-member caching.

## Quick Start

### Importing from Repositories

```typescript
// Import from central index
import { loadMembers, members, isLoadingMembers } from "$lib/data/repositories";

// Or import from specific repository
import {
  loadMembers,
  members,
} from "$lib/data/repositories/members-repository";
```

### Basic Usage Example

```svelte
<script lang="ts">
    import { onMount } from 'svelte';
    import { members, loadMembers, isLoadingMembers } from '$lib/data/repositories';

    onMount(async () => {
        await loadMembers();
    });
</script>

{#if $isLoadingMembers}
    <p>Loading...</p>
{:else}
    <ul>
        {#each $members as member}
            <li>{member.firstName} {member.lastName}</li>
        {/each}
    </ul>
{/if}
```

---

## Members Repository API

### Loading Functions

#### `loadMembers(forceRefresh?: boolean): Promise<Member[]>`

Loads members from cache or API.

- **Parameters**:
  - `forceRefresh` (optional): If `true`, bypasses cache and fetches fresh data
- **Returns**: Promise resolving to array of members
- **Behavior**:
  - Returns cached data if less than 5 minutes old
  - Fetches from API if cache is stale or empty
  - Uses mock data in development if no API URL is set

**Example:**

```typescript
// Load with cache
await loadMembers();

// Force refresh (bypass cache)
await loadMembers(true);
```

### Cache Management

#### `clearMembersCache(): void`

Completely clears the cache and resets all state.

```typescript
clearMembersCache();
```

#### `invalidateMembersCache(): void`

Marks cache as stale without clearing data. Next `loadMembers()` call will fetch fresh data.

```typescript
invalidateMembersCache();
```

### Optimistic Updates

These functions update the cache immediately without API calls. Use them after successful API mutations for instant UI updates.

#### `addMemberToCache(member: Member): void`

Adds a member to the cache.

```typescript
const newMember = {
  /* ... */
};
await createMemberAPI(newMember);
addMemberToCache(newMember);
```

#### `updateMemberInCache(member: Member): void`

Updates an existing member in the cache.

```typescript
const updatedMember = { ...existingMember, email: "new@email.com" };
await updateMemberAPI(updatedMember);
updateMemberInCache(updatedMember);
```

#### `removeMemberFromCache(memberId: number): void`

Removes a member from the cache.

```typescript
await deleteMemberAPI(memberId);
removeMemberFromCache(memberId);
```

## Reactive Stores

Subscribe to these stores for automatic reactivity.

### `members`

The array of all cached members.

```svelte
<script>
    import { members } from '$lib/data/repositories/members-repository';
</script>

{#each $members as member}
    <div>{member.firstName} {member.lastName}</div>
{/each}
```

### `isLoadingMembers`

Boolean indicating if members are currently being loaded.

```svelte
<script>
    import { isLoadingMembers } from '$lib/data/repositories/members-repository';
</script>

{#if $isLoadingMembers}
    <div class="spinner">Loading...</div>
{/if}
```

### `membersError`

Error message if loading failed, or `null` if no error.

```svelte
<script>
    import { membersError } from '$lib/data/repositories/members-repository';
</script>

{#if $membersError}
    <div class="error">{$membersError}</div>
{/if}
```

### `isCacheStale`

Boolean indicating if the cache needs refreshing.

```svelte
<script>
    import { isCacheStale } from '$lib/data/repositories/members-repository';
</script>

{#if $isCacheStale}
    <button onclick={refreshData}>Refresh Data</button>
{/if}
```

### `cacheAge`

Age of the cache in seconds, or `null` if empty.

```svelte
<script>
    import { cacheAge } from '$lib/data/repositories/members-repository';
</script>

{#if $cacheAge}
    <p>Data loaded {$cacheAge} seconds ago</p>
{/if}
```

### `membersCount`

Total number of cached members.

```svelte
<script>
    import { membersCount } from '$lib/data/repositories/members-repository';
</script>

<p>Total: {$membersCount} members</p>
```

## Derived Stores

### `getMemberById(id: number)`

Returns a derived store for a specific member.

```svelte
<script>
    import { getMemberById } from '$lib/data/repositories/members-repository';

    const member = getMemberById(1);
</script>

{#if $member}
    <h1>{$member.firstName} {$member.lastName}</h1>
{:else}
    <p>Member not found</p>
{/if}
```

### `getMembersByStatus(status: string)`

Returns a derived store filtered by membership status.

```svelte
<script>
    import { getMembersByStatus } from '$lib/data/repositories/members-repository';

    const activeMembers = getMembersByStatus('ACTIVE');
    const suspendedMembers = getMembersByStatus('SUSPENDED');
</script>

<p>Active: {$activeMembers.length}</p>
<p>Suspended: {$suspendedMembers.length}</p>
```

---

## Member Detail Repository API

### Loading Functions

#### `loadMemberDetail(memberId: number, forceRefresh?: boolean): Promise<MemberDetail>`

Loads detailed information for a specific member.

- **Parameters**:
  - `memberId`: The ID of the member to load
  - `forceRefresh` (optional): If `true`, bypasses cache and fetches fresh data
- **Returns**: Promise resolving to member detail
- **Cache Duration**: 5 minutes

**Example:**

```typescript
await loadMemberDetail(123);
await loadMemberDetail(123, true); // Force refresh
```

### Cache Management

#### `clearMemberDetailCache(memberId?: number): void`

Clears the cache for a specific member or all members.

```typescript
clearMemberDetailCache(123); // Clear specific member
clearMemberDetailCache(); // Clear all
```

### Reactive Stores

These are functions that return derived stores for specific members:

#### `memberDetail(memberId: number)`

```svelte
<script>
    import { memberDetail } from '$lib/data/repositories';
    const detail = memberDetail(123);
</script>

{#if $detail}
    <h1>{$detail.firstName} {$detail.lastName}</h1>
{/if}
```

#### `isLoadingMemberDetail(memberId: number)`

```svelte
<script>
    import { isLoadingMemberDetail } from '$lib/data/repositories';
    const loading = isLoadingMemberDetail(123);
</script>

{#if $loading}
    <div>Loading...</div>
{/if}
```

#### `memberDetailError(memberId: number)`

```svelte
<script>
    import { memberDetailError } from '$lib/data/repositories';
    const error = memberDetailError(123);
</script>

{#if $error}
    <div class="error">{$error}</div>
{/if}
```

---

## Rented Facilities Repository API

### Loading Functions

#### `loadRentedFacilities(memberId: number, forceRefresh?: boolean): Promise<RentedFacility[]>`

Loads rented facilities for a specific member.

- **Parameters**:
  - `memberId`: The ID of the member
  - `forceRefresh` (optional): If `true`, bypasses cache and fetches fresh data
- **Returns**: Promise resolving to array of rented facilities
- **Cache Duration**: 5 minutes

**Example:**

```typescript
await loadRentedFacilities(123);
await loadRentedFacilities(123, true); // Force refresh
```

### Cache Management

#### `clearRentedFacilitiesCache(memberId?: number): void`

Clears the cache for a specific member or all members.

```typescript
clearRentedFacilitiesCache(123); // Clear specific member
clearRentedFacilitiesCache(); // Clear all
```

### Optimistic Updates

#### `addRentedFacilityToCache(memberId: number, facility: RentedFacility): void`

Adds a facility to the cache.

```typescript
addRentedFacilityToCache(123, newFacility);
```

#### `removeRentedFacilityFromCache(memberId: number, facilityId: number): void`

Removes a facility from the cache.

```typescript
removeRentedFacilityFromCache(123, 456);
```

### Reactive Stores

#### `rentedFacilities(memberId: number)`

```svelte
<script>
    import { rentedFacilities } from '$lib/data/repositories';
    const facilities = rentedFacilities(123);
</script>

{#each $facilities as facility}
    <div>{facility.facilityName}</div>
{/each}
```

#### `isLoadingRentedFacilities(memberId: number)`

```svelte
<script>
    import { isLoadingRentedFacilities } from '$lib/data/repositories';
    const loading = isLoadingRentedFacilities(123);
</script>

{#if $loading}
    <div>Loading facilities...</div>
{/if}
```

#### `rentedFacilitiesError(memberId: number)`

```svelte
<script>
    import { rentedFacilitiesError } from '$lib/data/repositories';
    const error = rentedFacilitiesError(123);
</script>

{#if $error}
    <div class="error">{$error}</div>
{/if}
```

---

## Configuration

### Environment Variables

Set in `.env` file:

```bash
# API URL (required for production)
VITE_API_URL=http://localhost:8080

# If not set, mock data is used in development
```

### Cache Duration

Default: 5 minutes (300,000 ms)

To change, edit `CACHE_DURATION` in each repository file:

```typescript
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
```

## Complete Examples

### Members List

```svelte
<script lang="ts">
    import { onMount } from 'svelte';
    import {
        members,
        isLoadingMembers,
        membersError,
        membersCount,
        cacheAge,
        loadMembers,
        getMembersByStatus,
    } from '$lib/data/repositories';

    const activeMembers = getMembersByStatus('ACTIVE');

    onMount(async () => {
        try {
            await loadMembers();
        } catch (error) {
            console.error('Failed to load members:', error);
        }
    });

    async function handleRefresh() {
        await loadMembers(true);
    }
</script>

<div>
    <h1>Members ({$membersCount})</h1>

    {#if $cacheAge}
        <p class="text-muted">
            Loaded {$cacheAge} seconds ago
        </p>
    {/if}

    <button onclick={handleRefresh} disabled={$isLoadingMembers}>
        {$isLoadingMembers ? 'Refreshing...' : 'Refresh'}
    </button>

    {#if $membersError}
        <div class="error">
            Error: {$membersError}
        </div>
    {:else if $isLoadingMembers && $members.length === 0}
        <div>Loading members...</div>
    {:else}
        <div>
            <h2>Active Members ({$activeMembers.length})</h2>
            <ul>
                {#each $activeMembers as member}
                    <li>
                        {member.firstName} {member.lastName} - {member.email}
                    </li>
                {/each}
            </ul>
        </div>
    {/if}
</div>
```

### Member Detail with Facilities

```svelte
<script lang="ts">
    import { onMount } from 'svelte';
    import {
        loadMemberDetail,
        memberDetail,
        isLoadingMemberDetail,
        loadRentedFacilities,
        rentedFacilities,
        isLoadingRentedFacilities,
    } from '$lib/data/repositories';

    let memberId = 123;
    const detail = memberDetail(memberId);
    const detailLoading = isLoadingMemberDetail(memberId);
    const facilities = rentedFacilities(memberId);
    const facilitiesLoading = isLoadingRentedFacilities(memberId);

    onMount(async () => {
        await Promise.all([
            loadMemberDetail(memberId),
            loadRentedFacilities(memberId)
        ]);
    });
</script>

<div>
    {#if $detailLoading}
        <p>Loading member details...</p>
    {:else if $detail}
        <h1>{$detail.firstName} {$detail.lastName}</h1>
        <p>{$detail.email}</p>

        <h2>Rented Facilities</h2>
        {#if $facilitiesLoading}
            <p>Loading facilities...</p>
        {:else if $facilities.length > 0}
            <ul>
                {#each $facilities as facility}
                    <li>
                        {facility.facilityName} - {facility.facilityIdentifier}
                        {#if facility.boatInfo}
                            <span>Boat: {facility.boatInfo.name}</span>
                        {/if}
                    </li>
                {/each}
            </ul>
        {:else}
            <p>No rented facilities</p>
        {/if}
    {/if}
</div>
```

## Testing

### Using Mock Data

Mock data is automatically used in development when `VITE_API_URL` is not set.

To force mock data even with an API URL, modify the repository:

```typescript
const USE_MOCK_DATA = true; // Force mock data
```

### Testing Cache Behavior

```typescript
// Initial load
await loadMembers(); // Fetches from API

// Subsequent load (within 5 minutes)
await loadMembers(); // Uses cache

// Force refresh
await loadMembers(true); // Fetches from API

// Invalidate cache
invalidateMembersCache();
await loadMembers(); // Fetches from API
```

## Best Practices

### 1. Load Once on Mount

```svelte
<script>
    import { onMount } from 'svelte';
    import { loadMembers } from '$lib/data/repositories/members-repository';

    onMount(() => loadMembers());
</script>
```

### 2. Handle Errors Gracefully

```svelte
<script>
    async function loadData() {
        try {
            await loadMembers();
        } catch (error) {
            // Show user-friendly error message
            console.error('Failed to load:', error);
        }
    }
</script>
```

### 3. Use Optimistic Updates

```svelte
<script>
    async function deleteMember(id: number) {
        // Remove from cache immediately
        removeMemberFromCache(id);

        try {
            await deleteMemberAPI(id);
        } catch (error) {
            // Refresh to restore state on error
            await loadMembers(true);
        }
    }
</script>
```

### 4. Show Loading States

```svelte
{#if $isLoadingMembers && $members.length === 0}
    <LoadingSpinner />
{:else}
    <MembersList members={$members} />
{/if}
```

### 5. Refresh After Mutations

```typescript
// After creating, updating, or deleting members
await createMember(newMember);
await loadMembers(true); // Refresh to ensure consistency
```

## Troubleshooting

### Cache not updating

**Solution**: Use `loadMembers(true)` to force refresh or `invalidateMembersCache()` to mark cache as stale.

### API errors in development

**Solution**: Ensure `VITE_API_URL` is not set in `.env` to use mock data, or start your backend server.

### Stale data showing

**Solution**: Cache duration is 5 minutes. Either wait or call `loadMembers(true)` to force refresh.

### TypeScript errors

**Solution**: Ensure `Member` type in `$model/members/member.ts` matches your API response structure.

## Relationship with API Layer

Repositories use the API layer for all HTTP communication:

```typescript
// Repository uses API functions
import { fetchMembers } from "$lib/data/api";

async function fetchMembersData(): Promise<Member[]> {
  if (USE_MOCK_DATA) {
    return mockMembers;
  }
  return fetchMembers(); // Calls API layer
}
```

See `../api/README.md` for details on the API layer.

## Best Practices Summary

1. **Use repositories in components**, not API functions directly
2. **Subscribe to stores** for reactive updates
3. **Handle loading and error states** for better UX
4. **Use optimistic updates** for instant feedback
5. **Force refresh** after mutations to ensure data consistency
6. **Clear cache** when needed to free memory

## Future Enhancements

Potential improvements:

- [ ] Pagination support
- [ ] Search/filter caching
- [ ] WebSocket integration for real-time updates
- [ ] IndexedDB persistence for offline support
- [ ] Request deduplication
- [ ] Retry logic with exponential backoff
- [ ] Background refresh for stale data
