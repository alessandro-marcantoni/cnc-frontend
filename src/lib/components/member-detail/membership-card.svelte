<script lang="ts">
    import * as Card from "$lib/components/ui/card";
    import * as Empty from "$lib/components/ui/empty";
    import * as Dialog from "$lib/components/ui/dialog";
    import * as Select from "$lib/components/ui/select";
    import * as InputGroup from "$lib/components/ui/input-group";
    import { Badge, type BadgeVariant } from "$lib/components/ui/badge";
    import { Button } from "$lib/components/ui/button";
    import { Separator } from "$lib/components/ui/separator";
    import { Input } from "$lib/components/ui/input";
    import DatePicker from "$lib/components/ui/date-picker.svelte";
    import {
        CreditCard,
        UsersRound,
        CirclePlus,
        Pencil,
        Plus,
        Euro,
    } from "@lucide/svelte";
    import type { Membership, MembershipStatus } from "$model/members/member";
    import { formatDate } from "$model/shared/date-utils";
    import { CalendarDate, toCalendarDate } from "@internationalized/date";

    interface Props {
        memberships: Membership[] | undefined;
        selectedSeasonName: string;
        onRenew: () => void;
        onPaymentSave?: (payment: {
            amount: number;
            currency: string;
            paidAt: CalendarDate;
            paymentMethod: string | null;
            transactionRef: string | null;
        }) => void;
    }

    const statusOptions: {
        value: MembershipStatus;
        label: string;
        variant: BadgeVariant;
    }[] = [
        { value: "ACTIVE", label: "Attivo", variant: "default" },
        { value: "EXPIRED", label: "Scaduto", variant: "secondary" },
        { value: "SUSPENDED", label: "Sospeso", variant: "outline" },
        { value: "EXCLUDED", label: "Escluso", variant: "destructive" },
    ];

    let { memberships, selectedSeasonName, onRenew, onPaymentSave }: Props =
        $props();

    const currentMembership = $derived(
        memberships && memberships.length > 0 ? memberships[0] : null,
    );

    // Payment dialog state
    let paymentDialogOpen = $state(false);
    let paymentAmount = $state("");
    let paymentMethod = $state("");
    let paymentTransactionRef = $state("");
    let paymentDate = $state<CalendarDate | undefined>(undefined);

    function openPaymentDialog() {
        if (currentMembership?.payment) {
            // Edit existing payment
            paymentAmount = currentMembership.payment.amount.toString();
            paymentMethod = currentMembership.payment.paymentMethod || "";
            paymentTransactionRef =
                currentMembership.payment.transactionRef || "";
            paymentDate = currentMembership.payment.paidAt
                ? toCalendarDate(currentMembership.payment.paidAt)
                : undefined;
        } else {
            // New payment
            paymentAmount = "";
            paymentMethod = "";
            paymentTransactionRef = "";
            paymentDate = undefined;
        }
        paymentDialogOpen = true;
    }

    function closePaymentDialog() {
        paymentDialogOpen = false;
        paymentAmount = "";
        paymentMethod = "";
        paymentTransactionRef = "";
        paymentDate = undefined;
    }

    function submitPayment() {
        if (!paymentAmount || !paymentDate || !onPaymentSave) return;

        onPaymentSave({
            amount: parseFloat(paymentAmount),
            currency: "EUR",
            paidAt: paymentDate,
            paymentMethod: paymentMethod || null,
            transactionRef: paymentTransactionRef || null,
        });

        closePaymentDialog();
    }

    function getStatusBadgeVariant(status: MembershipStatus): BadgeVariant {
        return (
            statusOptions.find((option) => option.value === status)?.variant ||
            "outline"
        );
    }

    function getStatusLabel(status: MembershipStatus): string {
        return (
            statusOptions.find((option) => option.value === status)?.label ||
            "Unknown"
        );
    }

    function formatCurrency(amount: number, currency: string): string {
        return new Intl.NumberFormat("it-IT", {
            style: "currency",
            currency: currency,
        }).format(amount);
    }
</script>

{#if currentMembership}
    <Card.Root>
        <Card.Header>
            <div class="flex items-center justify-between">
                <Card.Title class="flex items-center gap-2"
                    ><CreditCard />Tessera</Card.Title
                >
                <Button size="sm" variant="outline" onclick={onRenew}>
                    <CirclePlus class="h-4 w-4 mr-2" />
                    Rinnova
                </Button>
            </div>
        </Card.Header>
        <Card.Content class="space-y-4">
            <div class="flex items-center justify-between mb-4">
                <span class="text-sm font-medium">Stato</span>
                <Badge
                    variant={getStatusBadgeVariant(currentMembership.status)}
                >
                    {getStatusLabel(currentMembership.status)}
                </Badge>
            </div>

            <Separator />

            <div>
                <p class="text-sm text-muted-foreground mb-1">Numero Tessera</p>
                <p class="text-sm font-medium">#{currentMembership.number}</p>
            </div>

            <Separator />

            <div>
                <p class="text-sm text-muted-foreground mb-1">
                    Periodo di Validità
                </p>
                <p class="text-sm font-medium">
                    {formatDate(currentMembership.validFrom)} - {formatDate(
                        currentMembership.expiresAt,
                    )}
                </p>
            </div>

            <Separator />

            <div>
                <div class="flex items-center justify-between mb-1">
                    <p class="text-sm text-muted-foreground">Pagamento</p>
                    <Button
                        size="sm"
                        variant="outline"
                        onclick={openPaymentDialog}
                        class="px-2"
                    >
                        {#if currentMembership.payment}
                            <Pencil class="h-3 w-3 mr-1" />
                            Modifica
                        {:else}
                            <Plus class="h-3 w-3 mr-1" />
                            Aggiungi
                        {/if}
                    </Button>
                </div>
                {#if currentMembership.payment}
                    <p class="text-sm font-medium">
                        {formatCurrency(
                            currentMembership.payment.amount,
                            currentMembership.payment.currency,
                        )}
                    </p>
                    {#if currentMembership.payment.paidAt}
                        <p class="text-xs text-muted-foreground mt-1">
                            Pagato il {formatDate(
                                currentMembership.payment.paidAt,
                            )}
                        </p>
                    {/if}
                    {#if currentMembership.payment.paymentMethod}
                        <p class="text-xs text-muted-foreground mt-1">
                            Metodo: {currentMembership.payment.paymentMethod}
                        </p>
                    {/if}
                {:else}
                    <p class="text-sm text-muted-foreground italic mb-2">
                        Nessun pagamento registrato
                    </p>
                    {#if currentMembership.price}
                        <div class="mt-3 p-3 border rounded-lg">
                            <div class="flex items-center gap-2">
                                <Euro class="h-4 w-4 " />
                                <div>
                                    <p class="text-xs font-medium">
                                        Importo Dovuto
                                    </p>
                                    <p class="text-sm font-semibold">
                                        {formatCurrency(
                                            currentMembership.price,
                                            "EUR",
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    {/if}
                {/if}
            </div>
        </Card.Content>
    </Card.Root>

    <!-- Payment Dialog -->
    <Dialog.Root bind:open={paymentDialogOpen}>
        <Dialog.Content class="sm:max-w-125">
            <Dialog.Header>
                <Dialog.Title>
                    {currentMembership?.payment
                        ? "Modifica Pagamento"
                        : "Aggiungi Pagamento"}
                </Dialog.Title>
                <Dialog.Description>
                    Inserisci i dettagli del pagamento per la tessera #{currentMembership?.number}
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
                            bind:value={paymentAmount}
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
                        bind:value={paymentDate}
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
                            paymentMethod = value || "";
                        }}
                        value={paymentMethod}
                    >
                        <Select.Trigger class="w-full">
                            {#if paymentMethod}
                                {paymentMethod}
                            {:else}
                                Seleziona metodo...
                            {/if}
                        </Select.Trigger>
                        <Select.Content>
                            <Select.Group>
                                <Select.Label>Metodo</Select.Label>
                                <Select.Item value="Contanti"
                                    >Contanti</Select.Item
                                >
                                <Select.Item value="Carta">Carta</Select.Item>
                                <Select.Item value="Bonifico"
                                    >Bonifico</Select.Item
                                >
                                <Select.Item value="Assegno"
                                    >Assegno</Select.Item
                                >
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
                        bind:value={paymentTransactionRef}
                        placeholder="es. TRX-12345"
                    />
                </div>
            </div>

            <Dialog.Footer>
                <Button variant="outline" onclick={closePaymentDialog}
                    >Annulla</Button
                >
                <Button
                    onclick={submitPayment}
                    disabled={!paymentAmount || !paymentDate}
                >
                    Salva Pagamento
                </Button>
            </Dialog.Footer>
        </Dialog.Content>
    </Dialog.Root>
{:else}
    <Card.Root>
        <Card.Content class="p-6">
            <Empty.Root>
                <Empty.Header>
                    <Empty.Media variant="icon">
                        <UsersRound class="h-6 w-6" />
                    </Empty.Media>
                    <Empty.Title>Nessuna Tessera Trovata</Empty.Title>
                    <Empty.Description>
                        Questa persona non era socia nella stagione {selectedSeasonName}.
                    </Empty.Description>
                </Empty.Header>
                <Empty.Content>
                    <Button onclick={onRenew}>
                        <Plus class="h-4 w-4 mr-2" />
                        Aggiungi Tessera
                    </Button>
                </Empty.Content>
            </Empty.Root>
        </Card.Content>
    </Card.Root>
{/if}
