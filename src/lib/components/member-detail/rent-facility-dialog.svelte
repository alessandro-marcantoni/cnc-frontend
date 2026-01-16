<script lang="ts">
    import * as Dialog from "$lib/components/ui/dialog";
    import * as Select from "$lib/components/ui/select";
    import * as InputGroup from "$lib/components/ui/input-group";
    import * as Popover from "$lib/components/ui/popover";
    import * as Command from "$lib/components/ui/command";
    import { Button } from "$lib/components/ui/button";
    import { Label } from "$lib/components/ui/label";
    import WaitlistAlert from "$lib/components/waitlist/waitlist-alert.svelte";
    import JoinWaitlistDialog from "$lib/components/waitlist/join-waitlist-dialog.svelte";
    import {
        ChevronsUpDown,
        Check,
        AlertCircle,
        Loader2,
        RefreshCw,
    } from "@lucide/svelte";

    import type { FacilityType } from "$model/facilities/facility-type";
    import type { FacilityWithStatus } from "$model/facilities/facility-with-status";
    import type { Season } from "$model/shared/season";
    import type { RentedFacility } from "$model/facilities/rented-facility";
    import {
        rentFacility,
        type RentFacilityRequest,
    } from "$lib/data/api/facilities-api";

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

                // Find facility type and set suggested price
                const facilityType = facilityTypes.find(
                    (ft) => ft.name === facilityToRenew.facilityName,
                );
                if (facilityType) {
                    price = facilityType.suggestedPrice.toString();
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

    // Auto-fill price when facility is selected in rent mode
    $effect(() => {
        if (
            !isRenewMode &&
            selectedFacilityId &&
            availableFacilities.length > 0
        ) {
            const facility = availableFacilities.find(
                (f) => f.id === selectedFacilityId,
            );
            if (facility) {
                price = facility.suggestedPrice.toString();
            }
        }
    });

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

    // Reset selected facility when season changes
    $effect(() => {
        if (selectedSeason && !isRenewMode) {
            selectedFacilityId = null;
            price = "";
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
                {#if suggestedPrice !== null}
                    <p class="text-xs text-muted-foreground">
                        Prezzo suggerito: €{suggestedPrice.toFixed(2)}
                    </p>
                {/if}
            </div>
        </div>

        <!-- Error Message -->
        {#if errorMessage}
            <div
                class="rounded-lg border border-destructive/50 bg-destructive/10 p-3"
            >
                <div class="flex items-start gap-2">
                    <AlertCircle
                        class="h-4 w-4 text-destructive mt-0.5 shrink-0"
                    />
                    <p class="text-sm text-destructive">{errorMessage}</p>
                </div>
            </div>
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
        onConfirm={(notes) => {
            console.log("Join waitlist with notes:", notes);
            joinWaitlistDialogOpen = false;
        }}
    />
{/if}
