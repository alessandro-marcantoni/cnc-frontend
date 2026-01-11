<script lang="ts">
    import * as Dialog from "$lib/components/ui/dialog";
    import * as Select from "$lib/components/ui/select";
    import * as InputGroup from "$lib/components/ui/input-group";
    import { Button } from "$lib/components/ui/button";
    import { Label } from "$lib/components/ui/label";
    import DatePicker from "$lib/components/ui/date-picker.svelte";
    import { RefreshCw } from "@lucide/svelte";
    import type { Season } from "$model/shared/season";
    import type { CalendarDate } from "@internationalized/date";

    interface Props {
        open: boolean;
        memberName: string;
        facilityName: string;
        facilityIdentifier: string;
        currentSeason: Season;
        availableSeasons: Season[];
        selectedSeason: string | undefined;
        isWholeSeason: boolean;
        startDate: CalendarDate | undefined;
        endDate: CalendarDate | undefined;
        price: string;
        suggestedPrice: number;
        onClose: () => void;
        onSubmit: () => void;
        onSeasonChange: (season: string | undefined) => void;
        onSeasonToggle: (wholeSeason: boolean) => void;
        onStartDateChange: (date: CalendarDate | undefined) => void;
        onEndDateChange: (date: CalendarDate | undefined) => void;
        onPriceChange: (price: string) => void;
    }

    let {
        open = $bindable(),
        memberName,
        facilityName,
        facilityIdentifier,
        currentSeason,
        availableSeasons,
        selectedSeason = $bindable(),
        isWholeSeason = $bindable(),
        startDate = $bindable(),
        endDate = $bindable(),
        price = $bindable(),
        suggestedPrice,
        onClose,
        onSubmit,
        onSeasonChange,
        onSeasonToggle,
        onStartDateChange,
        onEndDateChange,
        onPriceChange,
    }: Props = $props();

    // Filter seasons to only include current and future seasons
    const futureSeasons = $derived(
        availableSeasons.filter((season) => season.name >= currentSeason.name),
    );

    const isValid = $derived(
        selectedSeason !== undefined &&
            selectedSeason !== "" &&
            startDate !== undefined &&
            endDate !== undefined &&
            price !== "" &&
            parseFloat(price) > 0,
    );
</script>

<Dialog.Root bind:open>
    <Dialog.Content class="sm:max-w-125">
        <Dialog.Header>
            <Dialog.Title class="flex items-center gap-2">
                <RefreshCw class="h-5 w-5" />
                Rinnova Affitto Servizio
            </Dialog.Title>
            <Dialog.Description>
                Rinnova l'affitto di {facilityName} - {facilityIdentifier} per {memberName}
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

            <!-- Season Toggle -->
            <div class="grid gap-2">
                <Label for="season-trigger">Periodo</Label>
                <div class="flex gap-2">
                    <Button
                        variant={isWholeSeason ? "default" : "outline"}
                        size="sm"
                        class="flex-1"
                        onclick={() => onSeasonToggle(true)}
                        type="button"
                    >
                        Intera Stagione
                    </Button>
                    <Button
                        variant={!isWholeSeason ? "default" : "outline"}
                        size="sm"
                        class="flex-1"
                        onclick={() => onSeasonToggle(false)}
                        type="button"
                    >
                        Date Personalizzate
                    </Button>
                </div>
            </div>

            <!-- Date Inputs -->
            <div class="grid grid-cols-2 gap-2">
                <!-- Start Date -->
                <div class="grid gap-2">
                    <DatePicker
                        id="start-date"
                        label="Data Inizio *"
                        value={startDate}
                        onValueChange={onStartDateChange}
                        disabled={isWholeSeason}
                        placeholder="Seleziona data inizio"
                    />
                </div>

                <!-- End Date -->
                <div class="grid gap-2">
                    <DatePicker
                        id="end-date"
                        label="Data Fine *"
                        value={endDate}
                        onValueChange={onEndDateChange}
                        disabled={isWholeSeason}
                        placeholder="Seleziona data fine"
                    />
                </div>
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
                    Prezzo suggerito: €{suggestedPrice.toFixed(2)}
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
