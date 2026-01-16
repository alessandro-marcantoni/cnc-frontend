<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "@mateothegreat/svelte5-router";
    import Header from "$lib/components/shared/header.svelte";
    import * as Card from "$lib/components/ui/card";
    import * as Select from "$lib/components/ui/select";
    import { Button } from "$lib/components/ui/button";
    import { Separator } from "$lib/components/ui/separator";
    import FacilitiesDataTable from "$lib/components/facilities/facilities-data-table.svelte";
    import {
        loadFacilitiesByType,
        facilitiesByType,
        isLoadingFacilitiesByType,
        facilitiesByTypeError,
    } from "$lib/data/repositories";
    import {
        getSeasons,
        getCurrentSeason,
    } from "$lib/data/repositories/seasons-repository";
    import { ArrowLeft, Layers, CircleAlert } from "@lucide/svelte";
    import FacilitiesStats from "$lib/components/facilities/facilities-stats.svelte";
    import type { Season } from "$model/shared/season";

    // Get facility type ID from route params
    let { route } = $props();
    let facilityTypeId = $derived(parseInt(route.result.path.params.id, 10));
    let isValidId = $derived(!isNaN(facilityTypeId) && facilityTypeId > 0);

    // Get available seasons
    const seasons = getSeasons();
    const currentSeason = getCurrentSeason();

    // Selected season state
    let selectedSeasonValue = $state<string>(currentSeason.id.toString());
    let selectedSeason = $derived<Season | null>(
        seasons.find(
            (season) => season.id.toString() === selectedSeasonValue,
        ) ?? null,
    );

    // Track facility type details from first facility
    let facilityTypeName = $state("");
    let facilityTypeDescription = $state("");
    let suggestedPrice = $state(0);

    // Update facility type details when data loads
    $effect(() => {
        if ($facilitiesByType.length > 0) {
            const first = $facilitiesByType[0];
            facilityTypeName = first.facilityTypeName;
            facilityTypeDescription = first.facilityTypeDescription;
            suggestedPrice = first.suggestedPrice;
        }
    });

    // Load facilities when season or facility type changes
    $effect(() => {
        if (!isValidId || !selectedSeason) return;

        loadFacilitiesByType(facilityTypeId, selectedSeason.id).catch(
            (error) => {
                console.error("Failed to load facilities:", error);
            },
        );
    });

    function formatPrice(price: number): string {
        return new Intl.NumberFormat("it-IT", {
            style: "currency",
            currency: "EUR",
        }).format(price);
    }

    function goBack() {
        goto("/services");
    }
</script>

<Header />

<!-- Main Content -->
<main class="container mx-auto px-4 py-8">
    <!-- Back Button and Season Selector -->
    <div class="flex items-center justify-between mb-6">
        <Button variant="ghost" onclick={goBack} class="-ml-2">
            <ArrowLeft class="mr-2 h-4 w-4" />
            Torna ai Servizi
        </Button>

        <!-- Season Selector -->
        <div class="flex items-center gap-2">
            <span class="text-sm font-medium">Stagione:</span>
            <Select.Root type="single" bind:value={selectedSeasonValue}>
                <Select.Trigger class="w-40">
                    {selectedSeason
                        ? `Stagione ${selectedSeason.name}`
                        : "Seleziona stagione"}
                </Select.Trigger>
                <Select.Content>
                    <Select.Group>
                        <Select.Label>Stagioni Disponibili</Select.Label>
                        {#each seasons as season (season.name)}
                            <Select.Item value={season.id.toString()}>
                                Stagione {season.name}
                            </Select.Item>
                        {/each}
                    </Select.Group>
                </Select.Content>
            </Select.Root>
        </div>
    </div>

    <!-- Loading State -->
    {#if $isLoadingFacilitiesByType}
        <div class="flex items-center justify-center py-24">
            <div class="text-center">
                <div
                    class="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"
                    role="status"
                >
                    <span class="sr-only">Caricamento...</span>
                </div>
                <p class="mt-6 text-lg text-muted-foreground font-medium">
                    Caricamento servizi...
                </p>
            </div>
        </div>
    {:else if $facilitiesByTypeError}
        <!-- Error State -->
        <Card.Root class="border-destructive/50">
            <Card.Content>
                <div class="flex items-start gap-4">
                    <div class="rounded-full bg-destructive/10 p-3">
                        <CircleAlert class="h-6 w-6 text-destructive" />
                    </div>
                    <div class="flex-1">
                        <h3 class="font-semibold text-lg text-destructive mb-1">
                            Errore nel caricamento dei servizi
                        </h3>
                        <p class="text-sm text-muted-foreground">
                            {$facilitiesByTypeError}
                        </p>
                    </div>
                </div>
            </Card.Content>
        </Card.Root>
    {:else if $facilitiesByType.length === 0}
        <!-- Empty State -->
        <Card.Root class="border-dashed">
            <Card.Content class="py-24">
                <div class="text-center">
                    <div
                        class="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4"
                    >
                        <Layers class="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 class="text-lg font-semibold mb-2">
                        Nessun servizio trovato
                    </h3>
                    <p class="text-muted-foreground max-w-sm mx-auto">
                        Non ci sono servizi disponibili per questo tipo di
                        servizio al momento.
                    </p>
                </div>
            </Card.Content>
        </Card.Root>
    {:else}
        <!-- Header Section -->
        <div class="mb-8">
            <div class="flex items-start justify-between mb-4">
                <div class="flex-1">
                    <h1 class="text-4xl font-bold tracking-tight mb-3">
                        {facilityTypeName}
                    </h1>
                    <p class="text-lg text-muted-foreground max-w-2xl">
                        {facilityTypeDescription}
                    </p>
                </div>
            </div>

            <Separator class="my-6" />

            <!-- Stats Cards -->
            <FacilitiesStats />

            <!-- Price Info Card -->
            <Card.Root>
                <Card.Content>
                    <div class="flex items-center gap-3">
                        <div class="text-sm text-muted-foreground">
                            Prezzo suggerito per questo servizio:
                        </div>
                        <div
                            class="text-2xl font-bold text-primary flex items-baseline gap-1"
                        >
                            {formatPrice(suggestedPrice)}
                            <span
                                class="text-sm font-normal text-muted-foreground"
                                >/anno</span
                            >
                        </div>
                    </div>
                </Card.Content>
            </Card.Root>
        </div>

        <!-- Data Table Section -->
        <Card.Root>
            <Card.Header>
                <div class="flex items-center justify-between">
                    <div>
                        <Card.Title>Elenco Servizi</Card.Title>
                        <Card.Description
                            >Un elenco completo dei servizi di tipo {facilityTypeName}
                            offerti dal Circolo Nautico Cattolica.</Card.Description
                        >
                    </div>
                </div></Card.Header
            >
            <Card.Content>
                <FacilitiesDataTable data={$facilitiesByType} />
            </Card.Content>
        </Card.Root>

        <!-- Facilities Data Table -->
    {/if}
</main>
