<script lang="ts">
    import * as Dialog from "$lib/components/ui/dialog";
    import * as Select from "$lib/components/ui/select";
    import * as Popover from "$lib/components/ui/popover";
    import * as Command from "$lib/components/ui/command";
    import * as InputGroup from "$lib/components/ui/input-group";

    import { Button } from "$lib/components/ui/button";
    import DatePicker from "$lib/components/ui/date-picker.svelte";
    import {
        ChevronsUpDown,
        Check,
        AlertCircle,
        Loader2,
    } from "@lucide/svelte";
    import type { FacilityType } from "$model/facilities/facility-type";
    import type { FacilityWithStatus } from "$model/facilities/facility-with-status";
    import type { CalendarDate } from "@internationalized/date";

    interface Props {
        open: boolean;
        memberName: string;
        facilityTypes: FacilityType[];
        availableFacilities: FacilityWithStatus[];
        selectedFacilityType: number | null;
        selectedFacilityId: number | null;
        isWholeSeason: boolean;
        startDate: CalendarDate | undefined;
        endDate: CalendarDate | undefined;
        price: string;
        facilityTypeComboboxOpen: boolean;
        errorMessage?: string | null;
        isSubmitting?: boolean;
        onClose: () => void;
        onSubmit: () => void;
        onFacilityTypeSelect: (typeId: number) => void;
        onFacilityIdChange: (facilityId: number | null) => void;
        onSeasonToggle: (wholeSeason: boolean) => void;
        onStartDateChange: (date: CalendarDate | undefined) => void;
        onEndDateChange: (date: CalendarDate | undefined) => void;
        onPriceChange: (price: string) => void;
        onComboboxToggle: (open: boolean) => void;
    }

    let {
        open = $bindable(),
        memberName,
        facilityTypes,
        availableFacilities,
        selectedFacilityType = $bindable(),
        selectedFacilityId = $bindable(),
        isWholeSeason = $bindable(),
        startDate = $bindable(),
        endDate = $bindable(),
        price = $bindable(),
        facilityTypeComboboxOpen = $bindable(),
        errorMessage = null,
        isSubmitting = false,
        onClose,
        onSubmit,
        onFacilityTypeSelect,
        onFacilityIdChange,
        onSeasonToggle,
        onStartDateChange,
        onEndDateChange,
        onPriceChange,
        onComboboxToggle,
    }: Props = $props();

    const facilityTypeOptions = $derived(
        facilityTypes.map((type) => ({
            value: type.id,
            label: type.name,
            description: type.description,
        })),
    );

    const selectedFacilityTypeName = $derived(
        selectedFacilityType
            ? facilityTypes.find((t) => t.id === selectedFacilityType)?.name
            : null,
    );

    const selectedFacility = $derived(
        selectedFacilityId
            ? availableFacilities.find((f) => f.id === selectedFacilityId)
            : null,
    );
</script>

<Dialog.Root bind:open>
    <Dialog.Content class="sm:max-w-125">
        <Dialog.Header>
            <Dialog.Title>Affitta Servizio</Dialog.Title>
            <Dialog.Description>
                Seleziona il servizio da affittare per {memberName}
            </Dialog.Description>
        </Dialog.Header>

        <div class="grid gap-4 py-4">
            <!-- Facility Type Selection -->
            <div class="grid gap-2">
                <label class="text-sm font-medium" for="facility-type-trigger">
                    Tipo di Servizio <span class="text-destructive">*</span>
                </label>
                <Popover.Root bind:open={facilityTypeComboboxOpen}>
                    <Popover.Trigger id="facility-type-trigger">
                        <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={facilityTypeComboboxOpen}
                            class="w-full justify-between"
                        >
                            {selectedFacilityTypeName ||
                                "Seleziona tipo di servizio..."}
                            <ChevronsUpDown
                                class="ml-2 h-4 w-4 shrink-0 opacity-50"
                            />
                        </Button>
                    </Popover.Trigger>
                    <Popover.Content class="w-full p-0">
                        <Command.Root>
                            <Command.Input
                                placeholder="Cerca tipo di servizio..."
                            />
                            <Command.Empty>Nessun tipo trovato.</Command.Empty>
                            <Command.List>
                                <Command.Group>
                                    {#each facilityTypeOptions as option (option.value)}
                                        <Command.Item
                                            value={option.label}
                                            onSelect={() => {
                                                onFacilityTypeSelect(
                                                    option.value,
                                                );
                                                onFacilityIdChange(null);
                                                onComboboxToggle(false);
                                            }}
                                        >
                                            <Check
                                                class={selectedFacilityType ===
                                                option.value
                                                    ? "mr-2 h-4 w-4 opacity-100"
                                                    : "mr-2 h-4 w-4 opacity-0"}
                                            />
                                            <div>
                                                <div>{option.label}</div>
                                                <div
                                                    class="text-xs text-muted-foreground"
                                                >
                                                    {option.description}
                                                </div>
                                            </div>
                                        </Command.Item>
                                    {/each}
                                </Command.Group>
                            </Command.List>
                        </Command.Root>
                    </Popover.Content>
                </Popover.Root>
            </div>

            <!-- Specific Facility Selection -->
            {#if selectedFacilityType}
                <div class="grid gap-2">
                    <label class="text-sm font-medium" for="facility-trigger">
                        Servizio Specifico <span class="text-destructive"
                            >*</span
                        >
                    </label>
                    <Select.Root
                        type="single"
                        onValueChange={(value) => {
                            onFacilityIdChange(value ? parseInt(value) : null);
                        }}
                    >
                        <Select.Trigger class="w-full" id="facility-trigger">
                            {#if selectedFacilityId}
                                {availableFacilities.find(
                                    (f) => f.id === selectedFacilityId,
                                )?.identifier || "Seleziona servizio..."}
                            {:else}
                                Seleziona servizio...
                            {/if}
                        </Select.Trigger>
                        <Select.Content>
                            <Select.Group>
                                <Select.Label>Servizi Disponibili</Select.Label>
                                {#if availableFacilities.length > 0}
                                    {#each availableFacilities as facility (facility.id)}
                                        <Select.Item
                                            value={facility.id.toString()}
                                        >
                                            {facility.identifier} - €{facility.suggestedPrice.toFixed(
                                                2,
                                            )}
                                        </Select.Item>
                                    {/each}
                                {:else}
                                    <Select.Item value="" disabled>
                                        Nessun servizio disponibile
                                    </Select.Item>
                                {/if}
                            </Select.Group>
                        </Select.Content>
                    </Select.Root>
                </div>
            {/if}

            <!-- Season Toggle -->
            <div class="grid gap-2">
                <label class="text-sm font-medium" for="season-trigger"
                    >Periodo</label
                >
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
                <label for="price" class="text-sm font-medium">
                    Prezzo<span class="text-destructive">*</span>
                </label>
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
                {#if selectedFacility}
                    <p class="text-xs text-muted-foreground">
                        Prezzo suggerito: €{selectedFacility.suggestedPrice.toFixed(
                            2,
                        )}
                    </p>
                {/if}
            </div>
        </div>

        <!-- Error Message -->
        {#if errorMessage}
            <div
                class="rounded-lg border border-destructive/50 bg-destructive/10 p-3"
            >
                <div class="flex items-start gap-2">
                    <AlertCircle
                        class="h-4 w-4 text-destructive mt-0.5 shrink-0"
                    />
                    <p class="text-sm text-destructive">{errorMessage}</p>
                </div>
            </div>
        {/if}

        <Dialog.Footer>
            <Button variant="outline" onclick={onClose} disabled={isSubmitting}>
                Annulla
            </Button>
            <Button
                onclick={onSubmit}
                disabled={!selectedFacilityId ||
                    !startDate ||
                    !endDate ||
                    !price ||
                    isSubmitting}
            >
                {#if isSubmitting}
                    <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                    Affitto in corso...
                {:else}
                    Conferma Affitto
                {/if}
            </Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
