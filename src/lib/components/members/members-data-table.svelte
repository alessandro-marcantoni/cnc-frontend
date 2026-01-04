<script lang="ts">
    import * as Table from "$lib/components/ui/table";
    import { Button } from "$lib/components/ui/button";
    import { Badge } from "$lib/components/ui/badge";
    import { Input } from "$lib/components/ui/input";
    import MultiSelect from "$lib/components/ui/multi-select.svelte";
    import { ChevronUp, ChevronDown } from "@lucide/svelte";
    import type { Member, MembershipStatus } from "$model/members/member";

    const statusOptions = [
        { value: "ACTIVE", label: "Attivo", variant: "default" as const },
        {
            value: "SUSPENDED",
            label: "Sospeso",
            variant: "destructive" as const,
        },
        { value: "EXPIRED", label: "Scaduto", variant: "secondary" as const },
    ];

    // Props
    interface Props {
        data: Member[];
    }

    let { data }: Props = $props();

    // State
    let searchQuery = $state("");
    let statusFilter = $state<MembershipStatus[]>([
        "ACTIVE",
        "SUSPENDED",
        "EXPIRED",
    ]);
    let sortColumn = $state<string | null>(null);
    let sortDirection = $state<"asc" | "desc">("asc");
    let currentPage = $state(0);
    let pageSize = 50;

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
            statusFilter.includes(member.membership.status),
        );

        // Sort
        if (sortColumn) {
            filtered = [...filtered].sort((a, b) => {
                let aVal: any;
                let bVal: any;

                switch (sortColumn) {
                    case "memberNumber":
                        aVal = a.membership.number;
                        bVal = b.membership.number;
                        break;
                    case "name":
                        aVal = `${a.firstName} ${a.lastName}`;
                        bVal = `${b.firstName} ${b.lastName}`;
                        break;
                    case "email":
                        aVal = a.email;
                        bVal = b.email;
                        break;
                    case "phone":
                        aVal = a.phoneNumbers[0]?.number || "";
                        bVal = b.phoneNumbers[0]?.number || "";
                        break;
                    case "location":
                        aVal = a.addresses[0]
                            ? `${a.addresses[0].city}, ${a.addresses[0].country}`
                            : "";
                        bVal = b.addresses[0]
                            ? `${b.addresses[0].city}, ${b.addresses[0].country}`
                            : "";
                        break;
                    case "status":
                        aVal = a.membership.status;
                        bVal = b.membership.status;
                        break;
                    case "joinedDate":
                        aVal = new Date(a.membership.validFrom).getTime();
                        bVal = new Date(b.membership.validFrom).getTime();
                        break;
                    case "expiresAt":
                        aVal = new Date(a.membership.expiresAt).getTime();
                        bVal = new Date(b.membership.expiresAt).getTime();
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

    function getStatusBadgeVariant(status: string) {
        switch (status.toUpperCase()) {
            case "ACTIVE":
                return "default";
            case "SUSPENDED":
                return "destructive";
            case "EXPIRED":
                return "secondary";
            default:
                return "outline";
        }
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
        window.history.pushState({}, "", `/members/${memberId}`);
        window.dispatchEvent(new PopStateEvent("popstate"));
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
                class="w-[280px]"
            />
        </div>
    </div>

    <!-- Table -->
    <div class="rounded-md border">
        <Table.Root>
            <Table.Header>
                <Table.Row>
                    <Table.Head class="w-[100px]">
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
                            onclick={() => handleSort("email")}
                        >
                            Email
                            {#if isSortedAsc("email")}
                                <ChevronUp class="h-4 w-4" />
                            {:else if isSortedDesc("email")}
                                <ChevronDown class="h-4 w-4" />
                            {/if}
                        </button>
                    </Table.Head>
                    <Table.Head>
                        <button
                            class="flex items-center gap-1 font-medium hover:text-foreground"
                            onclick={() => handleSort("phone")}
                        >
                            Telefono
                            {#if isSortedAsc("phone")}
                                <ChevronUp class="h-4 w-4" />
                            {:else if isSortedDesc("phone")}
                                <ChevronDown class="h-4 w-4" />
                            {/if}
                        </button>
                    </Table.Head>
                    <Table.Head>
                        <button
                            class="flex items-center gap-1 font-medium hover:text-foreground"
                            onclick={() => handleSort("location")}
                        >
                            Località
                            {#if isSortedAsc("location")}
                                <ChevronUp class="h-4 w-4" />
                            {:else if isSortedDesc("location")}
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
                    <Table.Head>
                        <button
                            class="flex items-center gap-1 font-medium hover:text-foreground"
                            onclick={() => handleSort("joinedDate")}
                        >
                            Socio dal
                            {#if isSortedAsc("joinedDate")}
                                <ChevronUp class="h-4 w-4" />
                            {:else if isSortedDesc("joinedDate")}
                                <ChevronDown class="h-4 w-4" />
                            {/if}
                        </button>
                    </Table.Head>
                    <Table.Head>
                        <button
                            class="flex items-center gap-1 font-medium hover:text-foreground"
                            onclick={() => handleSort("expiresAt")}
                        >
                            Scadenza
                            {#if isSortedAsc("expiresAt")}
                                <ChevronUp class="h-4 w-4" />
                            {:else if isSortedDesc("expiresAt")}
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
                                {member.membership.number}
                            </Table.Cell>
                            <Table.Cell class="font-semibold">
                                {member.firstName}
                                {member.lastName}
                            </Table.Cell>
                            <Table.Cell>{member.email}</Table.Cell>
                            <Table.Cell>
                                {member.phoneNumbers[0]?.number || "-"}
                            </Table.Cell>
                            <Table.Cell class="text-muted-foreground">
                                {#if member.addresses[0]}
                                    {member.addresses[0].city}, {member
                                        .addresses[0].country}
                                {:else}
                                    -
                                {/if}
                            </Table.Cell>
                            <Table.Cell>
                                <Badge
                                    variant={getStatusBadgeVariant(
                                        member.membership.status,
                                    )}
                                >
                                    {member.membership.status}
                                </Badge>
                            </Table.Cell>
                            <Table.Cell>
                                {new Date(
                                    member.membership.validFrom,
                                ).toLocaleDateString()}
                            </Table.Cell>
                            <Table.Cell>
                                {new Date(
                                    member.membership.expiresAt,
                                ).toLocaleDateString()}
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
