<script lang="ts">
    import * as Alert from "$lib/components/ui/alert";
    import { Badge } from "$lib/components/ui/badge";
    import { Button } from "$lib/components/ui/button";
    import { Clock, Users, AlertCircle } from "@lucide/svelte";

    interface Props {
        facilityTypeName: string;
        waitlistCount?: number;
        memberPosition?: number | null;
        onJoinWaitlist: () => void;
        onLeaveWaitlist?: () => void;
    }

    let {
        facilityTypeName,
        waitlistCount = 0,
        memberPosition = null,
        onJoinWaitlist,
        onLeaveWaitlist,
    }: Props = $props();

    let isOnWaitlist = $derived(memberPosition !== null);
</script>

<Alert.Root variant="default">
    <AlertCircle />
    <Alert.Title>
        Nessun {facilityTypeName} Disponibile
    </Alert.Title>
    <Alert.Description class="space-y-3">
        {#if isOnWaitlist}
            <p>
                Il membro è già in lista d'attesa per questo tipo di struttura.
            </p>
            {#if waitlistCount > 0}
                <div class="flex items-center gap-1 text-sm">
                    <Users class="h-3 w-3" />
                    <span>{waitlistCount} in coda</span>
                </div>
            {/if}
            {#if onLeaveWaitlist}
                <Button
                    variant="outline"
                    size="sm"
                    onclick={onLeaveWaitlist}
                    class="mt-2"
                >
                    Rimuovi dalla Lista d'Attesa
                </Button>
            {/if}
        {:else}
            <p>
                Al momento non ci sono {facilityTypeName.toLowerCase()} disponibili.
                Aggiungi il membro alla lista d'attesa?
            </p>
            <div class="flex items-center gap-4 flex-wrap">
                <Button variant="default" size="sm" onclick={onJoinWaitlist}>
                    <Clock class="h-3 w-3 mr-2" />
                    Aggiungi alla Lista d'Attesa
                </Button>
                {#if waitlistCount > 0}
                    <div class="flex items-center gap-1 text-sm">
                        <Users class="h-3 w-3" />
                        <span>{waitlistCount} già in coda</span>
                    </div>
                {/if}
            </div>
        {/if}
    </Alert.Description>
</Alert.Root>
