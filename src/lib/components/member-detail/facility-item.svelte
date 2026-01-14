<script lang="ts">
    import { Badge } from "$lib/components/ui/badge";
    import { Button } from "$lib/components/ui/button";
    import { Separator } from "$lib/components/ui/separator";
    import {
        CircleCheck,
        CircleX,
        Ship,
        CreditCard,
        Clock,
        Pencil,
        Trash2,
        CirclePlus,
        Euro,
    } from "@lucide/svelte";
    import type { RentedFacility } from "$model/facilities/rented-facility";
    import { formatDate } from "$model/shared/date-utils";
    import {
        getLocalTimeZone,
        now,
        type DateValue,
    } from "@internationalized/date";

    interface Props {
        facility: RentedFacility;
        onEditPayment: (facility: RentedFacility) => void;
        onFree: (facility: RentedFacility) => void;
        onRenew: (facility: RentedFacility) => void;
    }

    let { facility, onEditPayment, onFree, onRenew }: Props = $props();

    function formatCurrency(amount: number, currency: string): string {
        return new Intl.NumberFormat("it-IT", {
            style: "currency",
            currency: currency,
        }).format(amount);
    }

    function isFacilityActive(expiresAt: DateValue): boolean {
        return expiresAt > now(getLocalTimeZone());
    }

    const isActive = $derived(isFacilityActive(facility.expiresAt));
</script>

<div class="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
    <!-- Facility Header -->
    <div class="flex items-start justify-between gap-4 mb-4">
        <div class="flex-1">
            <div class="flex items-start justify-between mb-2">
                <h4 class="font-semibold text-lg">
                    {facility.facilityName} - {facility.facilityIdentifier}
                    {#if isActive}
                        <Badge variant="default" class="ml-2">
                            <CircleCheck class="h-3 w-3 mr-1" />
                            Attivo
                        </Badge>
                    {:else}
                        <Badge variant="secondary" class="ml-2">
                            <CircleX class="h-3 w-3 mr-1" />
                            Scaduto
                        </Badge>
                    {/if}
                </h4>
            </div>
            <p class="text-sm text-muted-foreground">
                {facility.facilityTypeDescription}
            </p>
        </div>
        <div class="flex gap-2">
            <Button
                variant="outline"
                size="sm"
                onclick={() => onRenew(facility)}
            >
                <CirclePlus class="h-4 w-4 mr-2" />
                Rinnova
            </Button>
            <Button
                variant="outline"
                size="sm"
                onclick={() => onEditPayment(facility)}
            >
                <Pencil class="h-4 w-4 mr-2" />
                {facility.payment ? "Modifica" : "Pagamento"}
            </Button>
            <Button
                variant="destructive"
                size="sm"
                onclick={() => onFree(facility)}
            >
                <Trash2 class="h-4 w-4 mr-2" />
                Libera
            </Button>
        </div>
    </div>

    <!-- Facility Dates -->
    <div class="grid grid-cols-2 gap-4 mt-4 text-sm">
        <div>
            <p class="text-muted-foreground mb-1">Data Inizio</p>
            <p class="font-medium">{formatDate(facility.rentedAt)}</p>
        </div>
        <div>
            <p class="text-muted-foreground mb-1">Data Scadenza</p>
            <p class="font-medium">{formatDate(facility.expiresAt)}</p>
        </div>
    </div>

    <!-- Boat Info -->
    {#if facility.boatInfo}
        <Separator class="my-4" />
        <div class="bg-muted/50 rounded-lg p-3">
            <div class="flex items-center gap-2 mb-3">
                <Ship class="h-4 w-4 text-muted-foreground" />
                <span class="text-sm font-medium"
                    >Informazioni Imbarcazione</span
                >
            </div>
            <div class="grid grid-cols-3 gap-3 text-sm">
                <div>
                    <p class="text-muted-foreground mb-1">Nome</p>
                    <p class="font-medium">{facility.boatInfo.name}</p>
                </div>
                <div>
                    <p class="text-muted-foreground mb-1">Lunghezza</p>
                    <p class="font-medium">
                        {facility.boatInfo.lengthMeters}m
                    </p>
                </div>
                <div>
                    <p class="text-muted-foreground mb-1">Larghezza</p>
                    <p class="font-medium">{facility.boatInfo.widthMeters}m</p>
                </div>
            </div>
        </div>
    {/if}

    <!-- Payment Info -->
    {#if facility.payment}
        <Separator class="my-4" />
        <div class="bg-muted/50 rounded-lg p-3">
            <div class="flex items-center gap-2 mb-3">
                <CreditCard class="h-4 w-4 text-muted-foreground" />
                <span class="text-sm font-medium">Dettagli Pagamento</span>
            </div>
            <div class="grid grid-cols-2 gap-3 text-sm">
                <div>
                    <p class="text-muted-foreground mb-1">Importo</p>
                    <p class="font-semibold text-base">
                        {formatCurrency(
                            facility.payment.amount,
                            facility.payment.currency,
                        )}
                    </p>
                </div>
                <div>
                    <p class="text-muted-foreground mb-1">Data Pagamento</p>
                    <p class="font-medium">
                        {facility.payment.paidAt
                            ? formatDate(facility.payment.paidAt)
                            : "Non specificato"}
                    </p>
                </div>
                {#if facility.payment.paymentMethod}
                    <div>
                        <p class="text-muted-foreground mb-1">Metodo</p>
                        <p class="font-medium">
                            {facility.payment.paymentMethod}
                        </p>
                    </div>
                {/if}
                {#if facility.payment.transactionRef}
                    <div>
                        <p class="text-muted-foreground mb-1">Riferimento</p>
                        <p class="font-medium font-mono text-xs">
                            {facility.payment.transactionRef}
                        </p>
                    </div>
                {/if}
            </div>
        </div>
    {:else}
        <Separator class="my-4" />
        <div
            class="flex items-center gap-2 text-sm text-muted-foreground py-2 mb-2"
        >
            <Clock class="h-4 w-4" />
            <span>Pagamento non ancora effettuato</span>
        </div>
        {#if facility.price}
            <div class="mt-3 p-3 rounded-lg">
                <div class="flex items-center gap-2">
                    <Euro class="h-4 w-4" />
                    <div>
                        <p class="text-xs font-medium">Importo Dovuto</p>
                        <p class="text-sm font-semibold">
                            {formatCurrency(facility.price, "EUR")}
                        </p>
                    </div>
                </div>
            </div>
        {/if}
    {/if}
</div>
