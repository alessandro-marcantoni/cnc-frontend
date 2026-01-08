<script lang="ts">
    import * as Table from "$lib/components/ui/table";
    import { Button } from "$lib/components/ui/button";
    import { Badge, type BadgeVariant } from "$lib/components/ui/badge";
    import { Input } from "$lib/components/ui/input";
    import MultiSelect from "$lib/components/ui/multi-select.svelte";
    import * as Dialog from "$lib/components/ui/dialog";
    import * as Popover from "$lib/components/ui/popover";
    import * as Command from "$lib/components/ui/command";
    import * as InputGroup from "$lib/components/ui/input-group";
    import {
        ChevronUp,
        ChevronDown,
        CircleCheck,
        CircleX,
        Calendar,
        ChevronsUpDown,
        Check,
    } from "@lucide/svelte";
    import type { FacilityWithStatus } from "$model/facilities/facility-with-status";
    import type { Member } from "$model/members/member";
    import {
        members,
        loadMembers,
    } from "$lib/data/repositories/members-repository";
    import { getCurrentSeason } from "$lib/data/repositories/seasons-repository";
    import { onMount } from "svelte";

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

    // Dialog state
    let isDialogOpen = $state(false);
    let selectedFacility = $state<FacilityWithStatus | null>(null);
    let selectedMemberId = $state<string>("");
    let isWholeSeason = $state(true);
    let bookingStartDate = $state("");
    let bookingEndDate = $state("");
    let bookingPrice = $state("");

    // Combobox state
    let comboboxOpen = $state(false);

    // Load members on mount
    onMount(() => {
        loadMembers();
    });

    // Helper function to format date for input[type="date"]
    function formatDateForInput(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    // Format date for display
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
        const _ = searchQuery;
        const __ = statusFilter;
        currentPage = 0;
    });

    function openBookingDialog(facility: FacilityWithStatus) {
        selectedFacility = facility;
        selectedMemberId = "";
        comboboxOpen = false;
        isWholeSeason = true;

        // Set default dates
        const today = new Date();
        const currentSeason = getCurrentSeason();

        bookingStartDate = formatDateForInput(today);
        bookingEndDate = currentSeason
            ? formatDateForInput(currentSeason.endsAt)
            : "";

        // Set default price from facility
        bookingPrice = facility.suggestedPrice.toString();

        isDialogOpen = true;
    }

    // Update dates when season toggle changes
    $effect(() => {
        if (isDialogOpen && selectedFacility) {
            if (isWholeSeason) {
                const currentSeason = getCurrentSeason();
                if (currentSeason) {
                    bookingStartDate = formatDateForInput(
                        currentSeason.startsAt,
                    );
                    bookingEndDate = formatDateForInput(currentSeason.endsAt);
                }
            } else {
                const today = new Date();
                const currentSeason = getCurrentSeason();
                bookingStartDate = formatDateForInput(today);
                bookingEndDate = currentSeason
                    ? formatDateForInput(currentSeason.endsAt)
                    : "";
            }
        }
    });

    function handleBookingSubmit() {
        if (!selectedFacility || !selectedMemberId) return;

        // TODO: Implement booking logic here
        console.log("Booking facility:", {
            facilityId: selectedFacility.id,
            identifier: selectedFacility.identifier,
            memberId: selectedMemberId,
            isWholeSeason,
            startDate: bookingStartDate,
            endDate: bookingEndDate,
            price: parseFloat(bookingPrice),
        });

        // Close dialog
        isDialogOpen = false;
    }

    // Computed list of member options for the select
    const memberOptions = $derived(
        $members.map((member: Member) => ({
            value: member.id.toString(),
            label: `${member.firstName} ${member.lastName} (${member.membershipNumber})`,
        })),
    );
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
                    <Table.Head class="text-right">Azioni</Table.Head>
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
                            <Table.Cell class="text-right">
                                {#if !facility.isRented}
                                    <Button
                                        class="h-6"
                                        onclick={() =>
                                            openBookingDialog(facility)}
                                    >
                                        Affitta
                                    </Button>
                                {/if}
                            </Table.Cell>
                        </Table.Row>
                    {/each}
                {:else}
                    <Table.Row>
                        <Table.Cell colspan={4} class="h-24 text-center">
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

<!-- Booking Dialog -->
<Dialog.Root bind:open={isDialogOpen}>
    <Dialog.Content class="sm:max-w-[500px]">
        <Dialog.Header>
            <Dialog.Title>Affitta Struttura</Dialog.Title>
            <Dialog.Description>
                Inserisci i dettagli per affittare la struttura {selectedFacility?.identifier}
            </Dialog.Description>
        </Dialog.Header>

        <div class="grid gap-4 py-4">
            <!-- Member Selection -->
            <div class="grid gap-2">
                <label class="text-sm font-medium">
                    Socio <span class="text-destructive">*</span>
                </label>
                <Popover.Root bind:open={comboboxOpen}>
                    <Popover.Trigger>
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={comboboxOpen}
                            class="w-full justify-between"
                        >
                            {memberOptions.find(
                                (option) => option.value === selectedMemberId,
                            )?.label || "Seleziona socio..."}
                            <ChevronsUpDown
                                class="ml-2 h-4 w-4 shrink-0 opacity-50"
                            />
                        </Button>
                    </Popover.Trigger>
                    <Popover.Content class="w-full p-0">
                        <Command.Root>
                            <Command.Input placeholder="Cerca socio..." />
                            <Command.Empty>Nessun socio trovato.</Command.Empty>
                            <Command.List>
                                <Command.Group>
                                    {#each memberOptions as option (option.value)}
                                        <Command.Item
                                            value={option.label}
                                            onSelect={() => {
                                                selectedMemberId = option.value;
                                                comboboxOpen = false;
                                            }}
                                        >
                                            <Check
                                                class={selectedMemberId ===
                                                option.value
                                                    ? "mr-2 h-4 w-4 opacity-100"
                                                    : "mr-2 h-4 w-4 opacity-0"}
                                            />
                                            {option.label}
                                        </Command.Item>
                                    {/each}
                                </Command.Group>
                            </Command.List>
                        </Command.Root>
                    </Popover.Content>
                </Popover.Root>
            </div>

            <!-- Season Toggle -->
            <div class="grid gap-2">
                <label class="text-sm font-medium">Periodo</label>
                <div class="flex gap-2">
                    <Button
                        variant={isWholeSeason ? "default" : "outline"}
                        size="sm"
                        class="flex-1"
                        onclick={() => (isWholeSeason = true)}
                        type="button"
                    >
                        Intera Stagione
                    </Button>
                    <Button
                        variant={!isWholeSeason ? "default" : "outline"}
                        size="sm"
                        class="flex-1"
                        onclick={() => (isWholeSeason = false)}
                        type="button"
                    >
                        Date Personalizzate
                    </Button>
                </div>
            </div>

            <!-- Date Inputs -->
            <div class="grid grid-cols-2 gap-4">
                <!-- Start Date -->
                <div class="grid gap-2">
                    <label for="start-date" class="text-sm font-medium">
                        Data Inizio <span class="text-destructive">*</span>
                    </label>
                    <Input
                        id="start-date"
                        type="date"
                        bind:value={bookingStartDate}
                        disabled={isWholeSeason}
                        required
                    />
                </div>

                <!-- End Date -->
                <div class="grid gap-2">
                    <label for="end-date" class="text-sm font-medium">
                        Data Fine <span class="text-destructive">*</span>
                    </label>
                    <Input
                        id="end-date"
                        type="date"
                        bind:value={bookingEndDate}
                        disabled={isWholeSeason}
                        required
                    />
                </div>
            </div>

            <!-- Price Input -->
            <div class="grid gap-2">
                <label for="price" class="text-sm font-medium">
                    Prezzo<span class="text-destructive">*</span>
                </label>
                <InputGroup.Root>
                    <InputGroup.Addon>
                        <InputGroup.Text>€</InputGroup.Text>
                    </InputGroup.Addon>
                    <InputGroup.Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        bind:value={bookingPrice}
                        placeholder="0.00"
                    />
                    <InputGroup.Addon align="inline-end">
                        <InputGroup.Text>EUR</InputGroup.Text>
                    </InputGroup.Addon>
                </InputGroup.Root>
                {#if selectedFacility}
                    <p class="text-xs text-muted-foreground">
                        Prezzo suggerito: €{selectedFacility.suggestedPrice.toFixed(
                            2,
                        )}
                    </p>
                {/if}
            </div>
        </div>

        <Dialog.Footer>
            <Button variant="outline" onclick={() => (isDialogOpen = false)}>
                Annulla
            </Button>
            <Button
                onclick={handleBookingSubmit}
                disabled={!selectedMemberId ||
                    !bookingStartDate ||
                    !bookingEndDate ||
                    !bookingPrice}
            >
                Conferma Affitto
            </Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
