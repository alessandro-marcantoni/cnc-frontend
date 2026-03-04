<script lang="ts">
    import * as Table from "$lib/components/ui/table";
    import { Button } from "$lib/components/ui/button";
    import { Badge, type BadgeVariant } from "$lib/components/ui/badge";
    import { Input } from "$lib/components/ui/input";
    import MultiSelect from "$lib/components/ui/multi-select.svelte";
    import { ChevronUp, ChevronDown } from "@lucide/svelte";
    import type { Member } from "$model/members/member";
    import { getLocalTimeZone, type DateValue } from "@internationalized/date";
    import { goto } from "@mateothegreat/svelte5-router";
    import { getQueryParam } from "$lib/utils/query-params";

    type MembershipPaymentStatus = "PAID" | "UNPAID";
    type FacilitiesPaymentStatus = "PAID" | "UNPAID" | "NO_RENTED";

    const membershipPaymentStatusOptions: {
        value: MembershipPaymentStatus;
        label: string;
        variant: BadgeVariant;
    }[] = [
        { value: "PAID", label: "Pagato", variant: "default" },
        { value: "UNPAID", label: "Non Pagato", variant: "destructive" },
    ];

    const facilitiesPaymentStatusOptions: {
        value: FacilitiesPaymentStatus;
        label: string;
        variant: BadgeVariant;
    }[] = [
        { value: "PAID", label: "Pagato", variant: "default" },
        { value: "UNPAID", label: "Non Pagato", variant: "destructive" },
        // When a member has no rented facilities at all we show a distinct label.
        {
            value: "NO_RENTED",
            label: "Nessun affitto",
            variant: "outline",
        },
    ];

    // Props
    interface Props {
        data: Member[];
    }

    let { data }: Props = $props();

    // State
    let searchQuery = $state("");
    let membershipPaymentFilter = $state<MembershipPaymentStatus[]>([
        "PAID",
        "UNPAID",
    ]);
    let facilitiesPaymentFilter = $state<FacilitiesPaymentStatus[]>([
        "PAID",
        "UNPAID",
        "NO_RENTED",
    ]);
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

    function getMembershipPaymentStatus(
        member: Member,
    ): MembershipPaymentStatus {
        return member.membershipPaid ? "PAID" : "UNPAID";
    }

    function getFacilitiesPaymentStatus(
        member: Member,
    ): FacilitiesPaymentStatus {
        // The backend now provides a flag indicating whether the member has any rented facilities.
        // The frontend model may not yet include `hasRentedFacilities` in all environments,
        // so handle the field defensively.
        const hasRented = (member as any).hasRentedFacilities;
        // If the flag is explicitly false -> show NO_RENTED.
        if (hasRented === false) {
            return "NO_RENTED";
        }
        // If the flag is undefined (older backend or model), fall back to previous behavior:
        // if they have unpaid facilities => UNPAID, otherwise PAID.
        if (member.hasUnpaidFacilities) {
            return "UNPAID";
        }
        return "PAID";
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

        // Filter by membership payment status
        filtered = filtered.filter((member) =>
            membershipPaymentFilter.includes(
                getMembershipPaymentStatus(member),
            ),
        );

        // Filter by facilities payment status
        filtered = filtered.filter((member) =>
            facilitiesPaymentFilter.includes(
                getFacilitiesPaymentStatus(member),
            ),
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
                    case "membershipPaymentStatus":
                        aVal = getMembershipPaymentStatus(a);
                        bVal = getMembershipPaymentStatus(b);
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

    function getFacilitiesPaymentBadgeVariant(
        status: FacilitiesPaymentStatus,
    ): BadgeVariant {
        return (
            facilitiesPaymentStatusOptions.find(
                (option) => option.value === status,
            )?.variant || "outline"
        );
    }

    function getFacilitiesPaymentLabel(
        status: FacilitiesPaymentStatus,
    ): string {
        return (
            facilitiesPaymentStatusOptions.find(
                (option) => option.value === status,
            )?.label || "Unknown"
        );
    }

    function getMembershipPaymentBadgeVariant(
        status: MembershipPaymentStatus,
    ): BadgeVariant {
        return (
            membershipPaymentStatusOptions.find(
                (option) => option.value === status,
            )?.variant || "outline"
        );
    }

    function getMembershipPaymentLabel(
        status: MembershipPaymentStatus,
    ): string {
        return (
            membershipPaymentStatusOptions.find(
                (option) => option.value === status,
            )?.label || "Unknown"
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
        const season = getQueryParam("season");
        const url = season
            ? `/members/${memberId}?season=${season}`
            : `/members/${memberId}`;
        goto(url);
    }

    // Reset to first page when search query or payment filter changes
    $effect(() => {
        searchQuery;
        membershipPaymentFilter;
        facilitiesPaymentFilter;
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
        <div class="flex gap-3">
            <div class="flex items-center gap-2">
                <label
                    for="membership-payment-filter"
                    class="text-sm font-medium text-muted-foreground"
                >
                    Tessera:
                </label>
                <MultiSelect
                    options={membershipPaymentStatusOptions}
                    bind:selected={membershipPaymentFilter}
                    placeholder="Seleziona stato..."
                    class="w-60"
                />
            </div>
            <div class="flex items-center gap-2">
                <label
                    for="payment-filter"
                    class="text-sm font-medium text-muted-foreground"
                >
                    Servizi:
                </label>
                <MultiSelect
                    options={facilitiesPaymentStatusOptions}
                    bind:selected={facilitiesPaymentFilter}
                    placeholder="Seleziona stato..."
                    class="w-60"
                />
            </div>
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
                            onclick={() =>
                                handleSort("membershipPaymentStatus")}
                        >
                            Pagamento Tessera
                            {#if isSortedAsc("membershipPaymentStatus")}
                                <ChevronUp class="h-4 w-4" />
                            {:else if isSortedDesc("membershipPaymentStatus")}
                                <ChevronDown class="h-4 w-4" />
                            {/if}
                        </button>
                    </Table.Head>
                    <Table.Head>
                        <button
                            class="flex items-center gap-1 font-medium hover:text-foreground"
                            onclick={() =>
                                handleSort("facilitiesPaymentStatus")}
                        >
                            Pagamento Servizi
                            {#if isSortedAsc("facilitiesPaymentStatus")}
                                <ChevronUp class="h-4 w-4" />
                            {:else if isSortedDesc("facilitiesPaymentStatus")}
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
                                    variant={getMembershipPaymentBadgeVariant(
                                        getMembershipPaymentStatus(member),
                                    )}
                                >
                                    {getMembershipPaymentLabel(
                                        getMembershipPaymentStatus(member),
                                    )}
                                </Badge>
                            </Table.Cell>
                            <Table.Cell>
                                <Badge
                                    variant={getFacilitiesPaymentBadgeVariant(
                                        getFacilitiesPaymentStatus(member),
                                    )}
                                >
                                    {getFacilitiesPaymentLabel(
                                        getFacilitiesPaymentStatus(member),
                                    )}
                                </Badge>
                            </Table.Cell>
                        </Table.Row>
                    {/each}
                {:else}
                    <Table.Row>
                        <Table.Cell colspan={4} class="h-24 text-center">
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
