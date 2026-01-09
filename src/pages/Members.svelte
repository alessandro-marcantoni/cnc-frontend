<script lang="ts">
    import { onMount } from "svelte";
    import MembersStats from "$lib/components/members/members-stats.svelte";
    import AllMembersDataTable from "$lib/components/members/all-members-data-table.svelte";
    import SeasonMembersDataTable from "$lib/components/members/season-members-data-table.svelte";
    import Header from "$lib/components/shared/header.svelte";
    import * as Card from "$lib/components/ui/card";
    import * as Select from "$lib/components/ui/select";
    import { Button } from "$lib/components/ui/button";
    import { RefreshCw, CircleAlert, UserPlus, Calendar } from "@lucide/svelte";
    import {
        members,
        isLoadingMembers,
        membersError,
        loadMembers,
    } from "$lib/data/repositories/members-repository";
    import {
        getSeasons,
        getCurrentSeason,
    } from "$lib/data/repositories/seasons-repository";
    import type { Season } from "$model/shared/season";
    import { formatDate } from "$model/shared/date-utils";

    // Get available seasons
    const seasons = getSeasons();

    // Selected season state - default to empty string for "all seasons"
    let selectedSeason = $state<Season | null>(null);
    let selectedSeasonValue = $state<string>("");

    // Load members on mount
    onMount(async () => {
        try {
            await loadMembers(false, undefined); // Load all seasons by default
        } catch (error) {
            console.error("Failed to load members:", error);
        }
    });

    async function handleRefresh() {
        try {
            await loadMembers(true, selectedSeasonValue || undefined);
        } catch (error) {
            console.error("Failed to refresh members:", error);
        }
    }

    // Watch for season changes and reload members
    $effect(() => {
        if (selectedSeasonValue === "") {
            // All seasons selected - don't pass season parameter to API
            selectedSeason = null;
            loadMembers(true, undefined).catch((error) => {
                console.error("Failed to load members for all seasons:", error);
            });
        } else if (selectedSeasonValue) {
            const season = seasons.find(
                (s) => s.name.toString() === selectedSeasonValue,
            );
            if (season) {
                selectedSeason = season;
                loadMembers(true, selectedSeasonValue).catch((error) => {
                    console.error("Failed to load members for season:", error);
                });
            }
        }
    });
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
                    Impossibile Caricare i Soci
                </h2>
                <p class="text-muted-foreground mb-4">{$membersError}</p>
                <Button onclick={handleRefresh}>
                    <RefreshCw class="h-4 w-4 mr-2" />
                    Riprova
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
            <p class="text-muted-foreground">Caricamento soci...</p>
        </div>
    {:else}
        <!-- Stats Grid -->
        <MembersStats members={$members} />

        <!-- Members Table -->
        <Card.Root>
            <Card.Header>
                <div class="flex items-center justify-between">
                    <div>
                        <Card.Title
                            >Elenco Soci {selectedSeasonValue
                                ? `(${selectedSeasonValue})`
                                : ""}</Card.Title
                        >
                        <Card.Description>
                            Un elenco completo di tutti i soci del circolo
                            nautico. Filtra per nome {#if selectedSeason}o stato
                                di pagamento{:else}
                                o stato di iscrizione{/if}.
                        </Card.Description>
                    </div>
                    <div class="flex gap-2">
                        <Button>
                            <UserPlus class="h-4 w-4 mr-2" />
                            Aggiungi Socio
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
                            Aggiorna
                        </Button>
                    </div>
                </div>
            </Card.Header>
            <Card.Content>
                <!-- Season Filter -->
                <div class="mb-6 flex items-center gap-3">
                    <div class="flex items-center gap-2 text-sm font-medium">
                        <Calendar class="h-4 w-4 text-muted-foreground" />
                        <span>Stagione:</span>
                    </div>
                    <Select.Root type="single" bind:value={selectedSeasonValue}>
                        <Select.Trigger class="w-50">
                            {#if selectedSeasonValue}
                                Stagione {selectedSeasonValue}
                            {:else}
                                Tutte le stagioni
                            {/if}
                        </Select.Trigger>
                        <Select.Content>
                            <Select.Group>
                                <Select.Label>Stagioni Disponibili</Select.Label
                                >
                                <Select.Item value="">
                                    Tutte le stagioni
                                </Select.Item>
                                {#each seasons as season (season.name)}
                                    <Select.Item value={season.name.toString()}>
                                        Stagione {season.name}
                                    </Select.Item>
                                {/each}
                            </Select.Group>
                        </Select.Content>
                    </Select.Root>
                    {#if selectedSeason}
                        <span class="text-xs text-muted-foreground">
                            ({formatDate(selectedSeason.startsAt)} - {formatDate(
                                selectedSeason.endsAt,
                            )})
                        </span>
                    {/if}
                </div>

                {#if selectedSeason}
                    <SeasonMembersDataTable data={$members} />
                {:else}
                    <AllMembersDataTable data={$members} />
                {/if}
            </Card.Content>
        </Card.Root>
    {/if}
</main>
