<script lang="ts">
    import * as Dialog from "$lib/components/ui/dialog";
    import * as Select from "$lib/components/ui/select";
    import * as InputGroup from "$lib/components/ui/input-group";
    import { Button } from "$lib/components/ui/button";
    import DatePicker from "$lib/components/ui/date-picker.svelte";
    import { Input } from "$lib/components/ui/input";
    import type { RentedFacility } from "$model/facilities/rented-facility";
    import { CalendarDate } from "@internationalized/date";

    interface Props {
        open: boolean;
        facility: RentedFacility | null;
        amount: string;
        method: string;
        transactionRef: string;
        date: CalendarDate | undefined;
        onClose: () => void;
        onSubmit: () => void;
        onAmountChange: (amount: string) => void;
        onMethodChange: (method: string) => void;
        onTransactionRefChange: (ref: string) => void;
        onDateChange: (date: CalendarDate | undefined) => void;
    }

    let {
        open = $bindable(),
        facility,
        amount = $bindable(),
        method = $bindable(),
        transactionRef = $bindable(),
        date = $bindable(),
        onClose,
        onSubmit,
        onAmountChange,
        onMethodChange,
        onTransactionRefChange,
        onDateChange,
    }: Props = $props();
</script>

<Dialog.Root bind:open>
    <Dialog.Content class="sm:max-w-125">
        <Dialog.Header>
            <Dialog.Title>
                {facility?.payment
                    ? "Modifica Pagamento"
                    : "Aggiungi Pagamento"}
            </Dialog.Title>
            <Dialog.Description>
                Inserisci i dettagli del pagamento per {facility?.facilityIdentifier}
            </Dialog.Description>
        </Dialog.Header>

        <div class="grid gap-4 py-4">
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
                        value={amount}
                        oninput={(e) => onAmountChange(e.currentTarget.value)}
                        placeholder="0.00"
                    />
                    <InputGroup.Addon align="inline-end">
                        <InputGroup.Text>EUR</InputGroup.Text>
                    </InputGroup.Addon>
                </InputGroup.Root>
            </div>

            <!-- Payment Date -->
            <div class="grid gap-2">
                <label class="text-sm font-medium" for="payment-date">
                    Data Pagamento <span class="text-destructive">*</span>
                </label>
                <DatePicker
                    id="payment-date"
                    value={date}
                    onValueChange={onDateChange}
                    placeholder="Seleziona data pagamento"
                />
            </div>

            <!-- Payment Method -->
            <div class="grid gap-2">
                <label for="payment-method" class="text-sm font-medium">
                    Metodo di Pagamento
                </label>
                <Select.Root
                    type="single"
                    onValueChange={(value) => {
                        onMethodChange(value || "");
                    }}
                    value={method}
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
                    value={transactionRef}
                    oninput={(e) =>
                        onTransactionRefChange(e.currentTarget.value)}
                    placeholder="es. TRX-12345"
                />
            </div>
        </div>

        <Dialog.Footer>
            <Button variant="outline" onclick={onClose}>Annulla</Button>
            <Button onclick={onSubmit} disabled={!amount || !date}>
                Salva Pagamento
            </Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
