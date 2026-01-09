<script lang="ts">
    import * as Card from "$lib/components/ui/card";
    import { Badge } from "$lib/components/ui/badge";
    import type { Membership } from "$model/members/member";
    import { formatDate } from "$model/shared/date-utils";

    interface Props {
        memberships: Membership[];
    }

    let { memberships }: Props = $props();

    const pastMemberships = $derived(
        memberships.length > 1 ? memberships.slice(1) : [],
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
</script>

{#if pastMemberships.length > 0}
    <Card.Root>
        <Card.Header>
            <Card.Title>Storico Tessere</Card.Title>
            <Card.Description>Tessere precedenti del socio</Card.Description>
        </Card.Header>
        <Card.Content>
            <div class="space-y-3">
                {#each pastMemberships as membership}
                    <div
                        class="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                        <div>
                            <div class="flex items-center justify-between mb-2">
                                <span class="font-medium"
                                    >Tessera #{membership.number}</span
                                >
                                <Badge
                                    variant={getStatusBadgeVariant(
                                        membership.status,
                                    )}
                                >
                                    {getStatusLabel(membership.status)}
                                </Badge>
                            </div>
                            <p class="text-sm text-muted-foreground">
                                {formatDate(membership.validFrom)} - {formatDate(
                                    membership.expiresAt,
                                )}
                            </p>
                        </div>
                    </div>
                {/each}
            </div>
        </Card.Content>
    </Card.Root>
{/if}
