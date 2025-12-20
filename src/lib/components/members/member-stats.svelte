<script lang="ts">
    import * as Card from "$lib/components/ui/card";
    import type { Member } from "$model/members/member";
    import { Clock, UserCheck, Users, UserX } from "@lucide/svelte";

    let { members }: { members: Member[] } = $props();

    const stats = $derived({
        total: members.length,
        active: members.filter((m) => m.membership.status === "ACTIVE").length,
        suspended: members.filter((m) => m.membership.status === "SUSPENDED")
            .length,
        expired: members.filter((m) => m.membership.status === "EXPIRED")
            .length,
    });
</script>

<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
    <Card.Root>
        <Card.Header
            class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
            <Card.Title class="text-sm font-medium">Total Members</Card.Title>
            <Users class="h-4 w-4 text-muted-foreground" />
        </Card.Header>
        <Card.Content>
            <div class="text-2xl font-bold">{stats.total}</div>
            <p class="text-xs text-muted-foreground mt-1">Registered members</p>
        </Card.Content>
    </Card.Root>

    <Card.Root>
        <Card.Header
            class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
            <Card.Title class="text-sm font-medium">Active</Card.Title>
            <UserCheck class="h-4 w-4 text-green-600" />
        </Card.Header>
        <Card.Content>
            <div class="text-2xl font-bold">{stats.active}</div>
            <p class="text-xs text-muted-foreground mt-1">
                <span class="text-green-600"
                    >{Math.round((stats.active / stats.total) * 100)}%</span
                > of total
            </p>
        </Card.Content>
    </Card.Root>

    <Card.Root>
        <Card.Header
            class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
            <Card.Title class="text-sm font-medium">Suspended</Card.Title>
            <UserX class="h-4 w-4 text-red-600" />
        </Card.Header>
        <Card.Content>
            <div class="text-2xl font-bold">{stats.suspended}</div>
            <p class="text-xs text-muted-foreground mt-1">
                <span class="text-red-600"
                    >{Math.round((stats.suspended / stats.total) * 100)}%</span
                > of total
            </p>
        </Card.Content>
    </Card.Root>

    <Card.Root>
        <Card.Header
            class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
            <Card.Title class="text-sm font-medium">Expired</Card.Title>
            <Clock class="h-4 w-4 text-yellow-600" />
        </Card.Header>
        <Card.Content>
            <div class="text-2xl font-bold">{stats.expired}</div>
            <p class="text-xs text-muted-foreground mt-1">
                <span class="text-yellow-600"
                    >{Math.round((stats.expired / stats.total) * 100)}%</span
                > of total
            </p>
        </Card.Content>
    </Card.Root>
</div>
