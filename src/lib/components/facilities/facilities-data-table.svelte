<script lang="ts">
    import * as Table from "$lib/components/ui/table";
    import { Button } from "$lib/components/ui/button";
    import { Badge, type BadgeVariant } from "$lib/components/ui/badge";
    import { Input } from "$lib/components/ui/input";
    import MultiSelect from "$lib/components/ui/multi-select.svelte";
    import {
        ChevronUp,
        ChevronDown,
        CircleCheck,
        CircleX,
        Calendar,
    } from "@lucide/svelte";
    import type { FacilityWithStatus } from "$model/facilities/facility-with-status";

    type FacilityStatus = "AVAILABLE" | "RENTED";

    const statusOptions: {
        value: FacilityStatus;
        label: string;
        variant: BadgeVariant;
    }[] = [
        { value: "AVAILABLE", label: "Disponibile", variant: "default" },
        { value: "RENTED", label: "Occupata", variant: "destructive" },
    ];

    // Props
    interface Props {
        data: FacilityWithStatus[];
    }

    let { data }: Props = $props();

    // State
    let searchQuery = $state("");
    let statusFilter = $state<FacilityStatus[]>(["AVAILABLE", "RENTED"]);
    let sortColumn = $state<string | null>(null);
    let sortDirection = $state<"asc" | "desc">("asc");
    let currentPage = $state(0);
    let pageSize = 50;

    // Format date
    function formatDate(dateString?: string): string {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString("it-IT", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    }

    // Get facility status
    function getFacilityStatus(facility: FacilityWithStatus): FacilityStatus {
        return facility.isRented ? "RENTED" : "AVAILABLE";
    }

    // Filter facilities
    const filteredFacilities = $derived.by(() => {
        let filtered = data;

        // Filter by search query (identifier)
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter((facility) =>
                facility.identifier.toLowerCase().includes(query),
            );
        }

        // Filter by status
        filtered = filtered.filter((facility) =>
            statusFilter.includes(getFacilityStatus(facility)),
        );

        // Sort
        if (sortColumn) {
            filtered = [...filtered].sort((a, b) => {
                let aVal: any;
                let bVal: any;

                switch (sortColumn) {
                    case "identifier":
                        aVal = a.identifier;
                        bVal = b.identifier;
                        break;
                    case "status":
                        aVal = a.isRented ? 1 : 0;
                        bVal = b.isRented ? 1 : 0;
                        break;
                    case "expiresAt":
                        aVal = a.expiresAt || "";
                        bVal = b.expiresAt || "";
                        break;
                    default:
                        return 0;
                }

                if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
                if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
                return 0;
            });
        }

        return filtered;
    });

    // Paginate
    const paginatedFacilities = $derived.by(() => {
        const start = currentPage * pageSize;
        const end = start + pageSize;
        return filteredFacilities.slice(start, end);
    });

    const totalPages = $derived(
        Math.ceil(filteredFacilities.length / pageSize),
    );

    function handleSort(column: string) {
        if (sortColumn === column) {
            sortDirection = sortDirection === "asc" ? "desc" : "asc";
        } else {
            sortColumn = column;
            sortDirection = "asc";
        }
    }

    function isSortedAsc(column: string): boolean {
        return sortColumn === column && sortDirection === "asc";
    }

    function isSortedDesc(column: string): boolean {
        return sortColumn === column && sortDirection === "desc";
    }

    function nextPage() {
        if (currentPage < totalPages - 1) {
            currentPage++;
        }
    }

    function previousPage() {
        if (currentPage > 0) {
            currentPage--;
        }
    }

    // Reset to first page when search query or status filter changes
    $effect(() => {
        searchQuery;
        statusFilter;
        currentPage = 0;
    });
</script>

<div class="space-y-4">
    <!-- Filters -->
    <div
        class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
    >
        <div class="flex-1 max-w-sm">
            <Input
                placeholder="Filtra per identificativo..."
                bind:value={searchQuery}
                class="w-full"
            />
        </div>
        <div class="flex items-center gap-2">
            <label
                for="status-filter"
                class="text-sm font-medium text-muted-foreground"
            >
                Stato:
            </label>
            <MultiSelect
                options={statusOptions}
                bind:selected={statusFilter}
                placeholder="Seleziona stato..."
                class="w-70"
            />
        </div>
    </div>

    <!-- Table -->
    <div class="rounded-md border">
        <Table.Root>
            <Table.Header>
                <Table.Row>
                    <Table.Head>
                        <button
                            class="flex items-center gap-1 font-medium hover:text-foreground"
                            onclick={() => handleSort("identifier")}
                        >
                            Identificativo
                            {#if isSortedAsc("identifier")}
                                <ChevronUp class="h-4 w-4" />
                            {:else if isSortedDesc("identifier")}
                                <ChevronDown class="h-4 w-4" />
                            {/if}
                        </button>
                    </Table.Head>
                    <Table.Head>
                        <button
                            class="flex items-center gap-1 font-medium hover:text-foreground"
                            onclick={() => handleSort("status")}
                        >
                            Stato
                            {#if isSortedAsc("status")}
                                <ChevronUp class="h-4 w-4" />
                            {:else if isSortedDesc("status")}
                                <ChevronDown class="h-4 w-4" />
                            {/if}
                        </button>
                    </Table.Head>
                    <Table.Head>
                        <button
                            class="flex items-center gap-1 font-medium hover:text-foreground"
                            onclick={() => handleSort("expiresAt")}
                        >
                            Scadenza Affitto
                            {#if isSortedAsc("expiresAt")}
                                <ChevronUp class="h-4 w-4" />
                            {:else if isSortedDesc("expiresAt")}
                                <ChevronDown class="h-4 w-4" />
                            {/if}
                        </button>
                    </Table.Head>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {#if paginatedFacilities.length > 0}
                    {#each paginatedFacilities as facility (facility.id)}
                        <Table.Row class="hover:bg-muted/50 transition-colors">
                            <Table.Cell class="font-semibold">
                                {facility.identifier}
                            </Table.Cell>
                            <Table.Cell>
                                {#if facility.isRented}
                                    <Badge variant="destructive">
                                        <CircleX class="h-3 w-3 mr-1" />
                                        Occupata
                                    </Badge>
                                {:else}
                                    <Badge>
                                        <CircleCheck class="h-3 w-3 mr-1" />
                                        Disponibile
                                    </Badge>
                                {/if}
                            </Table.Cell>
                            <Table.Cell>
                                {#if facility.isRented && facility.expiresAt}
                                    <div class="flex items-center gap-2">
                                        <Calendar
                                            class="h-4 w-4 text-muted-foreground"
                                        />
                                        <span>
                                            {formatDate(facility.expiresAt)}
                                        </span>
                                    </div>
                                {:else}
                                    <span class="text-muted-foreground">-</span>
                                {/if}
                            </Table.Cell>
                        </Table.Row>
                    {/each}
                {:else}
                    <Table.Row>
                        <Table.Cell colspan={3} class="h-24 text-center">
                            Nessuna struttura trovata con i filtri selezionati.
                        </Table.Cell>
                    </Table.Row>
                {/if}
            </Table.Body>
        </Table.Root>
    </div>

    <!-- Pagination -->
    <div class="flex items-center justify-between px-2">
        <div class="flex-1 text-sm text-muted-foreground">
            Visualizzazione {filteredFacilities.length > 0
                ? currentPage * pageSize + 1
                : 0}-{Math.min(
                (currentPage + 1) * pageSize,
                filteredFacilities.length,
            )} di {filteredFacilities.length} struttura/e
        </div>
        <div class="flex items-center gap-2">
            <Button
                variant="outline"
                size="sm"
                onclick={previousPage}
                disabled={currentPage === 0}
            >
                Precedente
            </Button>
            <div class="text-sm">
                Pagina {totalPages > 0 ? currentPage + 1 : 0} di {totalPages}
            </div>
            <Button
                variant="outline"
                size="sm"
                onclick={nextPage}
                disabled={currentPage >= totalPages - 1}
            >
                Successiva
            </Button>
        </div>
    </div>
</div>
