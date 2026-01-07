<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "@mateothegreat/svelte5-router";
    import Header from "$lib/components/shared/header.svelte";
    import * as Card from "$lib/components/ui/card";
    import { Input } from "$lib/components/ui/input";
    import {
        loadFacilitiesCatalog,
        facilitiesCatalog,
        isLoadingFacilitiesCatalog,
        facilitiesCatalogError,
    } from "$lib/data/repositories";
    import { Search } from "@lucide/svelte";

    let searchQuery = $state("");

    // Reactive filtering of facilities based on search query
    let filteredFacilities = $derived(
        $facilitiesCatalog.filter((facility) =>
            facility.name.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
    );

    onMount(async () => {
        try {
            await loadFacilitiesCatalog();
        } catch (error) {
            console.error("Failed to load facilities catalog:", error);
        }
    });

    function formatPrice(price: number): string {
        return new Intl.NumberFormat("it-IT", {
            style: "currency",
            currency: "EUR",
        }).format(price);
    }

    function navigateToFacilityType(facilityTypeId: number) {
        goto(`/services/${facilityTypeId}`);
    }
</script>

<Header />

<!-- Main Content -->
<main class="container mx-auto px-4 py-8">
    <div class="mb-8">
        <h2 class="text-3xl font-bold tracking-tight">Servizi</h2>
        <p class="text-muted-foreground mt-2">
            Esplora i servizi e le strutture disponibili presso il Circolo
            Nautico Cattolica
        </p>
    </div>

    <!-- Search Filter -->
    <div class="mb-6">
        <div class="relative max-w-md">
            <Search
                class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
                type="text"
                placeholder="Cerca servizi..."
                bind:value={searchQuery}
                class="pl-9"
            />
        </div>
    </div>

    <!-- Loading State -->
    {#if $isLoadingFacilitiesCatalog}
        <div class="flex items-center justify-center py-12">
            <div class="text-center">
                <div
                    class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"
                    role="status"
                >
                    <span class="sr-only">Caricamento...</span>
                </div>
                <p class="mt-4 text-muted-foreground">Caricamento servizi...</p>
            </div>
        </div>
    {:else if $facilitiesCatalogError}
        <!-- Error State -->
        <div
            class="rounded-lg border border-destructive/50 bg-destructive/10 p-6"
        >
            <h3 class="font-semibold text-destructive">
                Errore nel caricamento dei servizi
            </h3>
            <p class="mt-2 text-sm text-muted-foreground">
                {$facilitiesCatalogError}
            </p>
        </div>
    {:else if filteredFacilities.length === 0}
        <!-- Empty State -->
        <div class="rounded-lg border border-dashed p-12 text-center">
            <p class="text-muted-foreground">
                {searchQuery
                    ? `Nessun servizio trovato per "${searchQuery}"`
                    : "Nessun servizio disponibile"}
            </p>
        </div>
    {:else}
        <!-- Services Grid -->
        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {#each filteredFacilities as facility (facility.id)}
                <Card.Root
                    class="cursor-pointer transition-all hover:shadow-lg hover:scale-105"
                    onclick={() => navigateToFacilityType(facility.id)}
                >
                    <Card.Header>
                        <Card.Title>{facility.name}</Card.Title>
                    </Card.Header>
                    <Card.Content>
                        <p class="text-muted-foreground mb-4">
                            {facility.description}
                        </p>
                        <div class="flex items-center justify-between">
                            <span class="text-sm text-muted-foreground"
                                >Prezzo suggerito</span
                            >
                            <span class="font-semibold text-primary">
                                {formatPrice(facility.suggestedPrice)}
                            </span>
                        </div>
                    </Card.Content>
                </Card.Root>
            {/each}
        </div>
    {/if}
</main>
