<script lang="ts">
    import * as Dialog from "$lib/components/ui/dialog";
    import * as Alert from "$lib/components/ui/alert";
    import * as AlertDialog from "$lib/components/ui/alert-dialog";
    import { Button } from "$lib/components/ui/button";
    import { Textarea } from "$lib/components/ui/textarea";
    import { Badge } from "$lib/components/ui/badge";
    import { Clock, Users, AlertCircle } from "@lucide/svelte";

    interface Props {
        open: boolean;
        facilityTypeName: string;
        waitlistCount: number;
        notes?: string;
        onClose: () => void;
        onConfirm: (notes: string) => void;
        isSubmitting?: boolean;
    }

    let {
        open = $bindable(),
        facilityTypeName,
        waitlistCount,
        notes = "",
        onClose,
        onConfirm,
        isSubmitting = false,
    }: Props = $props();

    let waitlistNotes = $state(notes);

    // Reset notes when dialog opens
    $effect(() => {
        if (open) {
            waitlistNotes = notes;
        }
    });

    function handleConfirm() {
        onConfirm(waitlistNotes);
    }

    function handleClose() {
        if (!isSubmitting) {
            onClose();
        }
    }
</script>

<Dialog.Root bind:open>
    <Dialog.Content class="sm:max-w-125">
        <Dialog.Header>
            <Dialog.Title>Aggiungi alla Lista d'Attesa</Dialog.Title>
            <Dialog.Description>
                Aggiungi il membro alla lista d'attesa per <span
                    class="font-semibold">{facilityTypeName}</span
                >
            </Dialog.Description>
        </Dialog.Header>

        <div class="space-y-4 py-4">
            {#if waitlistCount > 0}
                <Alert.Root>
                    <Users />
                    <Alert.Description>
                        Attualmente ci {waitlistCount === 1 ? "è" : "sono"}
                        <span class="font-semibold"
                            >{waitlistCount}
                            {waitlistCount === 1 ? "persona" : "persone"}</span
                        >
                        in lista d'attesa.
                    </Alert.Description>
                </Alert.Root>
            {:else}
                <Alert.Root>
                    <AlertCircle />
                    <Alert.Description>
                        Il membro sarà il primo in lista d'attesa.
                    </Alert.Description>
                </Alert.Root>
            {/if}

            <!-- Optional Notes -->
            <div class="space-y-2">
                <label for="waitlist-notes" class="text-sm font-medium">
                    Note (Facoltativo)
                </label>
                <Textarea
                    id="waitlist-notes"
                    bind:value={waitlistNotes}
                    placeholder="Es. Preferenze specifiche, disponibilità, ecc..."
                    rows={3}
                    disabled={isSubmitting}
                />
                <p class="text-xs text-muted-foreground">
                    Note interne per la gestione della lista d'attesa.
                </p>
            </div>
        </div>

        <Dialog.Footer>
            <Button
                variant="outline"
                onclick={handleClose}
                disabled={isSubmitting}
            >
                Annulla
            </Button>
            <Button onclick={handleConfirm} disabled={isSubmitting}>
                {#if isSubmitting}
                    Aggiunta in corso...
                {:else}
                    Aggiungi alla Lista
                {/if}
            </Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
