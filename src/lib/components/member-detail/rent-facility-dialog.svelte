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
    import { Input } from "$lib/components/ui/input";
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
        Anchor,
        ChevronLeft,
        ChevronRight,
    } from "@lucide/svelte";

    import {
        today,
        getLocalTimeZone,
        type CalendarDate,
    } from "@internationalized/date";
    import type { FacilityType } from "$model/facilities/facility-type";
    import type { FacilityWithStatus } from "$model/facilities/facility-with-status";
    import type { Season } from "$model/shared/season";
    import type { RentedFacility } from "$model/facilities/rented-facility";
    import {
        rentFacility,
        type RentFacilityRequest,
        getSuggestedPrice,
        type BoatLengthTier,
    } from "$lib/data/api/facilities-api";
    import { loadWaitlist } from "$lib/data/repositories";
    import DatePicker from "../ui/date-picker.svelte";

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

    // Boat and insurance state
    let boatName = $state("");
    let boatLengthMeters = $state("");
    let boatWidthMeters = $state("");
    let boatEngineInfo = $state("");
    let insuranceProvider = $state("");
    let insuranceNumber = $state("");
    let insuranceExpiresAt = $state<CalendarDate | undefined>(undefined);

    // Leerboard state
    let leerboardColor = $state("");
    let leerboardType = $state("");
    let leerboardLengthMeters = $state("");

    // Multi-step state
    let currentStep = $state(1);

    // Boat length tiers
    let boatLengthTiers = $state<BoatLengthTier[]>([]);

    const isRenewMode = $derived(mode === "renew");
    const defaultSeason = $derived(currentSeason.name.toString());

    // Initialize state when dialog opens
    $effect(() => {
        if (open) {
            // Reset state
            errorMessage = null;
            isSubmitting = false;
            selectedSeason = defaultSeason;

            // Reset step
            currentStep = 1;

            if (isRenewMode && facilityToRenew) {
                // Renew mode: use existing facility
                selectedFacilityType = null;
                selectedFacilityId = facilityToRenew.facilityId;

                // Pre-populate boat and insurance fields if they exist
                if (facilityToRenew.boatInfo) {
                    boatName = facilityToRenew.boatInfo.name;
                    boatLengthMeters =
                        facilityToRenew.boatInfo.lengthMeters.toString();
                    boatWidthMeters =
                        facilityToRenew.boatInfo.widthMeters.toString();

                    // Pre-populate insurance info from first insurance (UI only supports one)
                    const insurance = facilityToRenew.boatInfo.insurances?.[0];
                    if (insurance) {
                        insuranceProvider = insurance.provider;
                        insuranceNumber = insurance.number;
                        // Parse insurance expiration date
                        try {
                            const expiryDate = new Date(insurance.expiresAt);
                            insuranceExpiresAt = today(getLocalTimeZone()).set({
                                year: expiryDate.getFullYear(),
                                month: expiryDate.getMonth() + 1,
                                day: expiryDate.getDate(),
                            });
                        } catch {
                            insuranceExpiresAt = undefined;
                        }
                    } else {
                        insuranceProvider = "";
                        insuranceNumber = "";
                        insuranceExpiresAt = undefined;
                    }
                } else {
                    // Reset boat and insurance fields
                    boatName = "";
                    boatLengthMeters = "";
                    boatWidthMeters = "";
                    insuranceProvider = "";
                    insuranceNumber = "";
                    insuranceExpiresAt = undefined;
                }

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
                // Rent mode: reset selections and boat fields
                // Reset boat and insurance fields
                selectedFacilityType = null;
                selectedFacilityId = null;
                price = "";
                boatName = "";
                boatLengthMeters = "";
                boatWidthMeters = "";
                boatEngineInfo = "";
                insuranceProvider = "";
                insuranceNumber = "";
                insuranceExpiresAt = undefined;
                leerboardColor = "";
                leerboardType = "";
                leerboardLengthMeters = "";
            }
        }
    });

    // Fetch price when boat length changes (for boat facilities)
    $effect(() => {
        if (
            requiresBoat() &&
            boatLengthMeters &&
            parseFloat(boatLengthMeters) > 0
        ) {
            const selectedSeasonObj = availableSeasons.find(
                (s) => s.name.toString() === selectedSeason,
            );

            if (selectedSeasonObj) {
                const facilityTypeId =
                    isRenewMode && facilityToRenew
                        ? facilityTypes.find(
                              (ft) => ft.name === facilityToRenew.facilityName,
                          )?.id
                        : selectedFacilityType;

                if (facilityTypeId) {
                    fetchSuggestedPrice(
                        facilityTypeId,
                        selectedSeasonObj.id,
                        parseFloat(boatLengthMeters),
                    );
                }
            }
        }
    });

    async function fetchSuggestedPrice(
        facilityTypeId: number,
        seasonId: number,
        boatLength?: number,
    ) {
        isLoadingPrice = true;
        priceInfo = null;

        try {
            const result = await getSuggestedPrice(
                facilityTypeId,
                memberId,
                seasonId,
                boatLength,
            );

            price = result.suggestedPrice.toFixed(2);

            // Store boat length tiers if available
            if (result.boatLengthTiers) {
                boatLengthTiers = result.boatLengthTiers;
            }

            if (result.discountApplied) {
                priceInfo = {
                    hasSpecialPrice: true,
                    savingsAmount: result.discountAmount || 0,
                };
            } else if (result.hasSpecialPrice) {
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
                    const boatLength = boatLengthMeters
                        ? parseFloat(boatLengthMeters)
                        : undefined;
                    fetchSuggestedPrice(
                        facilityType.id,
                        selectedSeasonObj.id,
                        boatLength,
                    );
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

    const requiresBoat = $derived(() => {
        if (isRenewMode && facilityToRenew) {
            // In renew mode, check if the facility being renewed has boat info
            return facilityToRenew.boatInfo !== null;
        }
        // In rent mode, check if selected facility type requires boat
        return (
            selectedFacilityType !== null &&
            facilityTypes.find((ft) => ft.id === selectedFacilityType)
                ?.hasBoat === true
        );
    });

    const requiresLeerboard = $derived(() => {
        if (isRenewMode && facilityToRenew) {
            // In renew mode, check if the facility being renewed has leerboard info
            return facilityToRenew.leerboardInfo !== null;
        }
        // In rent mode, check if selected facility type requires leerboard
        return (
            selectedFacilityType !== null &&
            facilityTypes.find((ft) => ft.id === selectedFacilityType)
                ?.hasLeerboard === true
        );
    });

    const isBoatInfoValid = $derived(() => {
        if (!requiresBoat()) return true;

        const hasValidBoatInfo =
            boatName.trim() !== "" &&
            boatLengthMeters !== "" &&
            parseFloat(boatLengthMeters) > 0 &&
            boatWidthMeters !== "" &&
            parseFloat(boatWidthMeters) > 0;

        const hasValidInsurance =
            insuranceProvider.trim() !== "" &&
            insuranceNumber.trim() !== "" &&
            insuranceExpiresAt !== undefined;

        return hasValidBoatInfo && hasValidInsurance;
    });

    const isLeerboardInfoValid = $derived(() => {
        if (!requiresLeerboard()) return true;

        return (
            leerboardLengthMeters !== "" &&
            parseFloat(leerboardLengthMeters) > 0
        );
    });

    // Calculate total steps: boat/leerboard info comes before price for boat facilities
    const totalSteps = $derived(requiresBoat() || requiresLeerboard() ? 3 : 2);

    // Step order for boat facilities: 1. Selection, 2. Boat/Leerboard Info, 3. Price
    // Step order for non-boat facilities: 1. Selection, 2. Price

    const isStep1Valid = $derived(
        selectedSeason &&
            (isRenewMode ||
                (selectedFacilityType !== null &&
                    selectedFacilityId !== null &&
                    hasAvailableFacilities)),
    );

    const isStep2Valid = $derived(price && parseFloat(price) > 0);

    const isStep3Valid = $derived(isBoatInfoValid() && isLeerboardInfoValid());

    const canGoToNextStep = $derived(
        currentStep === 1
            ? isStep1Valid
            : currentStep === 2
              ? isStep2Valid
              : currentStep === 3
                ? isStep3Valid
                : false,
    );

    const isValid = $derived(
        isStep1Valid && isStep2Valid && (!requiresBoat() || isStep3Valid),
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

            // Add boat info if facility type requires it
            if (requiresBoat()) {
                rentFacilityRequest.boatInfo = {
                    name: boatName.trim(),
                    lengthMeters: parseFloat(boatLengthMeters),
                    widthMeters: parseFloat(boatWidthMeters),
                    engineInfo: boatEngineInfo.trim() || undefined,
                    insurances: [
                        {
                            provider: insuranceProvider.trim(),
                            number: insuranceNumber.trim(),
                            expiresAt: insuranceExpiresAt
                                ? insuranceExpiresAt.toString()
                                : "",
                        },
                    ],
                };
            }

            // Add leerboard info if facility type requires it
            if (requiresLeerboard()) {
                rentFacilityRequest.leerboardInfo = {
                    color: leerboardColor.trim() || undefined,
                    type: leerboardType.trim() || undefined,
                    lengthMeters: parseFloat(leerboardLengthMeters),
                };
            }

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

        // Reset boat and insurance fields when facility type changes
        boatName = "";
        boatLengthMeters = "";
        boatWidthMeters = "";
        insuranceProvider = "";
        insuranceNumber = "";
        insuranceExpiresAt = undefined;
    }

    function goToNextStep() {
        if (currentStep < totalSteps) {
            currentStep++;
        }
    }

    function goToPreviousStep() {
        if (currentStep > 1) {
            currentStep--;
        }
    }
</script>

<Dialog.Root bind:open>
    <Dialog.Content class="sm:max-w-125">
        <Dialog.Header>
            <Dialog.Title class="flex items-center gap-2">
                {#if isRenewMode}
                    <RefreshCw class="h-5 w-5" />
                    Rinnova Affitto Servizio
                    {#if requiresBoat()}
                        - Passo {currentStep} di {totalSteps}
                    {/if}
                {:else}
                    Affitta Servizio - Passo {currentStep} di {totalSteps}
                {/if}
            </Dialog.Title>
            <Dialog.Description>
                {#if isRenewMode && facilityToRenew}
                    {#if currentStep === 1}
                        Rinnova l'affitto di {facilityToRenew.facilityName} - {facilityToRenew.facilityIdentifier}
                        per
                        {memberName}
                    {:else if currentStep === 2}
                        Imposta il prezzo per il servizio
                    {:else if currentStep === 3}
                        Verifica e aggiorna le informazioni della barca
                    {/if}
                {:else if currentStep === 1}
                    Seleziona stagione e servizio per {memberName}
                {:else if currentStep === 2}
                    Imposta il prezzo per il servizio
                {:else if currentStep === 3}
                    Inserisci le informazioni della barca
                {/if}
            </Dialog.Description>
        </Dialog.Header>

        <div class="grid gap-4 py-4">
            <!-- Step 1: Season and Facility Selection -->
            {#if currentStep === 1}
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
                                <Select.Label>Stagioni Disponibili</Select.Label
                                >
                                {#if isRenewMode}
                                    {#each availableSeasons.filter((season) => season.name >= currentSeason.name) as season (season.name)}
                                        <Select.Item
                                            value={season.name.toString()}
                                        >
                                            Stagione {season.name}
                                        </Select.Item>
                                    {/each}
                                {:else}
                                    {#each availableSeasons as season (season.name)}
                                        <Select.Item
                                            value={season.name.toString()}
                                        >
                                            Stagione {season.name}
                                        </Select.Item>
                                    {/each}
                                {/if}
                            </Select.Group>
                        </Select.Content>
                    </Select.Root>
                    {#if isRenewMode}
                        <p class="text-xs text-muted-foreground">
                            Puoi rinnovare solo per la stagione corrente o
                            stagioni future.
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
                            Tipo di Servizio <span class="text-destructive"
                                >*</span
                            >
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
                                                        <div>
                                                            {option.label}
                                                        </div>
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
                                Servizio Specifico <span
                                    class="text-destructive">*</span
                                >
                            </label>
                            <Select.Root
                                type="single"
                                value={selectedFacilityId?.toString() ?? ""}
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
                                        )?.identifier ||
                                            "Seleziona servizio..."}
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
            {/if}

            {#if currentStep === 2 && !requiresBoat() && !requiresLeerboard()}
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
            {/if}

            <!-- Step 3: Boat Information (only if facility type requires it) -->
            {#if currentStep === 2 && (requiresBoat() || requiresLeerboard())}
                {#if requiresBoat()}
                    <div class="grid gap-4">
                        <div class="flex items-center gap-2">
                            <Anchor class="h-5 w-5" />
                            <h3 class="text-lg font-semibold">
                                Informazioni Barca
                            </h3>
                        </div>

                        <div class="grid gap-4">
                            <!-- Boat Name -->
                            <div class="grid gap-2">
                                <Label for="boat-name">
                                    Nome Barca<span class="text-destructive"
                                        >*</span
                                    >
                                </Label>
                                <Input
                                    id="boat-name"
                                    type="text"
                                    bind:value={boatName}
                                    placeholder="Es. La Perla del Mare"
                                />
                            </div>

                            <!-- Boat Dimensions -->
                            <div class="grid grid-cols-2 gap-4">
                                <div class="grid gap-2">
                                    <Label for="boat-length">
                                        Lunghezza (m)<span
                                            class="text-destructive">*</span
                                        >
                                    </Label>
                                    <Input
                                        id="boat-length"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        bind:value={boatLengthMeters}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div class="grid gap-2">
                                    <Label for="boat-width">
                                        Larghezza (m)<span
                                            class="text-destructive">*</span
                                        >
                                    </Label>
                                    <Input
                                        id="boat-width"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        bind:value={boatWidthMeters}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <!-- Engine Information -->
                            <div class="grid gap-2">
                                <Label for="boat-engine"
                                    >Informazioni Motore</Label
                                >
                                <Input
                                    id="boat-engine"
                                    type="text"
                                    bind:value={boatEngineInfo}
                                    placeholder="Es. Yamaha 40HP"
                                />
                            </div>

                            <!-- Insurance Information -->
                            <div class="grid gap-3">
                                <Label>
                                    Assicurazione<span class="text-destructive"
                                        >*</span
                                    >
                                </Label>

                                <div class="grid gap-3 p-3 border rounded-lg">
                                    <div class="grid gap-2">
                                        <Label for="insurance-provider">
                                            Compagnia Assicurativa<span
                                                class="text-destructive">*</span
                                            >
                                        </Label>
                                        <Input
                                            id="insurance-provider"
                                            type="text"
                                            bind:value={insuranceProvider}
                                            placeholder="Es. Generali"
                                        />
                                    </div>

                                    <div class="grid gap-2">
                                        <Label for="insurance-number">
                                            Numero Polizza<span
                                                class="text-destructive">*</span
                                            >
                                        </Label>
                                        <Input
                                            id="insurance-number"
                                            type="text"
                                            bind:value={insuranceNumber}
                                            placeholder="Es. 123456789"
                                        />
                                    </div>

                                    <div class="grid gap-2">
                                        <DatePicker
                                            id="insurance-expires"
                                            label="Data Scadenza *"
                                            bind:value={insuranceExpiresAt}
                                            placeholder="Seleziona data"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                {/if}

                {#if requiresLeerboard()}
                    <div class="grid gap-4">
                        <div class="flex items-center gap-2">
                            <Anchor class="h-5 w-5" />
                            <h3 class="text-lg font-semibold">
                                Informazioni Deriva
                            </h3>
                        </div>

                        <div class="grid gap-4">
                            <!-- Leerboard Length -->
                            <div class="grid gap-2">
                                <Label for="leerboard-length">
                                    Lunghezza (m)<span class="text-destructive"
                                        >*</span
                                    >
                                </Label>
                                <Input
                                    id="leerboard-length"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    bind:value={leerboardLengthMeters}
                                    placeholder="0.00"
                                />
                            </div>

                            <!-- Optional Fields -->
                            <div class="grid grid-cols-2 gap-4">
                                <div class="grid gap-2">
                                    <Label for="leerboard-color">Colore</Label>
                                    <Input
                                        id="leerboard-color"
                                        type="text"
                                        bind:value={leerboardColor}
                                        placeholder="Es. Bianco"
                                    />
                                </div>
                                <div class="grid gap-2">
                                    <Label for="leerboard-type">Tipo</Label>
                                    <Input
                                        id="leerboard-type"
                                        type="text"
                                        bind:value={leerboardType}
                                        placeholder="Es. Centrale"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                {/if}
            {/if}

            {#if currentStep === 3 && (requiresBoat() || requiresLeerboard())}
                <div class="grid gap-2">
                    <label for="price" class="text-sm font-medium">
                        Price <span class="text-destructive">*</span>
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
                            disabled={isLoadingPrice}
                        />
                        <InputGroup.Addon align="inline-end">
                            <InputGroup.Text>EUR</InputGroup.Text>
                        </InputGroup.Addon>
                    </InputGroup.Root>
                    {#if priceInfo?.hasSpecialPrice}
                        <Alert.Root>
                            <Sparkles class="h-4 w-4" />
                            <Alert.Title class="flex items-center gap-2">
                                Special Price Applied <Badge variant="default"
                                    >-€{priceInfo.savingsAmount.toFixed(
                                        2,
                                    )}</Badge
                                >
                            </Alert.Title>
                            <Alert.Description>
                                You're getting a discount based on your current
                                facilities.
                            </Alert.Description>
                        </Alert.Root>
                    {:else if boatLengthTiers.length > 0 && boatLengthMeters}
                        <div class="text-xs text-muted-foreground space-y-2">
                            <p class="font-medium">
                                Pricing based on boat length ({boatLengthMeters}m)
                            </p>
                            <div class="grid gap-1">
                                {#each boatLengthTiers as tier}
                                    {@const isActive =
                                        parseFloat(boatLengthMeters) >=
                                            tier.minLengthMeters &&
                                        (tier.maxLengthMeters === null ||
                                            parseFloat(boatLengthMeters) <
                                                tier.maxLengthMeters)}
                                    <div
                                        class="flex justify-between {isActive
                                            ? 'font-semibold text-primary'
                                            : ''}"
                                    >
                                        <span
                                            >{tier.minLengthMeters}m - {tier.maxLengthMeters ===
                                            null
                                                ? "∞"
                                                : tier.maxLengthMeters +
                                                  "m"}</span
                                        >
                                        <span>€{tier.price.toFixed(2)}</span>
                                    </div>
                                {/each}
                            </div>
                        </div>
                    {:else if suggestedPrice !== null && !isLoadingPrice}
                        <p class="text-xs text-muted-foreground">
                            Suggested price: €{suggestedPrice.toFixed(2)}
                        </p>
                    {/if}
                    {#if isLoadingPrice}
                        <p
                            class="text-xs text-muted-foreground flex items-center gap-2"
                        >
                            <Loader2 class="h-3 w-3 animate-spin" />
                            Calculating price...
                        </p>
                    {/if}
                </div>
            {/if}
        </div>

        <!-- Error Message -->
        {#if errorMessage}
            <Alert.Root variant="destructive">
                <AlertCircle class="h-4 w-4" />
                <Alert.Title>Errore</Alert.Title>
                <Alert.Description>{errorMessage}</Alert.Description>
            </Alert.Root>
        {/if}

        <Dialog.Footer class="flex justify-between">
            <div class="flex gap-2">
                {#if currentStep > 1}
                    <Button
                        variant="outline"
                        onclick={goToPreviousStep}
                        disabled={isSubmitting}
                    >
                        <ChevronLeft class="h-4 w-4 mr-2" />
                        Indietro
                    </Button>
                {/if}
                <Button
                    variant="outline"
                    onclick={handleClose}
                    disabled={isSubmitting}
                >
                    Annulla
                </Button>
            </div>

            <div>
                {#if currentStep < totalSteps}
                    <Button
                        onclick={goToNextStep}
                        disabled={!canGoToNextStep || isSubmitting}
                    >
                        Avanti
                        <ChevronRight class="h-4 w-4 ml-2" />
                    </Button>
                {:else}
                    <Button
                        onclick={handleSubmit}
                        disabled={!isValid || isSubmitting}
                    >
                        {#if isSubmitting}
                            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                            {isRenewMode
                                ? "Rinnovo in corso..."
                                : "Affitto in corso..."}
                        {:else if isRenewMode}
                            <RefreshCw class="h-4 w-4 mr-2" />
                            Rinnova Servizio
                        {:else}
                            Conferma Affitto
                        {/if}
                    </Button>
                {/if}
            </div>
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
