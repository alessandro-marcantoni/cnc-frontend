<script lang="ts">
    import { onMount, untrack } from "svelte";
    import MembersStats from "$lib/components/members/members-stats.svelte";
    import AllMembersDataTable from "$lib/components/members/all-members-data-table.svelte";
    import SeasonMembersDataTable from "$lib/components/members/season-members-data-table.svelte";
    import AddMemberDialog from "$lib/components/members/add-member-dialog.svelte";
    import Header from "$lib/components/shared/header.svelte";
    import * as Card from "$lib/components/ui/card";
    import * as Select from "$lib/components/ui/select";
    import { Button } from "$lib/components/ui/button";
    import {
        RefreshCw,
        CircleAlert,
        UserPlus,
        Calendar,
        FileText,
    } from "@lucide/svelte";
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
    import { downloadMemberListPDF } from "$lib/data/api";
    import type { Season } from "$model/shared/season";
    import { formatDate } from "$model/shared/date-utils";
    import { getQueryParam, setQueryParam } from "$lib/utils/query-params";

    // Dialog state
    let addMemberDialogOpen = $state(false);

    // PDF download state
    let isDownloadingPDF = $state(false);

    // Get available seasons
    const seasons = getSeasons();

    // Initialize season from URL query param (using season name) or default to null for "all seasons"
    const seasonNameFromUrl = getQueryParam("season");
    const seasonFromUrl = seasonNameFromUrl
        ? seasons.find((s) => s.name.toString() === seasonNameFromUrl)
        : null;

    // Selected season state - stores season ID internally (empty string for "all seasons")
    let selectedSeason = $state<Season | null>(seasonFromUrl ?? null);
    let selectedSeasonValue = $state<string>(
        seasonFromUrl ? seasonFromUrl.id.toString() : "",
    );

    async function handleRefresh() {
        try {
            // Pass season ID (or undefined for all seasons)
            await loadMembers(true, selectedSeasonValue || undefined);
        } catch (error) {
            console.error("Failed to refresh members:", error);
        }
    }

    async function handleDownloadPDF() {
        if (!selectedSeason) {
            // TODO: Show error toast - need to select a season
            console.error("Please select a season to download PDF");
            return;
        }

        isDownloadingPDF = true;
        try {
            await downloadMemberListPDF(selectedSeason.id);
        } catch (error) {
            console.error("Failed to download PDF:", error);
            // TODO: Show error toast
        } finally {
            isDownloadingPDF = false;
        }
    }

    // Watch for season changes and reload members
    $effect(() => {
        if (selectedSeasonValue === "") {
            // All seasons selected
            selectedSeason = null;
            // Update URL without triggering the effect again
            untrack(() => {
                setQueryParam("season", null);
            });
            loadMembers(false, undefined).catch((error) => {
                console.error("Failed to load members for all seasons:", error);
            });
        } else if (selectedSeasonValue) {
            // Specific season selected - find season object by ID
            const season = seasons.find(
                (s) => s.id.toString() === selectedSeasonValue,
            );
            if (season) {
                selectedSeason = season;
                // Update URL with season name (not ID)
                untrack(() => {
                    setQueryParam("season", season.name.toString());
                });
                // Pass season ID to API
                loadMembers(false, selectedSeasonValue).catch((error) => {
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
                            >Elenco Soci {selectedSeason
                                ? `(${selectedSeason.name})`
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
                        <Button onclick={() => (addMemberDialogOpen = true)}>
                            <UserPlus class="h-4 w-4 mr-2" />
                            Aggiungi Socio
                        </Button>
                        <Button
                            variant="outline"
                            onclick={handleDownloadPDF}
                            disabled={!selectedSeason || isDownloadingPDF}
                        >
                            <FileText
                                class={isDownloadingPDF
                                    ? "h-4 w-4 mr-2 animate-pulse"
                                    : "h-4 w-4 mr-2"}
                            />
                            {isDownloadingPDF
                                ? "Generazione..."
                                : "Scarica PDF"}
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
                                {seasons.find(
                                    (season) =>
                                        season.id.toString() ===
                                        selectedSeasonValue,
                                )?.name ?? "Seleziona stagione"}
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
                                    <Select.Item value={season.id.toString()}>
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

<!-- Add Member Dialog -->
<AddMemberDialog
    bind:open={addMemberDialogOpen}
    onMemberCreated={handleRefresh}
/>
