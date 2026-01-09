<script lang="ts">
    import * as Card from "$lib/components/ui/card";
    import * as Empty from "$lib/components/ui/empty";
    import { Badge } from "$lib/components/ui/badge";
    import { Separator } from "$lib/components/ui/separator";
    import { CreditCard, UsersRound } from "@lucide/svelte";
    import type { Membership } from "$model/members/member";
    import { formatDate } from "$model/shared/date-utils";

    interface Props {
        memberships: Membership[] | undefined;
        selectedSeasonName: string;
    }

    let { memberships, selectedSeasonName }: Props = $props();

    const currentMembership = $derived(
        memberships && memberships.length > 0 ? memberships[0] : null,
    );

    function getStatusBadgeVariant(status: string) {
        switch (status.toUpperCase()) {
            case "ACTIVE":
                return "default";
            case "UNPAID":
                return "destructive";
            case "EXCLUSION_DELIBERATED":
                return "destructive";
            case "EXCLUDED":
                return "secondary";
            default:
                return "outline";
        }
    }

    function getStatusLabel(status: string): string {
        switch (status.toUpperCase()) {
            case "ACTIVE":
                return "Attivo";
            case "UNPAID":
                return "Non Pagato";
            case "EXCLUSION_DELIBERATED":
                return "Esclusione Deliberata";
            case "EXCLUDED":
                return "Escluso";
            default:
                return status;
        }
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
            <Card.Title class="flex items-center gap-2"
                ><CreditCard />Tessera Corrente</Card.Title
            >
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

            {#if currentMembership.payment}
                <Separator />

                <div>
                    <p class="text-sm text-muted-foreground mb-1">Pagamento</p>
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
                </div>
            {/if}
        </Card.Content>
    </Card.Root>
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
            </Empty.Root>
        </Card.Content>
    </Card.Root>
{/if}
