<script lang="ts">
    import * as Dialog from "$lib/components/ui/dialog";
    import * as Alert from "$lib/components/ui/alert";
    import { Button } from "$lib/components/ui/button";
    import { Label } from "$lib/components/ui/label";
    import { Input } from "$lib/components/ui/input";
    import DatePicker from "../ui/date-picker.svelte";
    import {
        Ship,
        Anchor,
        Shield,
        Loader2,
        AlertCircle,
        Save,
        ChevronLeft,
        ChevronRight,
    } from "@lucide/svelte";
    import type { RentedFacility } from "$model/facilities/rented-facility";
    import {
        updateBoatInfo,
        updateLeerboardInfo,
        type UpdateBoatInfoRequest,
        type UpdateLeerboardInfoRequest,
    } from "$lib/data/api/facilities-api";
    import {
        today,
        getLocalTimeZone,
        type CalendarDate,
    } from "@internationalized/date";

    interface Props {
        open: boolean;
        facility: RentedFacility | null;
        memberId: number;
        seasonId: number;
        onClose: () => void;
        onSuccess: () => void;
    }

    let {
        open = $bindable(),
        facility,
        memberId,
        seasonId,
        onClose,
        onSuccess,
    }: Props = $props();

    // Boat state
    let boatName = $state("");
    let boatLengthMeters = $state("");
    let boatWidthMeters = $state("");
    let boatType = $state("");
    let boatEngineInfo = $state("");
    let insuranceProvider = $state("");
    let insuranceNumber = $state("");
    let insuranceExpiresAt = $state<CalendarDate | undefined>(undefined);

    // Leerboard state
    let leerboardColor = $state("");
    let leerboardType = $state("");
    let leerboardLengthMeters = $state("");

    let errorMessage = $state<string | null>(null);
    let isSubmitting = $state(false);
    let currentStep = $state(1);

    const isBoatFacility = $derived(facility?.boatInfo !== null);
    const isLeerboardFacility = $derived(facility?.leerboardInfo !== null);
    const totalSteps = $derived(isBoatFacility ? 2 : 1);

    // Initialize state when dialog opens
    $effect(() => {
        if (open && facility) {
            errorMessage = null;
            isSubmitting = false;
            currentStep = 1;

            if (facility.boatInfo) {
                boatName = facility.boatInfo.name;
                boatLengthMeters = facility.boatInfo.lengthMeters.toString();
                boatWidthMeters = facility.boatInfo.widthMeters
                    ? facility.boatInfo.widthMeters.toString()
                    : "";
                boatType = facility.boatInfo.type || "";
                boatEngineInfo = facility.boatInfo.engineInfo || "";

                // Initialize insurance
                const insurance = facility.boatInfo.insurances?.[0];
                if (insurance) {
                    insuranceProvider = insurance.provider;
                    insuranceNumber = insurance.number;
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
            }

            if (facility.leerboardInfo) {
                leerboardColor = facility.leerboardInfo.color || "";
                leerboardType = facility.leerboardInfo.type || "";
                leerboardLengthMeters =
                    facility.leerboardInfo.lengthMeters.toString();
            }
        }
    });

    const isStep1Valid = $derived(() => {
        if (!isBoatFacility) return false;

        return (
            boatName.trim() !== "" &&
            boatLengthMeters !== "" &&
            parseFloat(boatLengthMeters) > 0
        );
    });

    const isStep2Valid = $derived(() => {
        if (!isBoatFacility) return false;

        return (
            insuranceProvider.trim() !== "" &&
            insuranceNumber.trim() !== "" &&
            insuranceExpiresAt !== undefined
        );
    });

    const isLeerboardInfoValid = $derived(() => {
        if (!isLeerboardFacility) return false;

        return (
            leerboardLengthMeters !== "" &&
            !isNaN(parseFloat(leerboardLengthMeters)) &&
            parseFloat(leerboardLengthMeters) >= 0
        );
    });

    const canGoToNextStep = $derived(() => {
        if (!isBoatFacility) return false;
        return currentStep === 1 ? isStep1Valid() : isStep2Valid();
    });

    const canSubmit = $derived(() => {
        if (isBoatFacility) {
            return currentStep === 2 && isStep1Valid() && isStep2Valid();
        }
        return isLeerboardInfoValid();
    });

    function handleClose() {
        open = false;
        onClose();
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

    async function handleSubmit() {
        if (!facility) return;

        errorMessage = null;
        isSubmitting = true;

        try {
            if (isBoatFacility) {
                // Format insurance expiration date
                const insuranceExpires = insuranceExpiresAt
                    ? `${insuranceExpiresAt.year}-${String(insuranceExpiresAt.month).padStart(2, "0")}-${String(insuranceExpiresAt.day).padStart(2, "0")}`
                    : "";

                const request: UpdateBoatInfoRequest = {
                    memberId,
                    seasonId,
                    name: boatName,
                    lengthMeters: parseFloat(boatLengthMeters),
                    widthMeters: boatWidthMeters
                        ? parseFloat(boatWidthMeters)
                        : undefined,
                    type: boatType,
                    engineInfo: boatEngineInfo,
                    insuranceProvider,
                    insuranceNumber,
                    insuranceExpiresAt: insuranceExpires,
                };

                await updateBoatInfo(facility.id, request);
            } else if (isLeerboardFacility) {
                const request: UpdateLeerboardInfoRequest = {
                    memberId,
                    seasonId,
                    color: leerboardColor,
                    type: leerboardType,
                    lengthMeters: parseFloat(leerboardLengthMeters),
                };

                await updateLeerboardInfo(facility.id, request);
            }

            open = false;
            onSuccess();
        } catch (error) {
            if (error instanceof Error) {
                errorMessage = error.message;
            } else {
                errorMessage =
                    "Si è verificato un errore durante l'aggiornamento";
            }
        } finally {
            isSubmitting = false;
        }
    }
</script>

<Dialog.Root bind:open>
    <Dialog.Content class="sm:max-w-125">
        <Dialog.Header>
            <Dialog.Title class="flex items-center gap-2">
                {#if isBoatFacility}
                    <Ship class="h-5 w-5" />
                    Modifica Informazioni Imbarcazione
                    {#if totalSteps > 1}
                        - Passo {currentStep} di {totalSteps}
                    {/if}
                {:else if isLeerboardFacility}
                    <Anchor class="h-5 w-5" />
                    Modifica Informazioni Deriva
                {/if}
            </Dialog.Title>
            <Dialog.Description>
                {#if isBoatFacility}
                    {#if currentStep === 1}
                        Aggiorna le informazioni della barca per {facility?.facilityIdentifier}
                    {:else if currentStep === 2}
                        Aggiorna le informazioni dell'assicurazione per {facility?.facilityIdentifier}
                    {/if}
                {:else}
                    Aggiorna le informazioni per {facility?.facilityIdentifier}
                {/if}
            </Dialog.Description>
        </Dialog.Header>

        <div class="grid gap-4 py-4">
            {#if isBoatFacility && currentStep === 1}
                <!-- Boat Information -->
                <div class="grid gap-4">
                    <div class="flex items-center gap-2">
                        <Ship class="h-5 w-5" />
                        <h3 class="text-lg font-semibold">
                            Informazioni Barca
                        </h3>
                    </div>

                    <div class="grid gap-4">
                        <!-- Boat Name -->
                        <div class="grid gap-2">
                            <Label for="boat-name">
                                Nome Barca<span class="text-destructive">*</span
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
                                    Lunghezza (m)<span class="text-destructive"
                                        >*</span
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
                                        class="text-xs text-muted-foreground ml-1"
                                        >(opzionale)</span
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

                        <!-- Boat Type -->
                        <div class="grid gap-2">
                            <Label for="boat-type">
                                Tipo Imbarcazione<span
                                    class="text-xs text-muted-foreground ml-1"
                                    >(opzionale)</span
                                >
                            </Label>
                            <Input
                                id="boat-type"
                                type="text"
                                bind:value={boatType}
                                placeholder="es. Vela, Motore, Gommone, Kayak"
                            />
                            <p class="text-xs text-muted-foreground">
                                Specifica il tipo o categoria dell'imbarcazione
                            </p>
                        </div>

                        <!-- Engine Information -->
                        <div class="grid gap-2">
                            <Label for="boat-engine">Informazioni Motore</Label>
                            <Input
                                id="boat-engine"
                                type="text"
                                bind:value={boatEngineInfo}
                                placeholder="Es. Yamaha 40HP"
                            />
                        </div>
                    </div>
                </div>
            {/if}

            {#if isBoatFacility && currentStep === 2}
                <!-- Insurance Information -->
                <div class="grid gap-4">
                    <div class="flex items-center gap-2">
                        <Shield class="h-5 w-5" />
                        <h3 class="text-lg font-semibold">
                            Informazioni Assicurazione
                        </h3>
                    </div>

                    <div class="grid gap-4">
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
                                Numero Polizza<span class="text-destructive"
                                    >*</span
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
            {:else if isLeerboardFacility}
                <!-- Leerboard Information -->
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

                        <!-- Color and Type -->
                        <div class="grid grid-cols-2 gap-4">
                            <div class="grid gap-2">
                                <Label for="leerboard-color">
                                    Colore <span
                                        class="text-xs text-muted-foreground"
                                        >(opzionale)</span
                                    >
                                </Label>
                                <Input
                                    id="leerboard-color"
                                    type="text"
                                    bind:value={leerboardColor}
                                    placeholder="Es. Rosso"
                                />
                            </div>
                            <div class="grid gap-2">
                                <Label for="leerboard-type">
                                    Tipo <span
                                        class="text-xs text-muted-foreground"
                                        >(opzionale)</span
                                    >
                                </Label>
                                <Input
                                    id="leerboard-type"
                                    type="text"
                                    bind:value={leerboardType}
                                    placeholder="Es. Laser"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            {/if}
        </div>

        {#if errorMessage}
            <Alert.Root variant="destructive">
                <AlertCircle class="h-4 w-4" />
                <Alert.Title>Errore</Alert.Title>
                <Alert.Description>{errorMessage}</Alert.Description>
            </Alert.Root>
        {/if}

        <Dialog.Footer class="flex justify-between">
            <div class="flex gap-2">
                {#if currentStep > 1 && isBoatFacility}
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
                {#if currentStep < totalSteps && isBoatFacility}
                    <Button
                        onclick={goToNextStep}
                        disabled={!canGoToNextStep()}
                    >
                        Avanti
                        <ChevronRight class="h-4 w-4 ml-2" />
                    </Button>
                {:else}
                    <Button
                        onclick={handleSubmit}
                        disabled={!canSubmit() || isSubmitting}
                    >
                        {#if isSubmitting}
                            <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                            Salvataggio...
                        {:else}
                            <Save class="h-4 w-4 mr-2" />
                            Salva Modifiche
                        {/if}
                    </Button>
                {/if}
            </div>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
