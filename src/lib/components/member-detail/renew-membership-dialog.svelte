<script lang="ts">
    import * as Dialog from "$lib/components/ui/dialog";
    import * as Select from "$lib/components/ui/select";
    import * as InputGroup from "$lib/components/ui/input-group";
    import { Button } from "$lib/components/ui/button";
    import { Label } from "$lib/components/ui/label";
    import { RefreshCw } from "@lucide/svelte";
    import type { Season } from "$model/shared/season";

    interface Props {
        open: boolean;
        memberName: string;
        currentSeason: Season;
        availableSeasons: Season[];
        selectedSeason: string | undefined;
        price: string;
        onClose: () => void;
        onSubmit: () => void;
        onSeasonChange: (season: string | undefined) => void;
        onPriceChange: (price: string) => void;
    }

    let {
        open = $bindable(),
        memberName,
        currentSeason,
        availableSeasons,
        selectedSeason = $bindable(),
        price = $bindable(),
        onClose,
        onSubmit,
        onSeasonChange,
        onPriceChange,
    }: Props = $props();

    // Filter seasons to only include current and future seasons
    const futureSeasons = $derived(
        availableSeasons.filter((season) => season.name >= currentSeason.name),
    );

    const isValid = $derived(
        selectedSeason !== undefined &&
            selectedSeason !== "" &&
            price !== "" &&
            parseFloat(price) > 0,
    );
</script>

<Dialog.Root bind:open>
    <Dialog.Content class="sm:max-w-125">
        <Dialog.Header>
            <Dialog.Title class="flex items-center gap-2">
                <RefreshCw class="h-5 w-5" />
                Rinnova Tessera
            </Dialog.Title>
            <Dialog.Description>
                Rinnova la tessera per {memberName}
            </Dialog.Description>
        </Dialog.Header>

        <div class="grid gap-4 py-4">
            <!-- Season Selection -->
            <div class="grid gap-2">
                <Label for="season">
                    Stagione <span class="text-destructive">*</span>
                </Label>
                <Select.Root
                    type="single"
                    value={selectedSeason}
                    onValueChange={onSeasonChange}
                >
                    <Select.Trigger id="season" class="w-full">
                        {selectedSeason || "Seleziona stagione"}
                    </Select.Trigger>
                    <Select.Content>
                        <Select.Group>
                            <Select.Label>Stagioni Disponibili</Select.Label>
                            {#each futureSeasons as season (season.name)}
                                <Select.Item value={season.name.toString()}>
                                    Stagione {season.name}
                                </Select.Item>
                            {/each}
                        </Select.Group>
                    </Select.Content>
                </Select.Root>
                <p class="text-xs text-muted-foreground">
                    Puoi rinnovare solo per la stagione corrente o stagioni
                    future.
                </p>
            </div>

            <!-- Price Input -->
            <div class="grid gap-2">
                <Label for="price">
                    Prezzo <span class="text-destructive">*</span>
                </Label>
                <InputGroup.Root>
                    <InputGroup.Addon>
                        <InputGroup.Text>€</InputGroup.Text>
                    </InputGroup.Addon>
                    <InputGroup.Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={price}
                        oninput={(e) => onPriceChange(e.currentTarget.value)}
                        placeholder="0.00"
                    />
                    <InputGroup.Addon align="inline-end">
                        <InputGroup.Text>EUR</InputGroup.Text>
                    </InputGroup.Addon>
                </InputGroup.Root>
                <p class="text-xs text-muted-foreground">
                    Prezzo suggerito: €130.00
                </p>
            </div>
        </div>

        <Dialog.Footer>
            <Button variant="outline" onclick={onClose}>Annulla</Button>
            <Button onclick={onSubmit} disabled={!isValid}>
                <RefreshCw class="h-4 w-4 mr-2" />
                Conferma Rinnovo
            </Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
