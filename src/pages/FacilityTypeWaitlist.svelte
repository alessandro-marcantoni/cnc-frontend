<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "@mateothegreat/svelte5-router";
    import Header from "$lib/components/shared/header.svelte";
    import * as Card from "$lib/components/ui/card";
    import * as Table from "$lib/components/ui/table";
    import * as DropdownMenu from "$lib/components/ui/dropdown-menu";
    import * as AlertDialog from "$lib/components/ui/alert-dialog";
    import { Button } from "$lib/components/ui/button";
    import { Badge } from "$lib/components/ui/badge";
    import { Input } from "$lib/components/ui/input";
    import {
        ArrowLeft,
        Clock,
        Users,
        Search,
        MoreVertical,
        X,
        CircleAlert,
        RefreshCw,
    } from "@lucide/svelte";
    import { formatDate } from "$model/shared/date-utils";
    import {
        loadWaitlist,
        waitlist,
        isLoadingWaitlist,
        waitlistError,
        removeMemberFromWaitlistCache,
    } from "$lib/data/repositories";
    import { removeFromWaitlist } from "$lib/data/api";
    import {
        loadFacilitiesCatalog,
        facilitiesCatalog,
    } from "$lib/data/repositories";

    let { route } = $props();
    let facilityTypeId = $derived(parseInt(route.result.path.params.id, 10));
    let isValidId = $derived(!isNaN(facilityTypeId) && facilityTypeId > 0);

    // State from stores - create derived stores that react to facilityTypeId changes
    const waitlistStore = $derived(waitlist(facilityTypeId));
    const loadingStore = $derived(isLoadingWaitlist(facilityTypeId));
    const errorStore = $derived(waitlistError(facilityTypeId));

    let waitlistMembers = $derived(isValidId ? $waitlistStore : []);
    let loading = $derived(isValidId ? $loadingStore : false);
    let error = $derived(
        !isValidId ? "ID tipo struttura non valido" : $errorStore,
    );

    let catalog = $derived($facilitiesCatalog);
    let facilityType = $derived(
        catalog.find((f) => f.id === facilityTypeId) || null,
    );
    let facilityTypeName = $derived(facilityType?.name || "Tipo Struttura");

    // Local state
    let searchQuery = $state("");
    let removeDialogOpen = $state(false);
    let selectedMember = $state<(typeof waitlistMembers)[number] | null>(null);
    let isRemoving = $state(false);
    let removeError = $state<string | null>(null);

    // Filtered members based on search
    let filteredMembers = $derived(
        searchQuery.trim() === ""
            ? waitlistMembers
            : waitlistMembers.filter(
                  (m: (typeof waitlistMembers)[number]) =>
                      m.memberName
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()) ||
                      m.memberEmail
                          .toLowerCase()
                          .includes(searchQuery.toLowerCase()),
              ),
    );

    // Oldest entry (first in line)
    let oldestEntry = $derived(
        waitlistMembers.length > 0 ? waitlistMembers[0] : null,
    );

    // Load data on mount
    onMount(async () => {
        if (!isValidId) return;

        try {
            // Load facilities catalog to get facility type name
            await loadFacilitiesCatalog();
            // Load waitlist data
            await loadWaitlist(facilityTypeId);
        } catch (err) {
            console.error("Failed to load waitlist data:", err);
        }
    });

    // Refresh waitlist data
    async function refreshWaitlist() {
        if (!isValidId) return;

        try {
            await loadWaitlist(facilityTypeId, true);
        } catch (err) {
            console.error("Failed to refresh waitlist:", err);
        }
    }

    function goBack() {
        goto(`/services/${facilityTypeId}`);
    }

    function openRemoveDialog(member: (typeof waitlistMembers)[number]) {
        selectedMember = member;
        removeDialogOpen = true;
        removeError = null;
    }

    async function confirmRemove() {
        if (!selectedMember) return;

        isRemoving = true;
        removeError = null;

        try {
            // Call API to remove member from waitlist
            await removeFromWaitlist(selectedMember.memberId, facilityTypeId);

            // Optimistically update cache
            removeMemberFromWaitlistCache(
                facilityTypeId,
                selectedMember.memberId,
            );

            // Close dialog
            removeDialogOpen = false;
            selectedMember = null;
        } catch (err) {
            removeError =
                err instanceof Error
                    ? err.message
                    : "Errore durante la rimozione dalla lista d'attesa";
            console.error("Failed to remove member from waitlist:", err);
        } finally {
            isRemoving = false;
        }
    }

    function getPositionBadgeVariant(position: number) {
        if (position === 1) return "default";
        if (position <= 3) return "secondary";
        return "outline";
    }

    function viewMemberDetail(memberId: number) {
        goto(`/members/${memberId}`);
    }

    function clearSearch() {
        searchQuery = "";
    }
</script>

<Header />

<main class="container mx-auto px-4 py-8">
    <!-- Back button -->
    <div class="mb-6">
        <Button variant="ghost" onclick={goBack} class="-ml-2">
            <ArrowLeft class="mr-2 h-4 w-4" />
            Torna ai Dettagli
        </Button>
    </div>

    {#if loading}
        <!-- Loading State -->
        <div class="flex items-center justify-center py-24">
            <div class="text-center">
                <div
                    class="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"
                    role="status"
                >
                    <span class="sr-only">Caricamento...</span>
                </div>
                <p class="mt-6 text-lg text-muted-foreground font-medium">
                    Caricamento lista d'attesa...
                </p>
            </div>
        </div>
    {:else if error}
        <!-- Error State -->
        <Card.Root class="border-destructive/50">
            <Card.Content class="py-8">
                <div class="flex items-start gap-4">
                    <div class="rounded-full bg-destructive/10 p-3">
                        <CircleAlert class="h-6 w-6 text-destructive" />
                    </div>
                    <div class="flex-1">
                        <h3 class="font-semibold text-lg text-destructive mb-1">
                            Errore nel Caricamento
                        </h3>
                        <p class="text-sm text-muted-foreground mb-4">
                            {error}
                        </p>
                        <Button onclick={refreshWaitlist} size="sm">
                            <RefreshCw class="mr-2 h-4 w-4" />
                            Riprova
                        </Button>
                    </div>
                </div>
            </Card.Content>
        </Card.Root>
    {:else}
        <!-- Header Section -->
        <div class="mb-8">
            <div class="flex items-start justify-between">
                <div>
                    <h1 class="text-4xl font-bold tracking-tight mb-2">
                        Lista d'Attesa: {facilityTypeName}
                    </h1>
                    <p class="text-lg text-muted-foreground">
                        Gestisci la lista d'attesa per questo tipo di struttura
                    </p>
                </div>
                <Button onclick={refreshWaitlist} variant="outline">
                    <RefreshCw class="mr-2 h-4 w-4" />
                    Aggiorna
                </Button>
            </div>
        </div>

        <!-- Stats Card -->
        <Card.Root class="mb-6">
            <Card.Content>
                <div class="flex items-center gap-6">
                    <div class="flex items-center gap-3">
                        <div
                            class="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10"
                        >
                            <Users class="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <div class="text-3xl font-bold">
                                {waitlistMembers.length}
                            </div>
                            <div class="text-sm text-muted-foreground">
                                {waitlistMembers.length === 1
                                    ? "Persona in Attesa"
                                    : "Persone in Attesa"}
                            </div>
                        </div>
                    </div>
                    {#if waitlistMembers.length > 0}
                        <div class="h-12 w-px bg-border"></div>
                        <div class="flex items-center gap-3">
                            <div
                                class="flex h-14 w-14 items-center justify-center rounded-full bg-muted"
                            >
                                <Clock class="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div>
                                <div class="text-sm font-medium">
                                    Primo in Lista
                                </div>
                                <div class="text-sm text-muted-foreground">
                                    {oldestEntry?.memberName || "N/A"}
                                </div>
                            </div>
                        </div>
                    {/if}
                </div>
            </Card.Content>
        </Card.Root>

        <!-- Waitlist Table -->
        <Card.Root>
            <Card.Header>
                <div class="flex items-center justify-between">
                    <div>
                        <Card.Title>Lista d'Attesa</Card.Title>
                        <Card.Description>
                            Visualizza e gestisci i soci in lista d'attesa
                        </Card.Description>
                    </div>
                </div>
            </Card.Header>
            <Card.Content>
                <!-- Search Bar -->
                <div class="mb-4">
                    <div class="relative">
                        <Search
                            class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                        />
                        <Input
                            type="text"
                            placeholder="Cerca per nome..."
                            bind:value={searchQuery}
                            class="pl-9"
                        />
                    </div>
                </div>

                {#if filteredMembers.length === 0}
                    <div class="text-center py-12">
                        <div
                            class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted"
                        >
                            <Users class="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 class="text-lg font-semibold mb-2">
                            {searchQuery
                                ? "Nessun Risultato"
                                : "Lista d'Attesa Vuota"}
                        </h3>
                        <p class="text-muted-foreground max-w-sm mx-auto">
                            {searchQuery
                                ? "Non ci sono soci che corrispondono alla tua ricerca."
                                : "Non ci sono soci attualmente in lista d'attesa per questo tipo di struttura."}
                        </p>
                        {#if searchQuery}
                            <Button
                                variant="outline"
                                class="mt-4"
                                onclick={clearSearch}
                            >
                                Cancella Ricerca
                            </Button>
                        {/if}
                    </div>
                {:else}
                    <div class="rounded-md border">
                        <Table.Root>
                            <Table.Header>
                                <Table.Row>
                                    <Table.Head class="w-20">
                                        Posizione
                                    </Table.Head>
                                    <Table.Head>Socio</Table.Head>
                                    <Table.Head>Data Richiesta</Table.Head>
                                    <Table.Head>Note</Table.Head>
                                    <Table.Head class="text-right w-20">
                                        Azioni
                                    </Table.Head>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {#each filteredMembers as member (member.id)}
                                    <Table.Row>
                                        <!-- Position Badge -->
                                        <Table.Cell>
                                            <Badge
                                                variant={getPositionBadgeVariant(
                                                    member.position,
                                                )}
                                                class="font-mono text-xs"
                                            >
                                                #{member.position}
                                            </Badge>
                                        </Table.Cell>

                                        <!-- Member Name with Badge for First Position -->
                                        <Table.Cell class="font-medium">
                                            {#if member.position === 1}
                                                <span
                                                    class="inline-flex items-center gap-2"
                                                >
                                                    {member.memberName}
                                                    <Badge
                                                        variant="default"
                                                        class="text-xs"
                                                    >
                                                        Prossimo
                                                    </Badge>
                                                </span>
                                            {:else}
                                                {member.memberName}
                                            {/if}
                                        </Table.Cell>

                                        <!-- Queued Date -->
                                        <Table.Cell
                                            class="text-sm text-muted-foreground"
                                        >
                                            {formatDate(
                                                new Date(member.queuedAt),
                                            )}
                                        </Table.Cell>

                                        <!-- Notes -->
                                        <Table.Cell>
                                            {#if member.notes}
                                                <div
                                                    class="max-w-xs truncate text-sm text-muted-foreground"
                                                    title={member.notes}
                                                >
                                                    {member.notes}
                                                </div>
                                            {:else}
                                                <span
                                                    class="text-sm text-muted-foreground italic"
                                                >
                                                    Nessuna nota
                                                </span>
                                            {/if}
                                        </Table.Cell>

                                        <!-- Actions -->
                                        <Table.Cell class="text-right">
                                            <DropdownMenu.Root>
                                                <DropdownMenu.Trigger>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        class="h-8 w-8 p-0"
                                                    >
                                                        <MoreVertical
                                                            class="h-4 w-4"
                                                        />
                                                        <span class="sr-only"
                                                            >Azioni</span
                                                        >
                                                    </Button>
                                                </DropdownMenu.Trigger>
                                                <DropdownMenu.Content
                                                    align="end"
                                                >
                                                    <DropdownMenu.Label>
                                                        Azioni
                                                    </DropdownMenu.Label>
                                                    <DropdownMenu.Separator />
                                                    <DropdownMenu.Item
                                                        onclick={() =>
                                                            viewMemberDetail(
                                                                member.memberId,
                                                            )}
                                                    >
                                                        Visualizza Dettagli
                                                        Socio
                                                    </DropdownMenu.Item>
                                                    <DropdownMenu.Separator />
                                                    <DropdownMenu.Item
                                                        class="text-destructive focus:text-destructive"
                                                        onclick={() =>
                                                            openRemoveDialog(
                                                                member,
                                                            )}
                                                    >
                                                        <X
                                                            class="mr-2 h-4 w-4"
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

                    <!-- Footer with counts -->
                    <div class="mt-4 text-sm text-muted-foreground">
                        <span>
                            Mostrando {filteredMembers.length} di {waitlistMembers.length}
                            {waitlistMembers.length === 1 ? "socio" : "soci"}
                        </span>
                    </div>
                {/if}
            </Card.Content>
        </Card.Root>
    {/if}
</main>

<!-- Remove Member Dialog -->
<AlertDialog.Root bind:open={removeDialogOpen}>
    <AlertDialog.Content>
        <AlertDialog.Header>
            <AlertDialog.Title>Rimuovi dalla Lista d'Attesa</AlertDialog.Title>
            <AlertDialog.Description>
                {#if selectedMember}
                    Sei sicuro di voler rimuovere
                    <span class="font-semibold">
                        {selectedMember.memberName}
                    </span>
                    dalla lista d'attesa?
                    <br />
                    <br />
                    <span class="font-semibold"
                        >Posizione attuale: #{selectedMember.position}</span
                    >
                    <br />
                    Questa azione non può essere annullata.
                {/if}
                {#if removeError}
                    <div
                        class="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
                    >
                        {removeError}
                    </div>
                {/if}
            </AlertDialog.Description>
        </AlertDialog.Header>
        <AlertDialog.Footer>
            <AlertDialog.Cancel disabled={isRemoving}
                >Annulla</AlertDialog.Cancel
            >
            <AlertDialog.Action
                onclick={confirmRemove}
                class="bg-destructive hover:bg-destructive/90"
                disabled={isRemoving}
            >
                {isRemoving ? "Rimozione..." : "Rimuovi"}
            </AlertDialog.Action>
        </AlertDialog.Footer>
    </AlertDialog.Content>
</AlertDialog.Root>
