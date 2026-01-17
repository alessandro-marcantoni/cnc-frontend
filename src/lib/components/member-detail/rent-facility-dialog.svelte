<script lang="ts">
    import * as Dialog from "$lib/components/ui/dialog";
    import * as Select from "$lib/components/ui/select";
    import * as InputGroup from "$lib/components/ui/input-group";
    import * as Popover from "$lib/components/ui/popover";
    import * as Command from "$lib/components/ui/command";
    import * as Alert from "$lib/components/ui/alert";
    import { Button } from "$lib/components/ui/button";
    import { Label } from "$lib/components/ui/label";
    import { Badge } from "$lib/components/ui/badge";
    import WaitlistAlert from "$lib/components/waitlist/waitlist-alert.svelte";
    import JoinWaitlistDialog from "$lib/components/waitlist/join-waitlist-dialog.svelte";
    import { addToWaitlist } from "$lib/data/api";
    import {
        ChevronsUpDown,
        Check,
        AlertCircle,
        Loader2,
        RefreshCw,
        Sparkles,
    } from "@lucide/svelte";

    import type { FacilityType } from "$model/facilities/facility-type";
    import type { FacilityWithStatus } from "$model/facilities/facility-with-status";
    import type { Season } from "$model/shared/season";
    import type { RentedFacility } from "$model/facilities/rented-facility";
    import {
        rentFacility,
        type RentFacilityRequest,
        getSuggestedPrice,
    } from "$lib/data/api/facilities-api";
    import { loadWaitlist } from "$lib/data/repositories";

    interface Props {
        open: boolean;
        mode: "rent" | "renew";
        memberId: number;
        memberName: string;
        facilityTypes: FacilityType[];
        availableFacilities: FacilityWithStatus[];
        currentSeason: Season;
        availableSeasons: Season[];
        facilityToRenew?: RentedFacility | null;
        onClose: () => void;
        onSuccess: (facilityTypeId: number, seasonId: number) => void;
        onLoadFacilitiesForType?: (typeId: number, seasonId: number) => void;
    }

    let {
        open = $bindable(),
        mode,
        memberId,
        memberName,
        facilityTypes,
        availableFacilities,
        currentSeason,
        availableSeasons,
        facilityToRenew = null,
        onClose,
        onSuccess,
        onLoadFacilitiesForType,
    }: Props = $props();

    // Internal state
    let selectedFacilityType = $state<number | null>(null);
    let selectedFacilityId = $state<number | null>(null);
    let selectedSeason = $state<string>("");
    let price = $state("");
    let facilityTypeComboboxOpen = $state(false);
    let errorMessage = $state<string | null>(null);
    let isSubmitting = $state(false);
    let joinWaitlistDialogOpen = $state(false);
    let isJoiningWaitlist = $state(false);
    let isLoadingPrice = $state(false);
    let priceInfo = $state<{
        hasSpecialPrice: boolean;
        savingsAmount: number;
    } | null>(null);

    const isRenewMode = $derived(mode === "renew");
    const defaultSeason = $derived(currentSeason.name.toString());

    // Initialize state when dialog opens
    $effect(() => {
        if (open) {
            // Reset state
            errorMessage = null;
            isSubmitting = false;
            selectedSeason = defaultSeason;

            if (isRenewMode && facilityToRenew) {
                // Renew mode: use existing facility
                selectedFacilityType = null;
                selectedFacilityId = facilityToRenew.facilityId;

                // Find facility type and fetch suggested price from API
                const facilityType = facilityTypes.find(
                    (ft) => ft.name === facilityToRenew.facilityName,
                );
                if (facilityType) {
                    // Find the selected season object
                    const selectedSeasonObj = availableSeasons.find(
                        (s) => s.name.toString() === selectedSeason,
                    );
                    if (selectedSeasonObj) {
                        fetchSuggestedPrice(
                            facilityType.id,
                            selectedSeasonObj.id,
                        );
                    } else {
                        // Fallback to base price if season not found
                        price = facilityType.suggestedPrice.toString();
                    }
                } else {
                    price = "";
                }
            } else {
                // Rent mode: reset selections
                selectedFacilityType = null;
                selectedFacilityId = null;
                price = "";
            }
        }
    });

    // Auto-fill price and fetch suggested price when facility is selected in rent mode
    $effect(() => {
        if (
            !isRenewMode &&
            selectedFacilityId &&
            availableFacilities.length > 0 &&
            selectedSeason
        ) {
            const facility = availableFacilities.find(
                (f) => f.id === selectedFacilityId,
            );
            const selectedSeasonObj = availableSeasons.find(
                (s) => s.name.toString() === selectedSeason,
            );

            if (facility && selectedSeasonObj && selectedFacilityType) {
                fetchSuggestedPrice(selectedFacilityType, selectedSeasonObj.id);
            }
        }
    });

    async function fetchSuggestedPrice(
        facilityTypeId: number,
        seasonId: number,
    ) {
        isLoadingPrice = true;
        priceInfo = null;

        try {
            const result = await getSuggestedPrice(
                facilityTypeId,
                memberId,
                seasonId,
            );

            price = result.suggestedPrice.toFixed(2);

            if (result.hasSpecialPrice) {
                priceInfo = {
                    hasSpecialPrice: true,
                    savingsAmount: result.savingsAmount,
                };
            } else {
                priceInfo = null;
            }
        } catch (error) {
            console.error("Failed to calculate suggested price:", error);
            // Fallback to base price
            const facility = availableFacilities.find(
                (f) => f.id === selectedFacilityId,
            );
            if (facility) {
                price = facility.suggestedPrice.toString();
            }
            priceInfo = null;
        } finally {
            isLoadingPrice = false;
        }
    }

    // Load facilities when type or season is selected
    $effect(() => {
        if (selectedFacilityType && selectedSeason && onLoadFacilitiesForType) {
            const selectedSeasonObj = availableSeasons.find(
                (s) => s.name.toString() === selectedSeason,
            );
            if (selectedSeasonObj) {
                onLoadFacilitiesForType(
                    selectedFacilityType,
                    selectedSeasonObj.id,
                );
            }
        }
    });

    // Reset selected facility when season changes (rent mode) or refetch price (renew mode)
    $effect(() => {
        if (selectedSeason) {
            if (isRenewMode && facilityToRenew) {
                // In renew mode, refetch the suggested price for the new season
                const facilityType = facilityTypes.find(
                    (ft) => ft.name === facilityToRenew.facilityName,
                );
                const selectedSeasonObj = availableSeasons.find(
                    (s) => s.name.toString() === selectedSeason,
                );
                if (facilityType && selectedSeasonObj) {
                    fetchSuggestedPrice(facilityType.id, selectedSeasonObj.id);
                }
            } else if (!isRenewMode) {
                // In rent mode, reset selections
                selectedFacilityId = null;
                price = "";
            }
        }
    });

    const facilityTypeOptions = $derived(
        facilityTypes.map((type) => ({
            value: type.id,
            label: type.name,
            description: type.description,
        })),
    );

    const selectedFacilityTypeName = $derived(
        selectedFacilityType
            ? facilityTypes.find((t) => t.id === selectedFacilityType)?.name
            : null,
    );

    const selectedFacility = $derived(
        selectedFacilityId
            ? availableFacilities.find((f) => f.id === selectedFacilityId)
            : null,
    );

    const availableFacilitiesFiltered = $derived(
        availableFacilities.filter((f) => !f.isRented),
    );

    const hasAvailableFacilities = $derived(
        availableFacilitiesFiltered.length > 0,
    );

    const suggestedPrice = $derived(
        isRenewMode && facilityToRenew
            ? (facilityTypes.find(
                  (ft) =>
                      ft.description ===
                      facilityToRenew.facilityTypeDescription,
              )?.suggestedPrice ?? 0)
            : (selectedFacility?.suggestedPrice ?? null),
    );

    const isValid = $derived(
        selectedSeason &&
            price &&
            parseFloat(price) > 0 &&
            (isRenewMode ||
                (selectedFacilityId !== null && hasAvailableFacilities)),
    );

    function handleClose() {
        open = false;
        onClose();
    }

    async function handleSubmit() {
        if (!isValid) return;

        errorMessage = null;
        isSubmitting = true;

        try {
            // Find the selected season object
            const selectedSeasonObj = availableSeasons.find(
                (s) => s.name.toString() === selectedSeason,
            );

            if (!selectedSeasonObj) {
                errorMessage = "Stagione non valida";
                return;
            }

            // Validate price
            const priceValue = parseFloat(price);
            if (isNaN(priceValue) || priceValue <= 0) {
                errorMessage = "Il prezzo deve essere maggiore di zero";
                return;
            }

            // Determine facility ID
            const facilityId =
                isRenewMode && facilityToRenew
                    ? facilityToRenew.facilityId
                    : selectedFacilityId;

            if (!facilityId) {
                errorMessage = "Seleziona un servizio";
                return;
            }

            const rentFacilityRequest: RentFacilityRequest = {
                memberId,
                facilityId,
                seasonId: selectedSeasonObj.id,
                price: priceValue,
            };

            await rentFacility(rentFacilityRequest);

            // Success
            open = false;
            onSuccess(
                availableFacilities.find(
                    (facility) => facility.id === selectedFacilityId,
                )!!.facilityTypeId,
                selectedSeasonObj.id,
            );
        } catch (error) {
            if (error instanceof Error) {
                errorMessage = error.message;
            } else {
                errorMessage =
                    "Si è verificato un errore imprevisto durante l'operazione";
            }
        } finally {
            isSubmitting = false;
        }
    }

    function handleFacilityTypeSelect(typeId: number) {
        selectedFacilityType = typeId;
        selectedFacilityId = null;
        facilityTypeComboboxOpen = false;
    }
</script>

<Dialog.Root bind:open>
    <Dialog.Content class="sm:max-w-125">
        <Dialog.Header>
            <Dialog.Title class="flex items-center gap-2">
                {#if isRenewMode}
                    <RefreshCw class="h-5 w-5" />
                    Rinnova Affitto Servizio
                {:else}
                    Affitta Servizio
                {/if}
            </Dialog.Title>
            <Dialog.Description>
                {#if isRenewMode && facilityToRenew}
                    Rinnova l'affitto di {facilityToRenew.facilityName} - {facilityToRenew.facilityIdentifier}
                    per
                    {memberName}
                {:else}
                    Seleziona il servizio da affittare per {memberName}
                {/if}
            </Dialog.Description>
        </Dialog.Header>

        <div class="grid gap-4 py-4">
            <!-- Season Selection -->
            <div class="grid gap-2">
                <Label for="season">
                    Stagione <span class="text-destructive">*</span>
                </Label>
                <Select.Root type="single" bind:value={selectedSeason}>
                    <Select.Trigger id="season" class="w-full">
                        {selectedSeason
                            ? `Stagione ${selectedSeason}`
                            : "Seleziona stagione"}
                    </Select.Trigger>
                    <Select.Content>
                        <Select.Group>
                            <Select.Label>Stagioni Disponibili</Select.Label>
                            {#if isRenewMode}
                                {#each availableSeasons.filter((season) => season.name >= currentSeason.name) as season (season.name)}
                                    <Select.Item value={season.name.toString()}>
                                        Stagione {season.name}
                                    </Select.Item>
                                {/each}
                            {:else}
                                {#each availableSeasons as season (season.name)}
                                    <Select.Item value={season.name.toString()}>
                                        Stagione {season.name}
                                    </Select.Item>
                                {/each}
                            {/if}
                        </Select.Group>
                    </Select.Content>
                </Select.Root>
                {#if isRenewMode}
                    <p class="text-xs text-muted-foreground">
                        Puoi rinnovare solo per la stagione corrente o stagioni
                        future.
                    </p>
                {/if}
            </div>

            {#if !isRenewMode}
                <!-- Facility Type Selection for Rent Mode -->
                <div class="grid gap-2">
                    <label
                        class="text-sm font-medium"
                        for="facility-type-trigger"
                    >
                        Tipo di Servizio <span class="text-destructive">*</span>
                    </label>
                    <Popover.Root bind:open={facilityTypeComboboxOpen}>
                        <Popover.Trigger id="facility-type-trigger">
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={facilityTypeComboboxOpen}
                                class="w-full justify-between"
                            >
                                {selectedFacilityTypeName ||
                                    "Seleziona tipo di servizio..."}
                                <ChevronsUpDown
                                    class="ml-2 h-4 w-4 shrink-0 opacity-50"
                                />
                            </Button>
                        </Popover.Trigger>
                        <Popover.Content class="w-full p-0">
                            <Command.Root>
                                <Command.Input
                                    placeholder="Cerca tipo di servizio..."
                                />
                                <Command.Empty
                                    >Nessun tipo trovato.</Command.Empty
                                >
                                <Command.List>
                                    <Command.Group>
                                        {#each facilityTypeOptions as option (option.value)}
                                            <Command.Item
                                                value={option.label}
                                                onSelect={() =>
                                                    handleFacilityTypeSelect(
                                                        option.value,
                                                    )}
                                            >
                                                <Check
                                                    class={selectedFacilityType ===
                                                    option.value
                                                        ? "mr-2 h-4 w-4 opacity-100"
                                                        : "mr-2 h-4 w-4 opacity-0"}
                                                />
                                                <div>
                                                    <div>{option.label}</div>
                                                    <div
                                                        class="text-xs text-muted-foreground"
                                                    >
                                                        {option.description}
                                                    </div>
                                                </div>
                                            </Command.Item>
                                        {/each}
                                    </Command.Group>
                                </Command.List>
                            </Command.Root>
                        </Popover.Content>
                    </Popover.Root>
                </div>

                <!-- Specific Facility Selection for Rent Mode -->
                {#if selectedFacilityType}
                    <div class="grid gap-2">
                        <label
                            class="text-sm font-medium"
                            for="facility-trigger"
                        >
                            Servizio Specifico <span class="text-destructive"
                                >*</span
                            >
                        </label>
                        <Select.Root
                            type="single"
                            onValueChange={(value) => {
                                selectedFacilityId = value
                                    ? parseInt(value)
                                    : null;
                            }}
                        >
                            <Select.Trigger
                                class="w-full"
                                id="facility-trigger"
                            >
                                {#if selectedFacilityId}
                                    {availableFacilities.find(
                                        (f) => f.id === selectedFacilityId,
                                    )?.identifier || "Seleziona servizio..."}
                                {:else}
                                    Seleziona servizio...
                                {/if}
                            </Select.Trigger>
                            <Select.Content>
                                <Select.Group>
                                    <Select.Label
                                        >Servizi Disponibili</Select.Label
                                    >
                                    {#if hasAvailableFacilities}
                                        {#each availableFacilitiesFiltered as facility (facility.id)}
                                            <Select.Item
                                                value={facility.id.toString()}
                                            >
                                                {facility.identifier} - €{facility.suggestedPrice.toFixed(
                                                    2,
                                                )}
                                            </Select.Item>
                                        {/each}
                                    {:else}
                                        <Select.Item value="" disabled>
                                            Nessun servizio disponibile
                                        </Select.Item>
                                    {/if}
                                </Select.Group>
                            </Select.Content>
                        </Select.Root>
                    </div>

                    <!-- Show waitlist alert if no facilities available -->
                    {#if !hasAvailableFacilities && selectedFacilityTypeName}
                        <WaitlistAlert
                            facilityTypeName={selectedFacilityTypeName}
                            waitlistCount={0}
                            memberPosition={null}
                            onJoinWaitlist={() =>
                                (joinWaitlistDialogOpen = true)}
                        />
                    {/if}
                {/if}
            {/if}

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
                        bind:value={price}
                        placeholder="0.00"
                    />
                    <InputGroup.Addon align="inline-end">
                        <InputGroup.Text>EUR</InputGroup.Text>
                    </InputGroup.Addon>
                </InputGroup.Root>
                {#if priceInfo?.hasSpecialPrice}
                    <Alert.Root>
                        <Sparkles class="h-4 w-4" />
                        <Alert.Title class="flex items-center gap-2">
                            <Badge variant="default">Prezzo Speciale</Badge>
                        </Alert.Title>
                        <Alert.Description>
                            Risparmi €{priceInfo.savingsAmount.toFixed(2)} grazie
                            ai tuoi altri servizi attivi.
                        </Alert.Description>
                    </Alert.Root>
                {:else if suggestedPrice !== null && !isLoadingPrice}
                    <p class="text-xs text-muted-foreground">
                        Prezzo suggerito: €{suggestedPrice.toFixed(2)}
                    </p>
                {/if}
                {#if isLoadingPrice}
                    <p
                        class="text-xs text-muted-foreground flex items-center gap-2"
                    >
                        <Loader2 class="h-3 w-3 animate-spin" />
                        Calcolo del prezzo...
                    </p>
                {/if}
            </div>
        </div>

        <!-- Error Message -->
        {#if errorMessage}
            <Alert.Root variant="destructive">
                <AlertCircle class="h-4 w-4" />
                <Alert.Title>Errore</Alert.Title>
                <Alert.Description>{errorMessage}</Alert.Description>
            </Alert.Root>
        {/if}

        <Dialog.Footer>
            <Button
                variant="outline"
                onclick={handleClose}
                disabled={isSubmitting}
            >
                Annulla
            </Button>
            <Button onclick={handleSubmit} disabled={!isValid || isSubmitting}>
                {#if isSubmitting}
                    <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                    {isRenewMode
                        ? "Rinnovo in corso..."
                        : "Affitto in corso..."}
                {:else if isRenewMode}
                    <RefreshCw class="h-4 w-4 mr-2" />
                    Conferma Rinnovo
                {:else}
                    Conferma Affitto
                {/if}
            </Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>

<!-- Join Waitlist Dialog -->
{#if selectedFacilityTypeName}
    <JoinWaitlistDialog
        bind:open={joinWaitlistDialogOpen}
        facilityTypeName={selectedFacilityTypeName}
        waitlistCount={0}
        onClose={() => (joinWaitlistDialogOpen = false)}
        onConfirm={async (notes) => {
            if (!selectedFacilityType) return;

            isJoiningWaitlist = true;
            try {
                await addToWaitlist({
                    memberId,
                    facilityTypeId: selectedFacilityType,
                    notes: notes || undefined,
                });
                await loadWaitlist(selectedFacilityType, true);
                joinWaitlistDialogOpen = false;
                open = false;
                // Optionally show success message or refresh data
            } catch (error) {
                console.error("Failed to add to waitlist:", error);
                // Error is handled by the dialog component
            } finally {
                isJoiningWaitlist = false;
            }
        }}
        isSubmitting={isJoiningWaitlist}
    />
{/if}
