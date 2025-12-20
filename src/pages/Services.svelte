<script lang="ts">
    import Header from "$lib/components/shared/header.svelte";
    import * as Card from "$lib/components/ui/card";
    import { Anchor, Wrench, Ship, Calendar } from "@lucide/svelte";
</script>

<Header />

<!-- Main Content -->
<main class="container mx-auto px-4 py-8">
    <div class="mb-8">
        <h2 class="text-3xl font-bold tracking-tight">Services</h2>
        <p class="text-muted-foreground mt-2">
            Explore the services and facilities available at Circolo Nautico Cattolica
        </p>
    </div>

    <!-- Services Grid -->
    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card.Root>
            <Card.Header>
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-primary/10 rounded-lg">
                        <Anchor class="h-6 w-6 text-primary" />
                    </div>
                    <Card.Title>Mooring Services</Card.Title>
                </div>
            </Card.Header>
            <Card.Content>
                <p class="text-muted-foreground">
                    Secure mooring facilities with 24/7 access and maintenance support.
                </p>
            </Card.Content>
        </Card.Root>

        <Card.Root>
            <Card.Header>
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-primary/10 rounded-lg">
                        <Wrench class="h-6 w-6 text-primary" />
                    </div>
                    <Card.Title>Maintenance</Card.Title>
                </div>
            </Card.Header>
            <Card.Content>
                <p class="text-muted-foreground">
                    Professional boat maintenance and repair services by certified technicians.
                </p>
            </Card.Content>
        </Card.Root>

        <Card.Root>
            <Card.Header>
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-primary/10 rounded-lg">
                        <Ship class="h-6 w-6 text-primary" />
                    </div>
                    <Card.Title>Boat Rentals</Card.Title>
                </div>
            </Card.Header>
            <Card.Content>
                <p class="text-muted-foreground">
                    Rent sailboats and motorboats for day trips or extended excursions.
                </p>
            </Card.Content>
        </Card.Root>

        <Card.Root>
            <Card.Header>
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-primary/10 rounded-lg">
                        <Calendar class="h-6 w-6 text-primary" />
                    </div>
                    <Card.Title>Events</Card.Title>
                </div>
            </Card.Header>
            <Card.Content>
                <p class="text-muted-foreground">
                    Regular regattas, social events, and sailing courses throughout the year.
                </p>
            </Card.Content>
        </Card.Root>
    </div>
</main>
