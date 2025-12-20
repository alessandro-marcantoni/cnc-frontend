<script lang="ts">
    import MemberStats from "$lib/components/members/member-stats.svelte";
    import MembersDataTable from "$lib/components/members/members-data-table.svelte";
    import Header from "$lib/components/shared/header.svelte";
    import * as Card from "$lib/components/ui/card";
    import { mockMembers } from "$lib/data/mock-members";
</script>

<Header />

<!-- Main Content -->
<main class="container mx-auto px-4 py-8">
    <!-- Stats Grid -->
    <MemberStats members={mockMembers} />

    <!-- Members Table -->
    <Card.Root>
        <Card.Header>
            <Card.Title>Members Directory</Card.Title>
            <Card.Description>
                A comprehensive list of all yacht club members. Filter by name
                or toggle membership status.
            </Card.Description>
        </Card.Header>
        <Card.Content>
            <MembersDataTable data={mockMembers} />
        </Card.Content>
    </Card.Root>
</main>
