<script lang="ts">
    import * as AlertDialog from "$lib/components/ui/alert-dialog";
    import type { RentedFacility } from "$model/facilities/rented-facility";

    interface Props {
        open: boolean;
        facility: RentedFacility | null;
        onConfirm: () => void;
    }

    let { open = $bindable(), facility, onConfirm }: Props = $props();
</script>

<AlertDialog.Root bind:open>
    <AlertDialog.Content>
        <AlertDialog.Header>
            <AlertDialog.Title>Conferma Liberazione</AlertDialog.Title>
            <AlertDialog.Description>
                Sei sicuro di voler liberare il servizio {facility?.facilityIdentifier}?
                Questa azione rimuoverà l'affitto corrente e renderà il servizio
                nuovamente disponibile.
            </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
            <AlertDialog.Cancel>Annulla</AlertDialog.Cancel>
            <AlertDialog.Action onclick={onConfirm}>
                Conferma Liberazione
            </AlertDialog.Action>
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>
