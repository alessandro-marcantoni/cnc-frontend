<script lang="ts">
    import * as Table from "$lib/components/ui/table";
    import { Button } from "$lib/components/ui/button";
    import { Badge, type BadgeVariant } from "$lib/components/ui/badge";
    import { Input } from "$lib/components/ui/input";
    import MultiSelect from "$lib/components/ui/multi-select.svelte";
    import { ChevronUp, ChevronDown } from "@lucide/svelte";
    import type { Member, MembershipStatus } from "$model/members/member";
    import { getLocalTimeZone, type DateValue } from "@internationalized/date";
    import { goto } from "@mateothegreat/svelte5-router";

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

    // Props
    interface Props {
        data: Member[];
    }

    let { data }: Props = $props();

    // State
    let searchQuery = $state("");
    let statusFilter = $state<MembershipStatus[]>(["ACTIVE", "EXPIRED"]);
    let sortColumn = $state<string | null>(null);
    let sortDirection = $state<"asc" | "desc">("asc");
    let currentPage = $state(0);
    let pageSize = 50;

    // Format date as dd/MM/yyyy
    function formatDate(date: Date | DateValue): string {
        if (date instanceof Date) {
            const day = date.getDate().toString().padStart(2, "0");
            const month = (date.getMonth() + 1).toString().padStart(2, "0");
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        } else {
            const day = date.day.toString().padStart(2, "0");
            const month = date.month.toString().padStart(2, "0");
            const year = date.year.toString();
            return `${day}/${month}/${year}`;
        }
    }

    // Filter members
    const filteredMembers = $derived.by(() => {
        let filtered = data;

        // Filter by search query (name)
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter((member) => {
                const fullName =
                    `${member.firstName} ${member.lastName}`.toLowerCase();
                return fullName.includes(query);
            });
        }

        // Filter by status
        filtered = filtered.filter((member) =>
            statusFilter.includes(member.membershipStatus),
        );

        // Sort
        if (sortColumn) {
            filtered = [...filtered].sort((a, b) => {
                let aVal: any;
                let bVal: any;

                switch (sortColumn) {
                    case "memberNumber":
                        aVal = a.membershipNumber;
                        bVal = b.membershipNumber;
                        break;
                    case "name":
                        aVal = `${a.lastName} ${a.firstName}`;
                        bVal = `${b.lastName} ${b.firstName}`;
                        break;
                    case "birthDate":
                        aVal = a.birthDate.toDate(getLocalTimeZone()).getTime();
                        bVal = b.birthDate.toDate(getLocalTimeZone()).getTime();
                        break;
                    case "status":
                        aVal = a.membershipStatus;
                        bVal = b.membershipStatus;
                        break;
                    default:
                        return 0;
                }

                if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
                if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
                return 0;
            });
        }

        return filtered;
    });

    // Paginate
    const paginatedMembers = $derived.by(() => {
        const start = currentPage * pageSize;
        const end = start + pageSize;
        return filteredMembers.slice(start, end);
    });

    const totalPages = $derived(Math.ceil(filteredMembers.length / pageSize));

    function handleSort(column: string) {
        if (sortColumn === column) {
            sortDirection = sortDirection === "asc" ? "desc" : "asc";
        } else {
            sortColumn = column;
            sortDirection = "asc";
        }
    }

    function isSortedAsc(column: string): boolean {
        return sortColumn === column && sortDirection === "asc";
    }

    function isSortedDesc(column: string): boolean {
        return sortColumn === column && sortDirection === "desc";
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

    function nextPage() {
        if (currentPage < totalPages - 1) {
            currentPage++;
        }
    }

    function previousPage() {
        if (currentPage > 0) {
            currentPage--;
        }
    }

    function navigateToMember(memberId: number) {
        goto(`/members/${memberId}`);
    }

    // Reset to first page when search query or status filter changes
    $effect(() => {
        searchQuery;
        statusFilter;
        currentPage = 0;
    });
</script>

<div class="space-y-4">
    <!-- Filters -->
    <div
        class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
    >
        <div class="flex-1 max-w-sm">
            <Input
                placeholder="Filtra per nome..."
                bind:value={searchQuery}
                class="w-full"
            />
        </div>
        <div class="flex items-center gap-2">
            <label
                for="status-filter"
                class="text-sm font-medium text-muted-foreground"
            >
                Stato:
            </label>
            <MultiSelect
                options={statusOptions}
                bind:selected={statusFilter}
                placeholder="Seleziona stato..."
                class="w-70"
            />
        </div>
    </div>

    <!-- Table -->
    <div class="rounded-md border">
        <Table.Root>
            <Table.Header>
                <Table.Row>
                    <Table.Head class="w-25">
                        <button
                            class="flex items-center gap-1 font-medium hover:text-foreground"
                            onclick={() => handleSort("memberNumber")}
                        >
                            N° Socio
                            {#if isSortedAsc("memberNumber")}
                                <ChevronUp class="h-4 w-4" />
                            {:else if isSortedDesc("memberNumber")}
                                <ChevronDown class="h-4 w-4" />
                            {/if}
                        </button>
                    </Table.Head>
                    <Table.Head>
                        <button
                            class="flex items-center gap-1 font-medium hover:text-foreground"
                            onclick={() => handleSort("name")}
                        >
                            Nome
                            {#if isSortedAsc("name")}
                                <ChevronUp class="h-4 w-4" />
                            {:else if isSortedDesc("name")}
                                <ChevronDown class="h-4 w-4" />
                            {/if}
                        </button>
                    </Table.Head>
                    <Table.Head>
                        <button
                            class="flex items-center gap-1 font-medium hover:text-foreground"
                            onclick={() => handleSort("birthDate")}
                        >
                            Data di nascita
                            {#if isSortedAsc("birthDate")}
                                <ChevronUp class="h-4 w-4" />
                            {:else if isSortedDesc("birthDate")}
                                <ChevronDown class="h-4 w-4" />
                            {/if}
                        </button>
                    </Table.Head>
                    <Table.Head>
                        <button
                            class="flex items-center gap-1 font-medium hover:text-foreground"
                            onclick={() => handleSort("status")}
                        >
                            Stato
                            {#if isSortedAsc("status")}
                                <ChevronUp class="h-4 w-4" />
                            {:else if isSortedDesc("status")}
                                <ChevronDown class="h-4 w-4" />
                            {/if}
                        </button>
                    </Table.Head>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {#if paginatedMembers.length > 0}
                    {#each paginatedMembers as member (member.id)}
                        <Table.Row
                            class="cursor-pointer hover:bg-muted/50 transition-colors"
                            onclick={() => navigateToMember(member.id)}
                        >
                            <Table.Cell class="font-medium">
                                {member.membershipNumber}
                            </Table.Cell>
                            <Table.Cell class="font-semibold">
                                {member.firstName}
                                {member.lastName}
                            </Table.Cell>
                            <Table.Cell>
                                {formatDate(member.birthDate)}
                            </Table.Cell>
                            <Table.Cell>
                                <Badge
                                    variant={getStatusBadgeVariant(
                                        member.membershipStatus,
                                    )}
                                >
                                    {getStatusLabel(member.membershipStatus)}
                                </Badge>
                            </Table.Cell>
                        </Table.Row>
                    {/each}
                {:else}
                    <Table.Row>
                        <Table.Cell colspan={8} class="h-24 text-center">
                            Nessun socio trovato con i filtri selezionati.
                        </Table.Cell>
                    </Table.Row>
                {/if}
            </Table.Body>
        </Table.Root>
    </div>

    <!-- Pagination -->
    <div class="flex items-center justify-between px-2">
        <div class="flex-1 text-sm text-muted-foreground">
            Visualizzazione {filteredMembers.length > 0
                ? currentPage * pageSize + 1
                : 0}-{Math.min(
                (currentPage + 1) * pageSize,
                filteredMembers.length,
            )} di {filteredMembers.length} socio/i
        </div>
        <div class="flex items-center gap-2">
            <Button
                variant="outline"
                size="sm"
                onclick={previousPage}
                disabled={currentPage === 0}
            >
                Precedente
            </Button>
            <div class="text-sm">
                Pagina {totalPages > 0 ? currentPage + 1 : 0} di {totalPages}
            </div>
            <Button
                variant="outline"
                size="sm"
                onclick={nextPage}
                disabled={currentPage >= totalPages - 1}
            >
                Successiva
            </Button>
        </div>
    </div>
</div>
