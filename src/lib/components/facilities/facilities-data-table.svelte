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
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
    import * as Alert from "$lib/components/ui/alert";
    import {
        ChevronUp,
        ChevronDown,
        CircleCheck,
        CircleX,
        ChevronsUpDown,
        Check,
        MoreVertical,
        CalendarPlus,
        AlertCircle,
        Loader2,
    } from "@lucide/svelte";
    import type { FacilityWithStatus } from "$model/facilities/facility-with-status";
    import type { Member } from "$model/members/member";
    import {
        members,
        loadMembers,
    } from "$lib/data/repositories/members-repository";
    import { loadFacilitiesByType } from "$lib/data/repositories/facilities-by-type-repository";
    import {
        rentFacility,
        getSuggestedPrice,
        type SuggestedPriceResponse,
    } from "$lib/data/api/facilities-api";
    import { onMount } from "svelte";
    import { goto } from "@mateothegreat/svelte5-router";
    import type { RentFacilityRequest } from "$lib/data/api/facilities-api";

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
        selectedSeasonId: number;
    }

    let { data, selectedSeasonId }: Props = $props();

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
    let selectedMemberId = $state<string | null>(null);
    let bookingPrice = $state("");
    let isSubmitting = $state(false);
    let submitError = $state<string | null>(null);
    let suggestedPriceInfo = $state<SuggestedPriceResponse | null>(null);
    let isLoadingSuggestedPrice = $state(false);

    // Combobox state
    let comboboxOpen = $state(false);

    // Load members on mount
    onMount(() => {
        loadMembers();
    });

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
        submitError = null;
        suggestedPriceInfo = null;

        // Set default price from facility
        bookingPrice = facility.suggestedPrice.toString();

        isDialogOpen = true;
    }

    async function fetchSuggestedPrice() {
        if (!selectedFacility || !selectedMemberId) return;

        isLoadingSuggestedPrice = true;
        try {
            const priceInfo = await getSuggestedPrice(
                selectedFacility.facilityTypeId,
                parseInt(selectedMemberId),
                selectedSeasonId,
            );
            suggestedPriceInfo = priceInfo;
            bookingPrice = priceInfo.suggestedPrice.toString();
        } catch (error) {
            console.error("Failed to fetch suggested price:", error);
            // Fallback to base price
            if (selectedFacility) {
                bookingPrice = selectedFacility.suggestedPrice.toString();
            }
        } finally {
            isLoadingSuggestedPrice = false;
        }
    }

    async function handleBookingSubmit() {
        if (!selectedFacility || !selectedMemberId) return;

        isSubmitting = true;
        submitError = null;

        const rentFacilityRequest: RentFacilityRequest = {
            memberId: parseInt(selectedMemberId),
            facilityId: selectedFacility.id,
            seasonId: selectedSeasonId,
            price: parseFloat(bookingPrice),
        };

        try {
            // Call API to rent the facility
            await rentFacility(rentFacilityRequest);

            // Refresh facilities list to show updated status
            await loadFacilitiesByType(
                selectedFacility.facilityTypeId,
                selectedSeasonId,
                true, // force refresh
            );

            // Close dialog on success
            isDialogOpen = false;

            // Reset dialog state
            selectedFacility = null;
            selectedMemberId = null;
            bookingPrice = "";
        } catch (error) {
            // Handle error
            submitError =
                error instanceof Error
                    ? error.message
                    : "Errore durante la prenotazione del servizio";
            console.error("Failed to rent facility:", error);
        } finally {
            isSubmitting = false;
        }
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
                            onclick={() => handleSort("identifier")}
                            class="flex items-center gap-1 hover:text-foreground transition-colors"
                        >
                            Identificatore
                            {#if isSortedAsc("identifier")}
                                <ChevronUp class="h-4 w-4" />
                            {:else if isSortedDesc("identifier")}
                                <ChevronDown class="h-4 w-4" />
                            {/if}
                        </button>
                    </Table.Head>
                    <Table.Head>
                        <button
                            onclick={() => handleSort("status")}
                            class="flex items-center gap-1 hover:text-foreground transition-colors"
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
                            onclick={() => handleSort("expiresAt")}
                            class="flex items-center gap-1 hover:text-foreground transition-colors"
                        >
                            Affittato a
                            {#if isSortedAsc("expiresAt")}
                                <ChevronUp class="h-4 w-4" />
                            {:else if isSortedDesc("expiresAt")}
                                <ChevronDown class="h-4 w-4" />
                            {/if}
                        </button>
                    </Table.Head>
                    <Table.Head class="text-right w-20">Azioni</Table.Head>
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
                                {#if facility.isRented && facility.rentedByMemberFirstName && facility.rentedByMemberLastName && facility.rentedByMemberId}
                                    {facility.rentedByMemberFirstName}
                                    {facility.rentedByMemberLastName}
                                {:else}
                                    <span class="text-muted-foreground">—</span>
                                {/if}
                            </Table.Cell>
                            <Table.Cell class="text-right">
                                <DropdownMenu.Root>
                                    <DropdownMenu.Trigger>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            class="h-8 w-8 p-0"
                                        >
                                            <MoreVertical class="h-4 w-4" />
                                            <span class="sr-only">Azioni</span>
                                        </Button>
                                    </DropdownMenu.Trigger>
                                    <DropdownMenu.Content
                                        align="end"
                                        class="w-48"
                                    >
                                        <DropdownMenu.Label>
                                            Azioni
                                        </DropdownMenu.Label>
                                        <DropdownMenu.Separator />
                                        {#if facility.isRented && facility.rentedByMemberId}
                                            <DropdownMenu.Item
                                                onclick={() =>
                                                    goto(
                                                        `/members/${facility.rentedByMemberId}`,
                                                    )}
                                            >
                                                Visualizza Dettagli Socio
                                            </DropdownMenu.Item>
                                        {:else}
                                            <DropdownMenu.Item
                                                onclick={() =>
                                                    openBookingDialog(facility)}
                                            >
                                                <CalendarPlus
                                                    class="mr-2 h-4 w-4"
                                                />
                                                Affitta Servizio
                                            </DropdownMenu.Item>
                                        {/if}
                                    </DropdownMenu.Content>
                                </DropdownMenu.Root>
                            </Table.Cell>
                        </Table.Row>
                    {/each}
                {:else}
                    <Table.Row>
                        <Table.Cell colspan={4} class="h-24 text-center">
                            Nessun servizio trovato con i filtri selezionati.
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
            )} di {filteredFacilities.length} servizi
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
    <Dialog.Content class="sm:max-w-125">
        <Dialog.Header>
            <Dialog.Title>Affitta Servizio</Dialog.Title>
            <Dialog.Description>
                Inserisci i dettagli per affittare il servizio {selectedFacility?.identifier}
            </Dialog.Description>
        </Dialog.Header>

        <div class="grid gap-4 py-4">
            <!-- Member Selection -->
            <div class="grid gap-2">
                <label class="text-sm font-medium" for="member-select">
                    Socio <span class="text-destructive">*</span>
                </label>
                <Popover.Root bind:open={comboboxOpen}>
                    <Popover.Trigger id="member-select">
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
                                                fetchSuggestedPrice();
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
                {#if isLoadingSuggestedPrice}
                    <div
                        class="flex items-center gap-2 text-xs text-muted-foreground"
                    >
                        <Loader2 class="h-3 w-3 animate-spin" />
                        <span>Calcolo prezzo...</span>
                    </div>
                {:else if suggestedPriceInfo}
                    {#if suggestedPriceInfo.hasSpecialPrice}
                        <Alert.Root variant="default" class="py-2">
                            <Alert.Description class="text-sm">
                                <div
                                    class="flex items-start justify-between gap-2"
                                >
                                    <div>
                                        <p class="font-medium">
                                            Prezzo speciale applicato!
                                        </p>
                                        <p
                                            class="text-xs text-muted-foreground mt-1"
                                        >
                                            Prezzo base: €{suggestedPriceInfo.basePrice.toFixed(
                                                2,
                                            )}
                                            • Risparmio: €{suggestedPriceInfo.savingsAmount.toFixed(
                                                2,
                                            )}
                                        </p>
                                    </div>
                                    <Badge variant="secondary" class="shrink-0">
                                        -{(
                                            (suggestedPriceInfo.savingsAmount /
                                                suggestedPriceInfo.basePrice) *
                                            100
                                        ).toFixed(0)}%
                                    </Badge>
                                </div>
                            </Alert.Description>
                        </Alert.Root>
                    {:else}
                        <p class="text-xs text-muted-foreground">
                            Prezzo base: €{suggestedPriceInfo.basePrice.toFixed(
                                2,
                            )}
                        </p>
                    {/if}
                {:else if selectedFacility}
                    <p class="text-xs text-muted-foreground">
                        Prezzo suggerito: €{selectedFacility.suggestedPrice.toFixed(
                            2,
                        )}
                    </p>
                {/if}
            </div>

            {#if suggestedPriceInfo && suggestedPriceInfo.applicableRules > 0}
                <Alert.Root variant="default">
                    <AlertCircle class="h-4 w-4" />
                    <Alert.Title>Regole di prezzo applicate</Alert.Title>
                    <Alert.Description>
                        {suggestedPriceInfo.applicableRules}
                        {suggestedPriceInfo.applicableRules === 1
                            ? "regola di prezzo è stata applicata"
                            : "regole di prezzo sono state applicate"} per questo
                        socio.
                    </Alert.Description>
                </Alert.Root>
            {/if}
        </div>

        <!-- Error Message -->
        {#if submitError}
            <div
                class="rounded-lg border border-destructive/50 bg-destructive/10 p-4"
            >
                <div class="flex items-start gap-2">
                    <AlertCircle
                        class="h-5 w-5 text-destructive shrink-0 mt-0.5"
                    />
                    <p class="text-sm text-destructive">
                        {submitError}
                    </p>
                </div>
            </div>
        {/if}

        <Dialog.Footer>
            <Button
                variant="outline"
                onclick={() => (isDialogOpen = false)}
                disabled={isSubmitting}
            >
                Annulla
            </Button>
            <Button
                onclick={handleBookingSubmit}
                disabled={!selectedMemberId || !bookingPrice || isSubmitting}
            >
                {#if isSubmitting}
                    <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                    Affitto in corso...
                {:else}
                    Conferma Affitto
                {/if}
            </Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
