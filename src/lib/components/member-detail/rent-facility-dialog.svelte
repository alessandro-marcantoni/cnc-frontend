<script lang="ts">
    import * as Dialog from "$lib/components/ui/dialog";
    import * as Select from "$lib/components/ui/select";
    import * as Popover from "$lib/components/ui/popover";
    import * as Command from "$lib/components/ui/command";
    import * as InputGroup from "$lib/components/ui/input-group";
    import { Button } from "$lib/components/ui/button";
    import { Label } from "$lib/components/ui/label";
    import DatePicker from "$lib/components/ui/date-picker.svelte";
    import {
        ChevronsUpDown,
        Check,
        AlertCircle,
        Loader2,
        RefreshCw,
    } from "@lucide/svelte";
    import {
        CalendarDate,
        getLocalTimeZone,
        today,
        toCalendarDate,
    } from "@internationalized/date";
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
        onSuccess: () => void;
        onLoadFacilitiesForType?: (typeId: number) => void;
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
    let isWholeSeason = $state(true);
    let startDate = $state<CalendarDate | undefined>(undefined);
    let endDate = $state<CalendarDate | undefined>(undefined);
    let price = $state("");
    let facilityTypeComboboxOpen = $state(false);
    let errorMessage = $state<string | null>(null);
    let isSubmitting = $state(false);

    const isRenewMode = $derived(mode === "renew");
    const defaultSeason = $derived(currentSeason.name.toString());

    // Initialize state when dialog opens
    $effect(() => {
        if (open) {
            // Reset state
            errorMessage = null;
            isSubmitting = false;
            selectedSeason = defaultSeason;
            isWholeSeason = true;

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

            // Set initial dates - will be handled by the effect below
        }
    });

    // Update dates when season or toggle changes
    $effect(() => {
        if (open && selectedSeason) {
            // Read selectedSeason and isWholeSeason to make effect reactive to them
            const seasonObj = availableSeasons.find(
                (s) => s.name.toString() === selectedSeason,
            );

            if (seasonObj) {
                if (isWholeSeason) {
                    startDate = toCalendarDate(seasonObj.startsAt);
                    endDate = toCalendarDate(seasonObj.endsAt);
                } else {
                    startDate = today(getLocalTimeZone());
                    endDate = toCalendarDate(seasonObj.endsAt);
                }
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

    // Load facilities when type is selected
    $effect(() => {
        if (selectedFacilityType && onLoadFacilitiesForType) {
            onLoadFacilitiesForType(selectedFacilityType);
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
            startDate &&
            endDate &&
            price &&
            parseFloat(price) > 0 &&
            (isRenewMode || selectedFacilityId !== null),
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

            // Validate dates
            if (!startDate || !endDate) {
                errorMessage = "Le date di inizio e fine sono obbligatorie";
                return;
            }

            if (startDate.compare(endDate) >= 0) {
                errorMessage =
                    "La data di fine deve essere successiva alla data di inizio";
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
                rentedAt: startDate.toString(),
                expiresAt: endDate.toString(),
                price: priceValue,
            };

            await rentFacility(rentFacilityRequest);

            // Success
            open = false;
            onSuccess();
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
                                    {#if availableFacilities.length > 0}
                                        {#each availableFacilities.filter((f) => !f.isRented) as facility (facility.id)}
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
                {/if}
            {/if}

            <!-- Season Toggle -->
            <div class="grid gap-2">
                <label class="text-sm font-medium" for="season-trigger"
                    >Periodo</label
                >
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
            <div class="grid grid-cols-2 gap-2">
                <!-- Start Date -->
                <div class="grid gap-2">
                    <DatePicker
                        id="start-date"
                        label="Data Inizio *"
                        bind:value={startDate}
                        disabled={isWholeSeason}
                        placeholder="Seleziona data inizio"
                    />
                </div>

                <!-- End Date -->
                <div class="grid gap-2">
                    <DatePicker
                        id="end-date"
                        label="Data Fine *"
                        bind:value={endDate}
                        disabled={isWholeSeason}
                        placeholder="Seleziona data fine"
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
