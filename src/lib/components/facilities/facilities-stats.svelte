<script lang="ts">
    import * as Card from "$lib/components/ui/card";
    import {
        facilitiesByType,
        availableFacilities,
        rentedFacilitiesByType,
    } from "$lib/data/repositories";
    import { CheckCircle2, XCircle, TrendingUp, Layers } from "@lucide/svelte";

    // Calculate occupancy rate
    let occupancyRate = $derived(
        $facilitiesByType.length > 0
            ? Math.round(
                  ($rentedFacilitiesByType.length / $facilitiesByType.length) *
                      100,
              )
            : 0,
    );
</script>

<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
    <!-- Total Facilities -->
    <Card.Root>
        <Card.Content>
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-muted-foreground mb-1">
                        Totale Strutture
                    </p>
                    <p class="text-3xl font-bold">
                        {$facilitiesByType.length}
                    </p>
                </div>
                <div class="rounded-full bg-primary/10 p-3">
                    <Layers class="h-6 w-6 text-primary" />
                </div>
            </div>
        </Card.Content>
    </Card.Root>

    <!-- Available -->
    <Card.Root>
        <Card.Content>
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-muted-foreground mb-1">
                        Disponibili
                    </p>
                    <p class="text-3xl font-bold text-green-700">
                        {$availableFacilities.length}
                    </p>
                </div>
                <div class="rounded-full bg-green-100 p-3">
                    <CheckCircle2 class="h-6 w-6 text-green-700" />
                </div>
            </div>
        </Card.Content>
    </Card.Root>

    <!-- Rented -->
    <Card.Root>
        <Card.Content>
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-muted-foreground mb-1">
                        Occupate
                    </p>
                    <p class="text-3xl font-bold text-orange-700">
                        {$rentedFacilitiesByType.length}
                    </p>
                </div>
                <div class="rounded-full bg-orange-100 p-3">
                    <XCircle class="h-6 w-6 text-orange-700" />
                </div>
            </div>
        </Card.Content>
    </Card.Root>

    <!-- Occupancy Rate -->
    <Card.Root>
        <Card.Content>
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-muted-foreground mb-1">
                        Tasso Occupazione
                    </p>
                    <p class="text-3xl font-bold text-blue-700">
                        {occupancyRate}%
                    </p>
                </div>
                <div class="rounded-full bg-blue-100 p-3">
                    <TrendingUp class="h-6 w-6 text-blue-700" />
                </div>
            </div>
        </Card.Content>
    </Card.Root>
</div>
