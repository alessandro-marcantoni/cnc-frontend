# Members Repository Usage Examples

Practical examples for using the members repository in different scenarios.

## Table of Contents

1. [Basic Loading](#basic-loading)
2. [Loading States](#loading-states)
3. [Error Handling](#error-handling)
4. [Refresh Button](#refresh-button)
5. [Optimistic Updates](#optimistic-updates)
6. [Filtered Views](#filtered-views)
7. [Member Details Page](#member-details-page)
8. [Statistics Dashboard](#statistics-dashboard)
9. [Real-time Updates](#real-time-updates)
10. [Offline Support](#offline-support)

---

## Basic Loading

Simple component that loads and displays members.

```svelte
<script lang="ts">
    import { onMount } from 'svelte';
    import { members, loadMembers } from '$lib/data/repositories/members-repository';

    onMount(() => {
        loadMembers();
    });
</script>

<div>
    <h1>Members ({$members.length})</h1>
    <ul>
        {#each $members as member}
            <li>{member.firstName} {member.lastName}</li>
        {/each}
    </ul>
</div>
```

---

## Loading States

Show different UI states while loading.

```svelte
<script lang="ts">
    import { onMount } from 'svelte';
    import {
        members,
        isLoadingMembers,
        membersError,
        loadMembers
    } from '$lib/data/repositories/members-repository';

    onMount(() => {
        loadMembers();
    });
</script>

{#if $membersError}
    <!-- Error State -->
    <div class="error">
        <p>⚠️ {$membersError}</p>
        <button onclick={() => loadMembers(true)}>Retry</button>
    </div>
{:else if $isLoadingMembers && $members.length === 0}
    <!-- Initial Loading State -->
    <div class="loading">
        <p>Loading members...</p>
    </div>
{:else if $members.length === 0}
    <!-- Empty State -->
    <div class="empty">
        <p>No members found</p>
    </div>
{:else}
    <!-- Data Loaded -->
    <div class="members">
        {#each $members as member}
            <div class="member-card">
                {member.firstName} {member.lastName}
            </div>
        {/each}
    </div>
{/if}

{#if $isLoadingMembers && $members.length > 0}
    <!-- Background Refresh Indicator -->
    <div class="refreshing">Refreshing...</div>
{/if}
```

---

## Error Handling

Comprehensive error handling with retry logic.

```svelte
<script lang="ts">
    import { onMount } from 'svelte';
    import {
        members,
        isLoadingMembers,
        membersError,
        loadMembers
    } from '$lib/data/repositories/members-repository';
    import { AlertCircle, RefreshCw } from '@lucide/svelte';

    let retryCount = $state(0);
    const MAX_RETRIES = 3;

    onMount(async () => {
        await loadMembersWithRetry();
    });

    async function loadMembersWithRetry() {
        try {
            await loadMembers();
            retryCount = 0; // Reset on success
        } catch (error) {
            console.error('Load failed:', error);
            
            if (retryCount < MAX_RETRIES) {
                retryCount++;
                setTimeout(loadMembersWithRetry, 2000 * retryCount);
            }
        }
    }
</script>

{#if $membersError}
    <div class="error-container">
        <AlertCircle class="error-icon" />
        <h2>Unable to Load Members</h2>
        <p>{$membersError}</p>
        
        {#if retryCount < MAX_RETRIES}
            <p class="retry-info">
                Retry attempt {retryCount} of {MAX_RETRIES}
            </p>
        {/if}
        
        <button onclick={loadMembersWithRetry} disabled={$isLoadingMembers}>
            <RefreshCw class={$isLoadingMembers ? 'spin' : ''} />
            Try Again
        </button>
    </div>
{/if}
```

---

## Refresh Button

Add a refresh button with loading state.

```svelte
<script lang="ts">
    import { onMount } from 'svelte';
    import {
        members,
        isLoadingMembers,
        cacheAge,
        loadMembers
    } from '$lib/data/repositories/members-repository';
    import { RefreshCw } from '@lucide/svelte';

    onMount(() => {
        loadMembers();
    });

    async function handleRefresh() {
        await loadMembers(true); // Force refresh
    }
</script>

<div class="header">
    <div>
        <h1>Members</h1>
        {#if $cacheAge !== null}
            <p class="cache-info">Updated {$cacheAge}s ago</p>
        {/if}
    </div>
    
    <button
        onclick={handleRefresh}
        disabled={$isLoadingMembers}
        class="refresh-btn"
    >
        <RefreshCw class={$isLoadingMembers ? 'animate-spin' : ''} />
        Refresh
    </button>
</div>

<div class="members-list">
    {#each $members as member}
        <div class="member">{member.firstName} {member.lastName}</div>
    {/each}
</div>
```

---

## Optimistic Updates

Update UI immediately, then sync with API.

```svelte
<script lang="ts">
    import {
        members,
        loadMembers,
        addMemberToCache,
        updateMemberInCache,
        removeMemberFromCache
    } from '$lib/data/repositories/members-repository';
    import type { Member } from '$model/members/member';

    let isCreating = $state(false);
    let isDeleting = $state<number | null>(null);

    async function createMember(newMember: Omit<Member, 'id'>) {
        isCreating = true;
        
        try {
            // Call API
            const response = await fetch('/api/members', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newMember)
            });
            
            const created = await response.json();
            
            // Add to cache immediately
            addMemberToCache(created);
            
        } catch (error) {
            console.error('Create failed:', error);
            // Refresh to restore consistent state
            await loadMembers(true);
        } finally {
            isCreating = false;
        }
    }

    async function updateMember(updated: Member) {
        // Update cache immediately
        updateMemberInCache(updated);
        
        try {
            await fetch(`/api/members/${updated.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated)
            });
        } catch (error) {
            console.error('Update failed:', error);
            await loadMembers(true);
        }
    }

    async function deleteMember(id: number) {
        isDeleting = id;
        
        // Remove from cache immediately
        removeMemberFromCache(id);
        
        try {
            await fetch(`/api/members/${id}`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error('Delete failed:', error);
            await loadMembers(true);
        } finally {
            isDeleting = null;
        }
    }
</script>

<div>
    {#each $members as member}
        <div class="member">
            <span>{member.firstName} {member.lastName}</span>
            <button
                onclick={() => deleteMember(member.id)}
                disabled={isDeleting === member.id}
            >
                {isDeleting === member.id ? 'Deleting...' : 'Delete'}
            </button>
        </div>
    {/each}
</div>
```

---

## Filtered Views

Create reactive filtered member lists.

```svelte
<script lang="ts">
    import { onMount } from 'svelte';
    import {
        members,
        loadMembers,
        getMembersByStatus
    } from '$lib/data/repositories/members-repository';

    const activeMembers = getMembersByStatus('ACTIVE');
    const suspendedMembers = getMembersByStatus('SUSPENDED');
    const expiredMembers = getMembersByStatus('EXPIRED');

    onMount(() => {
        loadMembers();
    });
</script>

<div class="status-tabs">
    <div class="tab">
        <h2>Active ({$activeMembers.length})</h2>
        {#each $activeMembers as member}
            <div class="member-card active">
                {member.firstName} {member.lastName}
            </div>
        {/each}
    </div>

    <div class="tab">
        <h2>Suspended ({$suspendedMembers.length})</h2>
        {#each $suspendedMembers as member}
            <div class="member-card suspended">
                {member.firstName} {member.lastName}
            </div>
        {/each}
    </div>

    <div class="tab">
        <h2>Expired ({$expiredMembers.length})</h2>
        {#each $expiredMembers as member}
            <div class="member-card expired">
                {member.firstName} {member.lastName}
            </div>
        {/each}
    </div>
</div>
```

---

## Member Details Page

Show details for a specific member.

```svelte
<script lang="ts">
    import { onMount } from 'svelte';
    import { page } from '@mateothegreat/svelte5-router';
    import {
        members,
        loadMembers,
        getMemberById
    } from '$lib/data/repositories/members-repository';

    // Get member ID from URL params
    const memberId = $derived(parseInt($page.params.id));
    const member = getMemberById(memberId);

    onMount(() => {
        loadMembers();
    });
</script>

{#if $member}
    <div class="member-details">
        <h1>{$member.firstName} {$member.lastName}</h1>
        
        <div class="info">
            <p><strong>Email:</strong> {$member.email}</p>
            <p><strong>Phone:</strong> {$member.phoneNumbers[0]?.number || 'N/A'}</p>
            
            {#if $member.addresses[0]}
                <p><strong>Address:</strong></p>
                <p>
                    {$member.addresses[0].street} {$member.addresses[0].number}<br>
                    {$member.addresses[0].city}, {$member.addresses[0].zipCode}<br>
                    {$member.addresses[0].country}
                </p>
            {/if}
            
            <p><strong>Status:</strong> {$member.membership.status}</p>
            <p><strong>Member Since:</strong> {new Date($member.membership.validFrom).toLocaleDateString()}</p>
            <p><strong>Expires:</strong> {new Date($member.membership.expiresAt).toLocaleDateString()}</p>
        </div>
    </div>
{:else}
    <p>Member not found</p>
{/if}
```

---

## Statistics Dashboard

Create a dashboard with computed statistics.

```svelte
<script lang="ts">
    import { onMount } from 'svelte';
    import {
        members,
        membersCount,
        loadMembers,
        getMembersByStatus
    } from '$lib/data/repositories/members-repository';

    const activeMembers = getMembersByStatus('ACTIVE');
    const suspendedMembers = getMembersByStatus('SUSPENDED');
    const expiredMembers = getMembersByStatus('EXPIRED');

    // Computed statistics
    const stats = $derived({
        total: $membersCount,
        active: $activeMembers.length,
        suspended: $suspendedMembers.length,
        expired: $expiredMembers.length,
        activePercentage: $membersCount > 0 
            ? Math.round(($activeMembers.length / $membersCount) * 100)
            : 0,
        averageAge: $members.length > 0
            ? Math.round(
                $members.reduce((sum, m) => {
                    const age = new Date().getFullYear() - new Date(m.birthDate).getFullYear();
                    return sum + age;
                }, 0) / $members.length
            )
            : 0
    });

    onMount(() => {
        loadMembers();
    });
</script>

<div class="dashboard">
    <div class="stat-card">
        <h3>Total Members</h3>
        <p class="number">{stats.total}</p>
    </div>

    <div class="stat-card">
        <h3>Active Members</h3>
        <p class="number">{stats.active}</p>
        <p class="percentage">{stats.activePercentage}%</p>
    </div>

    <div class="stat-card">
        <h3>Suspended</h3>
        <p class="number">{stats.suspended}</p>
    </div>

    <div class="stat-card">
        <h3>Expired</h3>
        <p class="number">{stats.expired}</p>
    </div>

    <div class="stat-card">
        <h3>Average Age</h3>
        <p class="number">{stats.averageAge} years</p>
    </div>
</div>
```

---

## Real-time Updates

Poll for updates or use WebSocket simulation.

```svelte
<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import {
        members,
        loadMembers,
        isCacheStale
    } from '$lib/data/repositories/members-repository';

    let pollInterval: number | undefined;
    const POLL_INTERVAL = 30000; // 30 seconds

    onMount(() => {
        // Initial load
        loadMembers();

        // Poll for updates
        pollInterval = setInterval(() => {
            if ($isCacheStale) {
                loadMembers();
            }
        }, POLL_INTERVAL);
    });

    onDestroy(() => {
        if (pollInterval) {
            clearInterval(pollInterval);
        }
    });

    // Manual refresh
    async function handleManualRefresh() {
        await loadMembers(true);
    }
</script>

<div>
    <div class="header">
        <h1>Members (Real-time)</h1>
        <button onclick={handleManualRefresh}>Refresh Now</button>
    </div>

    <div class="members">
        {#each $members as member}
            <div class="member">
                {member.firstName} {member.lastName}
            </div>
        {/each}
    </div>
</div>
```

---

## Offline Support

Handle offline scenarios gracefully.

```svelte
<script lang="ts">
    import { onMount } from 'svelte';
    import {
        members,
        isLoadingMembers,
        membersError,
        loadMembers
    } from '$lib/data/repositories/members-repository';
    import { WifiOff } from '@lucide/svelte';

    let isOnline = $state(navigator.onLine);

    onMount(() => {
        loadMembers();

        // Listen for online/offline events
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    });

    function handleOnline() {
        isOnline = true;
        // Refresh data when coming back online
        loadMembers(true);
    }

    function handleOffline() {
        isOnline = false;
    }
</script>

{#if !isOnline}
    <div class="offline-banner">
        <WifiOff />
        <span>You're offline. Showing cached data.</span>
    </div>
{/if}

<div class="members">
    {#if $membersError && !isOnline}
        <div class="offline-error">
            <p>Unable to load members while offline</p>
            <p>Please check your internet connection</p>
        </div>
    {:else}
        {#each $members as member}
            <div class="member">
                {member.firstName} {member.lastName}
            </div>
        {/each}
    {/if}
</div>

{#if $members.length === 0 && !$isLoadingMembers && !isOnline}
    <div class="empty-offline">
        <p>No cached data available</p>
        <p>Connect to the internet to load members</p>
    </div>
{/if}
```

---

## Tips

1. **Always handle loading states** - Show feedback while data loads
2. **Use optimistic updates** - Update UI immediately for better UX
3. **Handle errors gracefully** - Provide retry options
4. **Leverage derived stores** - Filter and compute data reactively
5. **Poll carefully** - Don't overwhelm the server with requests
6. **Cache effectively** - Use force refresh only when needed
7. **Test offline** - Ensure app works with cached data
