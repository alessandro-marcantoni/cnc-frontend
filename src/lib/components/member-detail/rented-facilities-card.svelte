<script lang="ts">
    import * as Card from "$lib/components/ui/card";
    import { Badge } from "$lib/components/ui/badge";
    import { Button } from "$lib/components/ui/button";
    import { Anchor, Plus, RefreshCw, CircleAlert } from "@lucide/svelte";
    import FacilityItem from "./facility-item.svelte";
    import type { RentedFacility } from "$model/facilities/rented-facility";

    interface Props {
        facilities: RentedFacility[];
        loading: boolean;
        error: string | null;
        onRentClick: () => void;
        onEditPayment: (facility: RentedFacility) => void;
        onFree: (facility: RentedFacility) => void;
        onRenew: (facility: RentedFacility) => void;
    }

    let {
        facilities,
        loading,
        error,
        onRentClick,
        onEditPayment,
        onFree,
        onRenew,
    }: Props = $props();
</script>

<Card.Root>
    <Card.Header>
        <div class="flex items-center justify-between">
            <div>
                <Card.Title class="flex items-center gap-2">
                    <Anchor class="h-5 w-5" />
                    Servizi Affittati
                    {#if facilities && facilities.length > 0}
                        <Badge variant="secondary">
                            {facilities.length}
                            {facilities.length === 1 ? "servizio" : "servizi"}
                        </Badge>
                    {/if}
                </Card.Title>
                <Card.Description>
                    Elenco dei servizi attualmente affittati
                </Card.Description>
            </div>
            <div class="flex items-center gap-2">
                <Button size="sm" onclick={onRentClick}>
                    <Plus class="h-4 w-4 mr-2" />
                    Affitta Servizi
                </Button>
            </div>
        </div>
    </Card.Header>
    <Card.Content>
        {#if loading}
            <div class="flex items-center justify-center py-8">
                <div class="animate-spin">
                    <RefreshCw
                        class="h-8 w-8 text-muted-foreground"
                        aria-hidden="true"
                    />
                </div>
                <p class="ml-3 text-muted-foreground">Caricamento servizi...</p>
            </div>
        {:else if error}
            <div
                class="flex flex-col items-center justify-center py-8 text-center"
            >
                <CircleAlert
                    class="h-12 w-12 text-destructive mb-4"
                    aria-hidden="true"
                />
                <p class="text-sm text-muted-foreground">
                    Errore nel caricamento dei servizi
                </p>
            </div>
        {:else if facilities && facilities.length > 0}
            <div class="space-y-4">
                {#each facilities as facility (facility.id)}
                    <FacilityItem
                        {facility}
                        onEditPayment={(f) => onEditPayment(f)}
                        onFree={(f) => onFree(f)}
                        onRenew={(f) => onRenew(f)}
                    />
                {/each}
            </div>
        {:else}
            <div
                class="flex flex-col items-center justify-center py-12 text-center"
            >
                <Anchor class="h-12 w-12 text-muted-foreground mb-4" />
                <p>Nessun servizio affittato</p>
            </div>
        {/if}
    </Card.Content>
</Card.Root>
