<script lang="ts">
    import Header from "$lib/components/shared/header.svelte";
    import * as Card from "$lib/components/ui/card";
    import { Anchor, Wrench, Ship, Calendar } from "@lucide/svelte";
</script>

<Header />

<!-- Main Content -->
<main class="container mx-auto px-4 py-8">
    <div class="mb-8">
        <h2 class="text-3xl font-bold tracking-tight">Servizi</h2>
        <p class="text-muted-foreground mt-2">
            Esplora i servizi e le strutture disponibili presso il Circolo
            Nautico Cattolica
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
                    <Card.Title>Servizi di Ormeggio</Card.Title>
                </div>
            </Card.Header>
            <Card.Content>
                <p class="text-muted-foreground">
                    Strutture di ormeggio sicure con accesso 24/7 e supporto di
                    manutenzione.
                </p>
            </Card.Content>
        </Card.Root>

        <Card.Root>
            <Card.Header>
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-primary/10 rounded-lg">
                        <Wrench class="h-6 w-6 text-primary" />
                    </div>
                    <Card.Title>Manutenzione</Card.Title>
                </div>
            </Card.Header>
            <Card.Content>
                <p class="text-muted-foreground">
                    Servizi professionali di manutenzione e riparazione
                    imbarcazioni da parte di tecnici certificati.
                </p>
            </Card.Content>
        </Card.Root>

        <Card.Root>
            <Card.Header>
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-primary/10 rounded-lg">
                        <Ship class="h-6 w-6 text-primary" />
                    </div>
                    <Card.Title>Noleggio Imbarcazioni</Card.Title>
                </div>
            </Card.Header>
            <Card.Content>
                <p class="text-muted-foreground">
                    Noleggio di barche a vela e motoscafi per gite giornaliere o
                    escursioni prolungate.
                </p>
            </Card.Content>
        </Card.Root>

        <Card.Root>
            <Card.Header>
                <div class="flex items-center gap-3">
                    <div class="p-2 bg-primary/10 rounded-lg">
                        <Calendar class="h-6 w-6 text-primary" />
                    </div>
                    <Card.Title>Eventi</Card.Title>
                </div>
            </Card.Header>
            <Card.Content>
                <p class="text-muted-foreground">
                    Regate regolari, eventi sociali e corsi di vela durante
                    tutto l'anno.
                </p>
            </Card.Content>
        </Card.Root>
    </div>
</main>
