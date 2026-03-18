<script lang="ts">
    import { Button } from "$lib/components/ui/button";
    import * as Dialog from "$lib/components/ui/dialog";
    import * as Select from "$lib/components/ui/select";
    import { Label } from "$lib/components/ui/label";
    import * as Alert from "$lib/components/ui/alert";
    import { Loader2, AlertCircle, ArrowRightLeft } from "@lucide/svelte";
    import type { RentedFacility } from "$model/facilities/rented-facility";
    import type { FacilityWithStatus } from "$model/facilities/facility-with-status";
    import { changeFacility } from "$lib/data/api/facilities-api";

    interface Props {
        open: boolean;
        facility: RentedFacility | null;
        memberId: number;
        seasonId: number;
        availableFacilities: FacilityWithStatus[];
        onClose: () => void;
        onSuccess: () => void;
    }

    let {
        open = $bindable(),
        facility,
        memberId,
        seasonId,
        availableFacilities,
        onClose,
        onSuccess,
    }: Props = $props();

    let selectedNewFacilityId = $state<string>("");
    let isSubmitting = $state(false);
    let errorMessage = $state<string | null>(null);

    // Reset form when dialog opens/closes
    $effect(() => {
        if (open) {
            selectedNewFacilityId = "";
            errorMessage = null;
        }
    });

    const selectedNewFacility = $derived(
        selectedNewFacilityId
            ? availableFacilities.find(
                  (f) => f.id.toString() === selectedNewFacilityId,
              )
            : null,
    );

    const availableFacilitiesOptions = $derived(
        availableFacilities
            .filter((f) => !f.isRented && f.id !== facility?.facilityId)
            .map((f) => ({
                value: f.id.toString(),
                label: `${f.facilityTypeName} - ${f.identifier}`,
            })),
    );

    const isValid = $derived(selectedNewFacilityId !== "");

    function handleClose() {
        open = false;
        onClose();
    }

    async function handleSubmit() {
        if (!facility || !isValid) return;

        isSubmitting = true;
        errorMessage = null;

        try {
            await changeFacility(
                facility.id,
                parseInt(selectedNewFacilityId),
                memberId,
                seasonId,
            );

            handleClose();
            onSuccess();
        } catch (error) {
            console.error("Failed to change facility:", error);
            errorMessage =
                error instanceof Error
                    ? error.message
                    : "Errore durante il cambio del servizio";
        } finally {
            isSubmitting = false;
        }
    }
</script>

<Dialog.Root bind:open>
    <Dialog.Content class="sm:max-w-md">
        <Dialog.Header>
            <Dialog.Title class="flex items-center gap-2">
                <ArrowRightLeft class="h-5 w-5" />
                Cambia Servizio
            </Dialog.Title>
            <Dialog.Description>
                Modifica quale servizio specifico è assegnato a questo affitto.
                Il tipo di servizio rimarrà lo stesso.
            </Dialog.Description>
        </Dialog.Header>

        <div class="grid gap-4 py-4">
            {#if facility}
                <!-- Current Facility Info -->
                <div class="rounded-lg border bg-muted/50 p-3">
                    <p class="text-xs font-medium text-muted-foreground mb-2">
                        Servizio Attuale
                    </p>
                    <p class="font-medium">
                        {facility.facilityName} - {facility.facilityIdentifier}
                    </p>
                    <p class="text-sm text-muted-foreground mt-1">
                        {facility.facilityTypeDescription}
                    </p>
                </div>

                <!-- New Facility Selection -->
                <div class="grid gap-2">
                    <Label for="new-facility">
                        Nuovo Servizio <span class="text-destructive">*</span>
                    </Label>
                    <Select.Root
                        type="single"
                        bind:value={selectedNewFacilityId}
                    >
                        <Select.Trigger id="new-facility" class="w-full">
                            {selectedNewFacilityId
                                ? availableFacilitiesOptions.find(
                                      (f) => f.value === selectedNewFacilityId,
                                  )?.label
                                : "Seleziona un servizio disponibile"}
                        </Select.Trigger>
                        <Select.Content>
                            <Select.Group>
                                <Select.Label>Servizi Disponibili</Select.Label>
                                {#if availableFacilitiesOptions.length === 0}
                                    <Select.Item value="" disabled>
                                        Nessun servizio disponibile
                                    </Select.Item>
                                {:else}
                                    {#each availableFacilitiesOptions as option (option.value)}
                                        <Select.Item value={option.value}>
                                            {option.label}
                                        </Select.Item>
                                    {/each}
                                {/if}
                            </Select.Group>
                        </Select.Content>
                    </Select.Root>
                    <p class="text-xs text-muted-foreground">
                        Verranno mostrati solo i servizi dello stesso tipo che
                        sono attualmente disponibili.
                    </p>
                </div>

                <!-- New Facility Preview -->
                {#if selectedNewFacility}
                    <div class="rounded-lg border bg-primary/5 p-3">
                        <p
                            class="text-xs font-medium text-muted-foreground mb-2"
                        >
                            Nuovo Servizio Selezionato
                        </p>
                        <p class="font-medium">
                            {selectedNewFacility.facilityTypeName} - {selectedNewFacility.identifier}
                        </p>
                        <p class="text-sm text-muted-foreground mt-1">
                            {selectedNewFacility.facilityTypeDescription}
                        </p>
                    </div>
                {/if}

                <!-- Warning Notice -->
                <Alert.Root variant="default" class="border-blue-500/50">
                    <AlertCircle class="h-4 w-4" />
                    <Alert.Title>Nota Importante</Alert.Title>
                    <Alert.Description>
                        Il cambio del servizio manterrà tutte le altre
                        informazioni dell'affitto (date, pagamento,
                        imbarcazione, ecc.). Verrà modificato solo
                        l'identificativo del servizio.
                    </Alert.Description>
                </Alert.Root>
            {/if}
        </div>

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
            <Button
                onclick={handleSubmit}
                disabled={!isValid ||
                    isSubmitting ||
                    availableFacilitiesOptions.length === 0}
            >
                {#if isSubmitting}
                    <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                    Cambio in corso...
                {:else}
                    <ArrowRightLeft class="h-4 w-4 mr-2" />
                    Cambia Servizio
                {/if}
            </Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
