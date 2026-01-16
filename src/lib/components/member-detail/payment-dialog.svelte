<script lang="ts">
    import * as Dialog from "$lib/components/ui/dialog";
    import * as Select from "$lib/components/ui/select";
    import * as InputGroup from "$lib/components/ui/input-group";
    import * as AlertDialog from "$lib/components/ui/alert-dialog";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import DatePicker from "$lib/components/ui/date-picker.svelte";
    import { Trash2 } from "@lucide/svelte";
    import { createPayment, updatePayment, deletePayment } from "$lib/data/api";
    import type {
        CreatePaymentRequest,
        UpdatePaymentRequest,
    } from "$lib/data/api";
    import type { CalendarDate, DateValue } from "@internationalized/date";

    interface BasePayment {
        id?: number;
        amount: number;
        currency?: string;
        paymentMethod?: string | null;
        transactionRef?: string | null;
        paidAt?: DateValue;
    }

    interface Props {
        open: boolean;
        entityType: "membership" | "facility";
        entityId: number | null;
        entityIdentifier: string;
        price?: number;
        payment?: BasePayment | null;
        onClose: () => void;
        onSuccess: () => void;
    }

    let {
        open = $bindable(),
        entityType,
        entityId,
        entityIdentifier,
        price,
        payment,
        onClose,
        onSuccess,
    }: Props = $props();

    // Form state
    let amount = $state("");
    let method = $state("");
    let transactionRef = $state("");
    let paymentDate = $state<CalendarDate | undefined>(undefined);
    let isSubmitting = $state(false);
    let error = $state<string | null>(null);

    // Delete confirmation dialog state
    let deleteDialogOpen = $state(false);
    let isDeleting = $state(false);

    // Check if we're editing an existing payment
    let isEditMode = $derived(!!payment?.id);

    // Reset form when dialog opens/closes or entity changes
    $effect(() => {
        if (open && entityId) {
            if (payment) {
                // Pre-fill with existing payment data
                amount = payment.amount.toString();
                method = payment.paymentMethod || "";
                transactionRef = payment.transactionRef || "";
                // Note: paymentDate handling removed as per backend auto-timestamp design
            } else {
                // Reset for new payment
                amount = price?.toString() || "";
                method = "";
                transactionRef = "";
                paymentDate = undefined;
            }
            error = null;
        }
    });

    async function handleSubmit() {
        if (!entityId || !amount || !method) return;

        isSubmitting = true;
        error = null;

        try {
            if (isEditMode && payment?.id) {
                // Update existing payment
                const updateRequest: UpdatePaymentRequest = {
                    amount: parseFloat(amount),
                    currency: "EUR",
                    paymentMethod: method,
                    transactionRef: transactionRef || null,
                };

                await updatePayment(payment.id, updateRequest);
            } else {
                // Create new payment
                const createRequest: CreatePaymentRequest = {
                    rentedFacilityId:
                        entityType === "facility" ? entityId : null,
                    membershipPeriodId:
                        entityType === "membership" ? entityId : null,
                    amount: parseFloat(amount),
                    currency: "EUR",
                    paymentMethod: method,
                    transactionRef: transactionRef || null,
                };

                await createPayment(createRequest);
            }

            // Success - close dialog and notify parent
            onSuccess();
            onClose();
        } catch (err) {
            error =
                err instanceof Error
                    ? err.message
                    : "Si è verificato un errore";
        } finally {
            isSubmitting = false;
        }
    }

    async function handleDelete() {
        if (!payment?.id) return;

        isDeleting = true;
        error = null;

        try {
            await deletePayment(payment.id);

            // Success - close dialogs and notify parent
            deleteDialogOpen = false;
            onSuccess();
            onClose();
        } catch (err) {
            error =
                err instanceof Error
                    ? err.message
                    : "Si è verificato un errore durante l'eliminazione";
            deleteDialogOpen = false;
        } finally {
            isDeleting = false;
        }
    }

    function handleClose() {
        if (!isSubmitting && !isDeleting) {
            onClose();
        }
    }

    // Compute form validity
    let isFormValid = $derived(() => {
        if (!amount || !method) return false;
        return true;
    });
</script>

<Dialog.Root bind:open>
    <Dialog.Content class="sm:max-w-125">
        <Dialog.Header>
            <Dialog.Title>
                {isEditMode ? "Modifica Pagamento" : "Aggiungi Pagamento"}
            </Dialog.Title>
            <Dialog.Description>
                Inserisci i dettagli del pagamento per {entityIdentifier}
            </Dialog.Description>
        </Dialog.Header>

        <div class="grid gap-4 py-4">
            {#if error}
                <div
                    class="rounded-md bg-destructive/15 p-3 text-sm text-destructive"
                >
                    {error}
                </div>
            {/if}

            <!-- Amount -->
            <div class="grid gap-2">
                <label for="payment-amount" class="text-sm font-medium">
                    Importo <span class="text-destructive">*</span>
                </label>
                <InputGroup.Root>
                    <InputGroup.Addon>
                        <InputGroup.Text>€</InputGroup.Text>
                    </InputGroup.Addon>
                    <InputGroup.Input
                        id="payment-amount"
                        type="number"
                        step="0.01"
                        min="0"
                        bind:value={amount}
                        placeholder="0.00"
                        disabled={isSubmitting || isDeleting}
                    />
                    <InputGroup.Addon align="inline-end">
                        <InputGroup.Text>EUR</InputGroup.Text>
                    </InputGroup.Addon>
                </InputGroup.Root>
            </div>

            <!-- Payment Method -->
            <div class="grid gap-2">
                <label for="payment-method" class="text-sm font-medium">
                    Metodo di Pagamento <span class="text-destructive">*</span>
                </label>
                <Select.Root
                    type="single"
                    onValueChange={(value) => {
                        method = value || "";
                    }}
                    value={method}
                    disabled={isSubmitting || isDeleting}
                >
                    <Select.Trigger class="w-full">
                        {#if method}
                            {method}
                        {:else}
                            Seleziona metodo...
                        {/if}
                    </Select.Trigger>
                    <Select.Content>
                        <Select.Group>
                            <Select.Label>Metodo</Select.Label>
                            <Select.Item value="Contanti">Contanti</Select.Item>
                            <Select.Item value="Carta">Carta</Select.Item>
                            <Select.Item value="Bonifico">Bonifico</Select.Item>
                            <Select.Item value="Assegno">Assegno</Select.Item>
                            <Select.Item value="Altro">Altro</Select.Item>
                        </Select.Group>
                    </Select.Content>
                </Select.Root>
            </div>

            <!-- Transaction Reference -->
            <div class="grid gap-2">
                <label for="transaction-ref" class="text-sm font-medium">
                    Riferimento Transazione
                </label>
                <Input
                    id="transaction-ref"
                    type="text"
                    bind:value={transactionRef}
                    placeholder="es. TRX-12345"
                    disabled={isSubmitting || isDeleting}
                />
            </div>
        </div>

        <Dialog.Footer class="flex-col sm:flex-row gap-2">
            <div class="flex gap-2 flex-1">
                {#if isEditMode && payment?.id}
                    <Button
                        variant="destructive"
                        size="icon"
                        onclick={() => (deleteDialogOpen = true)}
                        disabled={isSubmitting || isDeleting}
                        title="Elimina pagamento"
                    >
                        <Trash2 class="h-4 w-4" />
                    </Button>
                {/if}
            </div>
            <div class="flex gap-2">
                <Button
                    variant="outline"
                    onclick={handleClose}
                    disabled={isSubmitting || isDeleting}
                >
                    Annulla
                </Button>
                <Button
                    onclick={handleSubmit}
                    disabled={!isFormValid() || isSubmitting || isDeleting}
                >
                    {#if isSubmitting}
                        Salvataggio...
                    {:else}
                        Salva Pagamento
                    {/if}
                </Button>
            </div>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>

<!-- Delete Confirmation Dialog -->
<AlertDialog.Root bind:open={deleteDialogOpen}>
    <AlertDialog.Content>
        <AlertDialog.Header>
            <AlertDialog.Title>Conferma Eliminazione</AlertDialog.Title>
            <AlertDialog.Description>
                Sei sicuro di voler eliminare questo pagamento? Questa azione
                non può essere annullata.
            </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
            <AlertDialog.Cancel disabled={isDeleting}
                >Annulla</AlertDialog.Cancel
            >
            <AlertDialog.Action
                onclick={handleDelete}
                disabled={isDeleting}
                class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
                {#if isDeleting}
                    Eliminazione...
                {:else}
                    Elimina
                {/if}
            </AlertDialog.Action>
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>
