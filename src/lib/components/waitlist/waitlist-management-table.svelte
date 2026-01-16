<script lang="ts">
    import * as Table from "$lib/components/ui/table";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
    import * as AlertDialog from "$lib/components/ui/alert-dialog";
    import * as Tabs from "$lib/components/ui/tabs";
    import { Badge } from "$lib/components/ui/badge";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import {
        MoreVertical,
        ArrowUp,
        ArrowDown,
        UserCheck,
        X,
        Search,
        Bell,
        Calendar,
    } from "@lucide/svelte";
    import { formatDate } from "$model/shared/date-utils";
    import type { DateValue } from "@internationalized/date";

    export interface WaitlistMember {
        id: number;
        memberId: number;
        memberName: string;
        memberNumber: string;
        position: number;
        joinedAt: DateValue;
        notes?: string | null;
    }

    export interface FacilityTypeWaitlist {
        facilityTypeId: number;
        facilityTypeName: string;
        waitlist: WaitlistMember[];
    }

    interface Props {
        waitlists: FacilityTypeWaitlist[];
        onAssignFacility: (waitlistEntryId: number, memberId: number) => void;
        onRemoveMember: (waitlistEntryId: number) => void;
        onMoveUp: (waitlistEntryId: number) => void;
        onMoveDown: (waitlistEntryId: number) => void;
        onNotifyMember: (waitlistEntryId: number, memberId: number) => void;
        loading?: boolean;
    }

    let {
        waitlists,
        onAssignFacility,
        onRemoveMember,
        onMoveUp,
        onMoveDown,
        onNotifyMember,
        loading = false,
    }: Props = $props();

    // State
    let activeTab = $state("");

    // Initialize active tab when waitlists load
    $effect(() => {
        if (waitlists.length > 0 && !activeTab) {
            activeTab = waitlists[0].facilityTypeId.toString();
        }
    });
    let searchQuery = $state("");
    let removeDialogOpen = $state(false);
    let selectedMember = $state<WaitlistMember | null>(null);
    let selectedFacilityType = $state<string>("");

    // Get active waitlist
    let activeWaitlist = $derived(
        waitlists.find((w) => w.facilityTypeId.toString() === activeTab),
    );

    // Filter members by search
    let filteredMembers = $derived(
        activeWaitlist?.waitlist.filter(
            (member) =>
                member.memberName
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                member.memberNumber
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()),
        ) || [],
    );

    function openRemoveDialog(
        member: WaitlistMember,
        facilityTypeName: string,
    ) {
        selectedMember = member;
        selectedFacilityType = facilityTypeName;
        removeDialogOpen = true;
    }

    function confirmRemove() {
        if (selectedMember) {
            onRemoveMember(selectedMember.id);
            removeDialogOpen = false;
            selectedMember = null;
            selectedFacilityType = "";
        }
    }

    function getPositionBadgeVariant(position: number) {
        if (position === 1) return "default";
        if (position <= 3) return "secondary";
        return "outline";
    }

    function canMoveUp(position: number): boolean {
        return position > 1;
    }

    function canMoveDown(member: WaitlistMember): boolean {
        if (!activeWaitlist) return false;
        return member.position < activeWaitlist.waitlist.length;
    }
</script>

<div class="space-y-4">
    {#if loading}
        <div class="flex items-center justify-center py-12">
            <div
                class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"
            ></div>
        </div>
    {:else if waitlists.length === 0}
        <div class="text-center py-12">
            <p class="text-muted-foreground">
                Nessuna lista d'attesa attiva al momento.
            </p>
        </div>
    {:else}
        <Tabs.Root bind:value={activeTab}>
            <Tabs.List class="w-full justify-start overflow-x-auto">
                {#each waitlists as waitlist (waitlist.facilityTypeId)}
                    <Tabs.Trigger value={waitlist.facilityTypeId.toString()}>
                        <span>{waitlist.facilityTypeName}</span>
                        <Badge variant="secondary" class="ml-2">
                            {waitlist.waitlist.length}
                        </Badge>
                    </Tabs.Trigger>
                {/each}
            </Tabs.List>

            {#each waitlists as waitlist (waitlist.facilityTypeId)}
                <Tabs.Content
                    value={waitlist.facilityTypeId.toString()}
                    class="space-y-4"
                >
                    <!-- Search Bar -->
                    <div class="flex items-center gap-2">
                        <div class="relative flex-1">
                            <Search
                                class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                            />
                            <Input
                                type="text"
                                placeholder="Cerca per nome o numero socio..."
                                bind:value={searchQuery}
                                class="pl-10"
                            />
                        </div>
                        <Button variant="outline" size="sm">
                            <Calendar class="h-4 w-4 mr-2" />
                            Ordina per Data
                        </Button>
                    </div>

                    <!-- Table -->
                    {#if filteredMembers.length === 0}
                        <div class="text-center py-8">
                            <p class="text-muted-foreground">
                                {searchQuery
                                    ? "Nessun risultato trovato."
                                    : "La lista d'attesa è vuota."}
                            </p>
                        </div>
                    {:else}
                        <div class="rounded-md border">
                            <Table.Root>
                                <Table.Header>
                                    <Table.Row>
                                        <Table.Head class="w-20"
                                            >Pos.</Table.Head
                                        >
                                        <Table.Head>Socio</Table.Head>
                                        <Table.Head>N. Tessera</Table.Head>
                                        <Table.Head>Data Iscrizione</Table.Head>
                                        <Table.Head>Note</Table.Head>
                                        <Table.Head class="text-right w-20"
                                            >Azioni</Table.Head
                                        >
                                    </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                    {#each filteredMembers as member (member.id)}
                                        <Table.Row>
                                            <!-- Position -->
                                            <Table.Cell>
                                                <Badge
                                                    variant={getPositionBadgeVariant(
                                                        member.position,
                                                    )}
                                                    class="font-bold"
                                                >
                                                    #{member.position}
                                                </Badge>
                                            </Table.Cell>

                                            <!-- Member Name -->
                                            <Table.Cell class="font-medium">
                                                {member.memberName}
                                                {#if member.position === 1}
                                                    <span
                                                        class="ml-2 inline-flex items-center gap-1 text-xs text-green-600"
                                                    >
                                                        <span
                                                            class="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"
                                                        ></span>
                                                        Prossimo
                                                    </span>
                                                {/if}
                                            </Table.Cell>

                                            <!-- Member Number -->
                                            <Table.Cell
                                                class="text-muted-foreground"
                                            >
                                                #{member.memberNumber}
                                            </Table.Cell>

                                            <!-- Joined Date -->
                                            <Table.Cell
                                                class="text-muted-foreground"
                                            >
                                                {formatDate(member.joinedAt)}
                                            </Table.Cell>

                                            <!-- Notes -->
                                            <Table.Cell>
                                                {#if member.notes}
                                                    <div
                                                        class="max-w-48 truncate text-sm"
                                                        title={member.notes}
                                                    >
                                                        {member.notes}
                                                    </div>
                                                {:else}
                                                    <span
                                                        class="text-muted-foreground text-sm"
                                                        >—</span
                                                    >
                                                {/if}
                                            </Table.Cell>

                                            <!-- Actions -->
                                            <Table.Cell class="text-right">
                                                <DropdownMenu.Root>
                                                    <DropdownMenu.Trigger>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            class="h-8 w-8"
                                                        >
                                                            <MoreVertical
                                                                class="h-4 w-4"
                                                            />
                                                        </Button>
                                                    </DropdownMenu.Trigger>
                                                    <DropdownMenu.Content
                                                        align="end"
                                                    >
                                                        <DropdownMenu.Label>
                                                            Azioni
                                                        </DropdownMenu.Label>
                                                        <DropdownMenu.Separator
                                                        />
                                                        <DropdownMenu.Item
                                                            onclick={() =>
                                                                onAssignFacility(
                                                                    member.id,
                                                                    member.memberId,
                                                                )}
                                                        >
                                                            <UserCheck
                                                                class="h-4 w-4 mr-2"
                                                            />
                                                            Assegna Struttura
                                                        </DropdownMenu.Item>
                                                        <DropdownMenu.Item
                                                            onclick={() =>
                                                                onNotifyMember(
                                                                    member.id,
                                                                    member.memberId,
                                                                )}
                                                        >
                                                            <Bell
                                                                class="h-4 w-4 mr-2"
                                                            />
                                                            Notifica Disponibilità
                                                        </DropdownMenu.Item>
                                                        <DropdownMenu.Separator
                                                        />
                                                        <DropdownMenu.Item
                                                            onclick={() =>
                                                                onMoveUp(
                                                                    member.id,
                                                                )}
                                                            disabled={!canMoveUp(
                                                                member.position,
                                                            )}
                                                        >
                                                            <ArrowUp
                                                                class="h-4 w-4 mr-2"
                                                            />
                                                            Sposta Su
                                                        </DropdownMenu.Item>
                                                        <DropdownMenu.Item
                                                            onclick={() =>
                                                                onMoveDown(
                                                                    member.id,
                                                                )}
                                                            disabled={!canMoveDown(
                                                                member,
                                                            )}
                                                        >
                                                            <ArrowDown
                                                                class="h-4 w-4 mr-2"
                                                            />
                                                            Sposta Giù
                                                        </DropdownMenu.Item>
                                                        <DropdownMenu.Separator
                                                        />
                                                        <DropdownMenu.Item
                                                            onclick={() =>
                                                                openRemoveDialog(
                                                                    member,
                                                                    waitlist.facilityTypeName,
                                                                )}
                                                            class="text-destructive focus:text-destructive"
                                                        >
                                                            <X
                                                                class="h-4 w-4 mr-2"
                                                            />
                                                            Rimuovi dalla Lista
                                                        </DropdownMenu.Item>
                                                    </DropdownMenu.Content>
                                                </DropdownMenu.Root>
                                            </Table.Cell>
                                        </Table.Row>
                                    {/each}
                                </Table.Body>
                            </Table.Root>
                        </div>

                        <!-- Summary Info -->
                        <div
                            class="flex items-center justify-between text-sm text-muted-foreground"
                        >
                            <span>
                                Totale: {filteredMembers.length}
                                {filteredMembers.length === 1
                                    ? "persona"
                                    : "persone"}
                                in coda
                            </span>
                            {#if searchQuery}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onclick={() => (searchQuery = "")}
                                >
                                    Cancella Ricerca
                                </Button>
                            {/if}
                        </div>
                    {/if}
                </Tabs.Content>
            {/each}
        </Tabs.Root>
    {/if}
</div>

<!-- Remove from Waitlist Confirmation Dialog -->
<AlertDialog.Root bind:open={removeDialogOpen}>
    <AlertDialog.Content>
        <AlertDialog.Header>
            <AlertDialog.Title>Rimuovi dalla Lista d'Attesa</AlertDialog.Title>
            <AlertDialog.Description>
                {#if selectedMember}
                    Sei sicuro di voler rimuovere
                    <span class="font-semibold"
                        >{selectedMember.memberName}</span
                    >
                    dalla lista d'attesa per
                    <span class="font-semibold">{selectedFacilityType}</span>?
                    <br /><br />
                    Il socio è attualmente in posizione
                    <span class="font-semibold">#{selectedMember.position}</span
                    >. Questa azione non può essere annullata.
                {/if}
            </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
            <AlertDialog.Cancel>Annulla</AlertDialog.Cancel>
            <AlertDialog.Action
                onclick={confirmRemove}
                class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
                Rimuovi
            </AlertDialog.Action>
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>
