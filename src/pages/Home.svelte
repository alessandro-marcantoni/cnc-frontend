<script lang="ts">
    import { onMount } from "svelte";
    import MembersStats from "$lib/components/members/members-stats.svelte";
    import MembersDataTable from "$lib/components/members/members-data-table.svelte";
    import Header from "$lib/components/shared/header.svelte";
    import * as Card from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import { RefreshCw, CircleAlert, UserPlus } from "@lucide/svelte";
    import {
        members,
        isLoadingMembers,
        membersError,
        loadMembers,
    } from "$lib/data/repositories/members-repository";

    // Load members on mount
    onMount(async () => {
        try {
            await loadMembers();
        } catch (error) {
            console.error("Failed to load members:", error);
        }
    });

    async function handleRefresh() {
        try {
            await loadMembers(true); // Force refresh
        } catch (error) {
            console.error("Failed to refresh members:", error);
        }
    }
</script>

<Header showAddMember={false} />

<!-- Main Content -->
<main class="container mx-auto px-4 py-8">
    {#if $membersError}
        <!-- Error State -->
        <div
            class="flex flex-col items-center justify-center gap-4 py-12 text-center"
        >
            <CircleAlert class="h-12 w-12 text-destructive" />
            <div>
                <h2 class="text-xl font-semibold mb-2">
                    Failed to Load Members
                </h2>
                <p class="text-muted-foreground mb-4">{$membersError}</p>
                <Button onclick={handleRefresh}>
                    <RefreshCw class="h-4 w-4 mr-2" />
                    Try Again
                </Button>
            </div>
        </div>
    {:else if $isLoadingMembers && $members.length === 0}
        <!-- Loading State (initial load) -->
        <div
            class="flex flex-col items-center justify-center gap-4 py-12 text-center"
        >
            <div class="animate-spin">
                <RefreshCw class="h-8 w-8 text-muted-foreground" />
            </div>
            <p class="text-muted-foreground">Loading members...</p>
        </div>
    {:else}
        <!-- Stats Grid -->
        <MembersStats members={$members} />

        <!-- Members Table -->
        <Card.Root>
            <Card.Header>
                <div class="flex items-center justify-between">
                    <div>
                        <Card.Title>Members Directory</Card.Title>
                        <Card.Description>
                            A comprehensive list of all yacht club members.
                            Filter by name or toggle membership status.
                        </Card.Description>
                    </div>
                    <div class="flex gap-2">
                        <Button>
                            <UserPlus class="h-4 w-4 mr-2" />
                            Add Member
                        </Button>
                        <Button
                            variant="outline"
                            onclick={handleRefresh}
                            disabled={$isLoadingMembers}
                        >
                            <RefreshCw
                                class={$isLoadingMembers
                                    ? "h-4 w-4 mr-2 animate-spin"
                                    : "h-4 w-4 mr-2"}
                            />
                            Refresh
                        </Button>
                    </div>
                </div>
            </Card.Header>
            <Card.Content>
                <MembersDataTable data={$members} />
            </Card.Content>
        </Card.Root>
    {/if}
</main>
