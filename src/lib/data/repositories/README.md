# Members Repository Documentation

A Svelte store-based repository that manages member data with automatic caching and API integration.

## Features

- ✅ **Automatic Caching**: Caches data for 5 minutes to reduce API calls
- ✅ **Reactive Stores**: Subscribe to member data changes reactively
- ✅ **Loading States**: Built-in loading and error state management
- ✅ **Optimistic Updates**: Update cache immediately for better UX
- ✅ **Development Fallback**: Automatically uses mock data when API is unavailable
- ✅ **Type-Safe**: Full TypeScript support with Member types

## Quick Start

### Basic Usage

```svelte
<script lang="ts">
    import { onMount } from 'svelte';
    import { members, loadMembers, isLoadingMembers } from '$lib/data/repositories/members-repository';

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

## API Reference

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
const newMember = { /* ... */ };
await createMemberAPI(newMember);
addMemberToCache(newMember);
```

#### `updateMemberInCache(member: Member): void`

Updates an existing member in the cache.

```typescript
const updatedMember = { ...existingMember, email: 'new@email.com' };
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

To change, edit `CACHE_DURATION` in `members-repository.ts`:

```typescript
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
```

## Complete Example

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
    } from '$lib/data/repositories/members-repository';

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

## Future Enhancements

Potential improvements:

- [ ] Pagination support
- [ ] Search/filter caching
- [ ] WebSocket integration for real-time updates
- [ ] IndexedDB persistence for offline support
- [ ] Request deduplication
- [ ] Retry logic with exponential backoff
