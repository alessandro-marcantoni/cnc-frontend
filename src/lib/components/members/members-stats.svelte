<script lang="ts">
    import * as Card from "$lib/components/ui/card";
    import type { Member } from "$model/members/member";
    import { Clock, UserCheck, Users, UserX } from "@lucide/svelte";

    let { members }: { members: Member[] } = $props();

    const stats = $derived({
        total: members.length,
        active: members.filter((m) => m.membership.status === "ACTIVE").length,
        unpaid: members.filter((m) => m.membership.status === "UNPAID").length,
        exclusionDeliberated: members.filter(
            (m) => m.membership.status === "EXCLUSION_DELIBERATED",
        ).length,
    });
</script>

<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
    <Card.Root>
        <Card.Header
            class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
            <Card.Title class="text-sm font-medium">Totale Soci</Card.Title>
            <Users class="h-4 w-4 text-muted-foreground" />
        </Card.Header>
        <Card.Content>
            <div class="text-2xl font-bold">{stats.total}</div>
            <p class="text-xs text-muted-foreground mt-1">Soci registrati</p>
        </Card.Content>
    </Card.Root>

    <Card.Root>
        <Card.Header
            class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
            <Card.Title class="text-sm font-medium">Attivi</Card.Title>
            <UserCheck class="h-4 w-4 text-green-600" />
        </Card.Header>
        <Card.Content>
            <div class="text-2xl font-bold">{stats.active}</div>
            <p class="text-xs text-muted-foreground mt-1">
                <span class="text-green-600"
                    >{Math.round((stats.active / stats.total) * 100)}%</span
                > del totale
            </p>
        </Card.Content>
    </Card.Root>

    <Card.Root>
        <Card.Header
            class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
            <Card.Title class="text-sm font-medium">Non Paganti</Card.Title>
            <UserX class="h-4 w-4 text-red-600" />
        </Card.Header>
        <Card.Content>
            <div class="text-2xl font-bold">{stats.unpaid}</div>
            <p class="text-xs text-muted-foreground mt-1">
                <span class="text-red-600"
                    >{Math.round((stats.unpaid / stats.total) * 100)}%</span
                > del totale
            </p>
        </Card.Content>
    </Card.Root>

    <Card.Root>
        <Card.Header
            class="flex flex-row items-center justify-between space-y-0 pb-2"
        >
            <Card.Title class="text-sm font-medium"
                >Esclusione Deliberata</Card.Title
            >
            <Clock class="h-4 w-4 text-yellow-600" />
        </Card.Header>
        <Card.Content>
            <div class="text-2xl font-bold">{stats.exclusionDeliberated}</div>
            <p class="text-xs text-muted-foreground mt-1">
                <span class="text-yellow-600"
                    >{Math.round(
                        (stats.exclusionDeliberated / stats.total) * 100,
                    )}%</span
                > del totale
            </p>
        </Card.Content>
    </Card.Root>
</div>
