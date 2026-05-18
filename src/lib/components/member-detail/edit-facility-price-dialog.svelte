<script lang="ts">
    import * as Dialog from "$lib/components/ui/dialog";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import * as Alert from "$lib/components/ui/alert";
    import { Loader2, AlertCircle, Euro } from "@lucide/svelte";
    import type { RentedFacility } from "$model/facilities/rented-facility";
    import { updateRentedFacilityPrice } from "$lib/data/repositories";

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

    let price = $state<string>("");
    let isSubmitting = $state(false);
    let errorMessage = $state<string | null>(null);

    const isValid = $derived(
        price !== "" && !isNaN(parseFloat(price)) && parseFloat(price) >= 0,
    );

    function handleClose() {
        open = false;
        onClose();
    }

    $effect(() => {
        if (open && facility) {
            price = facility.price.toString();
            errorMessage = null;
        }
    });

    async function handleSubmit() {
        if (!isValid || !facility) return;

        isSubmitting = true;
        errorMessage = null;

        try {
            await updateRentedFacilityPrice(
                memberId,
                facility.id,
                parseFloat(price),
                seasonId,
            );
            onSuccess();
            handleClose();
        } catch (error) {
            console.error("Failed to update facility price:", error);
            errorMessage =
                error instanceof Error
                    ? error.message
                    : "Si è verificato un errore";
        } finally {
            isSubmitting = false;
        }
    }
</script>

<Dialog.Root bind:open>
    <Dialog.Content class="sm:max-w-md">
        <Dialog.Header>
            <Dialog.Title class="flex items-center gap-2">
                <Euro class="h-5 w-5" />
                Modifica Prezzo
            </Dialog.Title>
            <Dialog.Description>
                {#if facility}
                    Aggiorna il prezzo per {facility.facilityName} -
                    {facility.facilityIdentifier}
                {/if}
            </Dialog.Description>
        </Dialog.Header>

        <div class="grid gap-4 py-4">
            <div class="grid gap-2">
                <Label for="price">
                    Prezzo (€) <span class="text-destructive">*</span>
                </Label>
                <div class="relative">
                    <Euro
                        class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                    />
                    <Input
                        id="price"
                        type="number"
                        min="0"
                        step="0.01"
                        bind:value={price}
                        placeholder="0.00"
                        class="pl-9"
                        disabled={isSubmitting}
                    />
                </div>
            </div>
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
                disabled={!isValid || isSubmitting}
            >
                {#if isSubmitting}
                    <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                    Salvataggio...
                {:else}
                    <Euro class="mr-2 h-4 w-4" />
                    Salva Prezzo
                {/if}
            </Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
