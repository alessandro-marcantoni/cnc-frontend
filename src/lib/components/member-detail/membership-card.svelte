<script lang="ts">
    import * as Card from "$lib/components/ui/card";
    import * as Empty from "$lib/components/ui/empty";
    import { Badge, type BadgeVariant } from "$lib/components/ui/badge";
    import { Button } from "$lib/components/ui/button";
    import { Separator } from "$lib/components/ui/separator";
    import { CreditCard, UsersRound, RefreshCw } from "@lucide/svelte";
    import type { Membership, MembershipStatus } from "$model/members/member";
    import { formatDate } from "$model/shared/date-utils";

    interface Props {
        memberships: Membership[] | undefined;
        selectedSeasonName: string;
        onRenew: () => void;
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

    let { memberships, selectedSeasonName, onRenew }: Props = $props();

    const currentMembership = $derived(
        memberships && memberships.length > 0 ? memberships[0] : null,
    );

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
                    ><CreditCard />Tessera Corrente</Card.Title
                >
                <Button size="sm" variant="outline" onclick={onRenew}>
                    <RefreshCw class="h-4 w-4 mr-2" />
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
