<script lang="ts">
    import * as Card from "$lib/components/ui/card";
    import * as Empty from "$lib/components/ui/empty";
    import * as Alert from "$lib/components/ui/alert";
    import * as AlertDialog from "$lib/components/ui/alert-dialog";
    import { Badge } from "$lib/components/ui/badge";
    import { Button } from "$lib/components/ui/button";
    import { Separator } from "$lib/components/ui/separator";
    import { Clock, X, Users, CalendarDays } from "@lucide/svelte";
    import { formatDate } from "$model/shared/date-utils";
    import type { DateValue } from "@internationalized/date";

    export interface WaitlistEntry {
        id: number;
        facilityTypeId: number;
        facilityTypeName: string;
        position: number;
        totalInQueue: number;
        joinedAt: DateValue;
        notes?: string | null;
    }

    interface Props {
        waitlistEntries: WaitlistEntry[];
        onLeaveWaitlist: (entryId: number) => void;
        loading?: boolean;
    }

    let { waitlistEntries, onLeaveWaitlist, loading = false }: Props = $props();

    // Leave waitlist confirmation dialog
    let leaveDialogOpen = $state(false);
    let selectedEntry = $state<WaitlistEntry | null>(null);

    function openLeaveDialog(entry: WaitlistEntry) {
        selectedEntry = entry;
        leaveDialogOpen = true;
    }

    function confirmLeave() {
        if (selectedEntry) {
            onLeaveWaitlist(selectedEntry.id);
            leaveDialogOpen = false;
            selectedEntry = null;
        }
    }
</script>

<Card.Root>
    <Card.Header>
        <div class="flex items-center justify-between">
            <Card.Title class="flex items-center gap-2">
                <Clock class="h-5 w-5" />
                Liste d'Attesa
            </Card.Title>
            {#if waitlistEntries.length > 0}
                <Badge variant="secondary">
                    {waitlistEntries.length}
                    {waitlistEntries.length === 1 ? "attiva" : "attive"}
                </Badge>
            {/if}
        </div>
    </Card.Header>
    <Card.Content>
        {#if loading}
            <div class="flex items-center justify-center py-8">
                <div
                    class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"
                ></div>
            </div>
        {:else if waitlistEntries.length === 0}
            <Empty.Root>
                <Empty.Header>
                    <Empty.Media variant="icon">
                        <Clock class="h-6 w-6" />
                    </Empty.Media>
                    <Empty.Title>Nessuna Lista d'Attesa</Empty.Title>
                    <Empty.Description>
                        Non sei attualmente in nessuna lista d'attesa per
                        strutture.
                    </Empty.Description>
                </Empty.Header>
            </Empty.Root>
        {:else}
            <div class="space-y-4">
                {#each waitlistEntries as entry, index (entry.id)}
                    <div>
                        {#if index > 0}
                            <Separator class="mb-4" />
                        {/if}
                        <div class="space-y-3">
                            <!-- Header with facility type and action -->
                            <div class="flex items-start justify-between">
                                <div class="flex-1">
                                    <h4 class="font-semibold text-base">
                                        {entry.facilityTypeName}
                                    </h4>
                                    <p
                                        class="text-sm text-muted-foreground mt-1"
                                    >
                                        Aggiunto il {formatDate(entry.joinedAt)}
                                    </p>
                                </div>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onclick={() => openLeaveDialog(entry)}
                                    class="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    title="Esci dalla lista d'attesa"
                                >
                                    <X class="h-4 w-4" />
                                </Button>
                            </div>

                            <!-- Position and queue info -->
                            <div class="flex items-center gap-4 flex-wrap">
                                <div class="flex items-center gap-2">
                                    <span class="text-sm text-muted-foreground"
                                        >Posizione:</span
                                    >
                                    <Badge variant="outline" class="font-bold">
                                        #{entry.position}
                                    </Badge>
                                </div>
                                <div
                                    class="flex items-center gap-1.5 text-sm text-muted-foreground"
                                >
                                    <Users class="h-3.5 w-3.5" />
                                    <span>
                                        {entry.totalInQueue}
                                        {entry.totalInQueue === 1
                                            ? "persona"
                                            : "persone"} in coda
                                    </span>
                                </div>
                            </div>

                            <!-- Position indicator -->
                            {#if entry.position === 1}
                                <Alert.Root>
                                    <div
                                        class="h-2 w-2 rounded-full bg-primary animate-pulse"
                                    ></div>
                                    <Alert.Description>
                                        Sei il prossimo in lista!
                                    </Alert.Description>
                                </Alert.Root>
                            {:else if entry.position <= 3}
                                <Alert.Root>
                                    <CalendarDays />
                                    <Alert.Description>
                                        Tra i primi in lista - sarai notificato
                                        presto
                                    </Alert.Description>
                                </Alert.Root>
                            {/if}

                            <!-- Notes -->
                            {#if entry.notes}
                                <div class="p-2.5 rounded-md bg-muted">
                                    <p
                                        class="text-xs font-medium text-muted-foreground mb-1"
                                    >
                                        Note:
                                    </p>
                                    <p class="text-sm">
                                        {entry.notes}
                                    </p>
                                </div>
                            {/if}
                        </div>
                    </div>
                {/each}
            </div>
        {/if}
    </Card.Content>
</Card.Root>

<!-- Leave Waitlist Confirmation Dialog -->
<AlertDialog.Root bind:open={leaveDialogOpen}>
    <AlertDialog.Content>
        <AlertDialog.Header>
            <AlertDialog.Title>Esci dalla Lista d'Attesa?</AlertDialog.Title>
            <AlertDialog.Description>
                {#if selectedEntry}
                    Sei sicuro di voler uscire dalla lista d'attesa per
                    <span class="font-semibold"
                        >{selectedEntry.facilityTypeName}</span
                    >?
                    <br /><br />
                    Attualmente sei in posizione
                    <span class="font-semibold">#{selectedEntry.position}</span
                    >. Se esci, perderai la tua posizione in coda.
                {/if}
            </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
            <AlertDialog.Cancel>Annulla</AlertDialog.Cancel>
            <AlertDialog.Action
                onclick={confirmLeave}
                class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
                Esci dalla Lista
            </AlertDialog.Action>
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>
