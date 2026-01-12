<script lang="ts">
    import * as Dialog from "$lib/components/ui/dialog";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import { Checkbox } from "$lib/components/ui/checkbox";
    import * as Select from "$lib/components/ui/select";
    import DatePicker from "$lib/components/ui/date-picker.svelte";
    import { Separator } from "$lib/components/ui/separator";
    import PhoneInput from "$lib/components/ui/phone-input/phone-input.svelte";
    import * as InputGroup from "$lib/components/ui/input-group";
    import {
        UserPlus,
        Plus,
        Trash2,
        MapPin,
        Phone,
        Smartphone,
        House,
        ChevronRight,
        ChevronLeft,
        Check,
        CreditCard,
    } from "@lucide/svelte";
    import type { CalendarDate } from "@internationalized/date";
    import type {
        E164Number,
        CountryCode,
    } from "$lib/components/ui/phone-input/types";
    import { getSeasons } from "$lib/data/repositories/seasons-repository";

    type Props = {
        open?: boolean;
        onOpenChange?: (open: boolean) => void;
    };

    let { open = $bindable(false), onOpenChange }: Props = $props();

    // Step management
    let currentStep = $state(1);
    const totalSteps = 4;

    const steps = [
        { number: 1, title: "Anagrafica", icon: UserPlus },
        { number: 2, title: "Indirizzi", icon: MapPin },
        { number: 3, title: "Telefoni", icon: Phone },
        { number: 4, title: "Tessera", icon: CreditCard },
    ];

    // Form state
    let firstName = $state("");
    let lastName = $state("");
    let email = $state("");
    let birthDate = $state<CalendarDate | undefined>(undefined);

    // Membership state
    let addMembershipNow = $state(false);
    let selectedSeason = $state<string | undefined>(undefined);
    let membershipPrice = $state(130.0);

    // TODO: Replace with actual seasons from API
    const availableSeasons = getSeasons().map((season) => ({
        value: season.name.toString(),
        label: season.name.toString(),
    }));

    // Address type
    type Address = {
        country: string;
        city: string;
        street: string;
        number: string;
        zipCode: string;
    };

    // Phone number type
    type PhoneNumberEntry = {
        type: "mobile" | "landline";
        mobileNumber: E164Number | null;
        mobileCountry: CountryCode | null;
        landlineNumber: string;
    };

    let addresses = $state<Address[]>([
        { country: "", city: "", street: "", number: "", zipCode: "" },
    ]);

    let phoneNumbers = $state<PhoneNumberEntry[]>([
        {
            type: "mobile",
            mobileNumber: null,
            mobileCountry: "IT",
            landlineNumber: "",
        },
    ]);

    function addAddress() {
        addresses = [
            ...addresses,
            { country: "", city: "", street: "", number: "", zipCode: "" },
        ];
    }

    function removeAddress(index: number) {
        addresses = addresses.filter((_, i) => i !== index);
    }

    function addPhoneNumber() {
        phoneNumbers = [
            ...phoneNumbers,
            {
                type: "mobile",
                mobileNumber: null,
                mobileCountry: "IT",
                landlineNumber: "",
            },
        ];
    }

    function removePhoneNumber(index: number) {
        phoneNumbers = phoneNumbers.filter((_, i) => i !== index);
    }

    function resetForm() {
        currentStep = 1;
        firstName = "";
        lastName = "";
        email = "";
        birthDate = undefined;
        addMembershipNow = false;
        selectedSeason = undefined;
        addresses = [
            { country: "", city: "", street: "", number: "", zipCode: "" },
        ];
        phoneNumbers = [
            {
                type: "mobile",
                mobileNumber: null,
                mobileCountry: "IT",
                landlineNumber: "",
            },
        ];
    }

    function handleOpenChange(newOpen: boolean) {
        open = newOpen;
        if (!newOpen) {
            resetForm();
        }
        onOpenChange?.(newOpen);
    }

    async function handleSubmit() {
        // TODO: Implement API call to create member
        console.log("Creating member:", {
            firstName,
            lastName,
            email,
            birthDate,
            addresses,
            phoneNumbers,
            membership: addMembershipNow ? { season: selectedSeason } : null,
        });

        // Close dialog and reset form
        handleOpenChange(false);
    }

    // Step-specific validation
    const isStep1Valid = $derived(
        firstName.trim() !== "" &&
            lastName.trim() !== "" &&
            email.trim() !== "" &&
            birthDate !== undefined,
    );

    const isStep2Valid = $derived(
        addresses.length > 0 &&
            addresses.every(
                (addr) =>
                    addr.country.trim() !== "" &&
                    addr.city.trim() !== "" &&
                    addr.street.trim() !== "" &&
                    addr.number.trim() !== "" &&
                    addr.zipCode.trim() !== "",
            ),
    );

    const isStep3Valid = $derived(
        phoneNumbers.length > 0 &&
            phoneNumbers.every(
                (phone) =>
                    (phone.type === "mobile" && phone.mobileNumber !== null) ||
                    (phone.type === "landline" &&
                        phone.landlineNumber.trim() !== ""),
            ),
    );

    const isStep4Valid = $derived(
        !addMembershipNow || (addMembershipNow && selectedSeason !== undefined),
    );

    const canProceed = $derived(() => {
        switch (currentStep) {
            case 1:
                return isStep1Valid;
            case 2:
                return isStep2Valid;
            case 3:
                return isStep3Valid;
            case 4:
                return isStep4Valid;
            default:
                return false;
        }
    });

    function nextStep() {
        if (currentStep < totalSteps && canProceed()) {
            currentStep++;
        }
    }

    function previousStep() {
        if (currentStep > 1) {
            currentStep--;
        }
    }
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
    <Dialog.Content class="max-w-3xl max-h-[90vh] overflow-y-auto">
        <Dialog.Header>
            <Dialog.Title class="flex items-center gap-2">
                <UserPlus class="h-5 w-5" />
                Aggiungi Nuovo Socio
            </Dialog.Title>
            <Dialog.Description>
                Completa tutti i passaggi per aggiungere un nuovo socio.
            </Dialog.Description>
        </Dialog.Header>

        <!-- Step Indicator -->
        <div class="mb-6">
            <div class="flex justify-between items-center mb-2">
                {#each steps as step}
                    <div class="flex flex-col items-center flex-1">
                        <div
                            class="w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors {currentStep ===
                            step.number
                                ? 'bg-primary text-primary-foreground'
                                : currentStep > step.number
                                  ? 'bg-primary/80 text-primary-foreground'
                                  : 'bg-muted text-muted-foreground'}"
                        >
                            {#if currentStep > step.number}
                                <Check class="h-5 w-5" />
                            {:else}
                                <step.icon class="h-5 w-5" />
                            {/if}
                        </div>
                        <span
                            class="text-xs mt-2 text-center hidden sm:block {currentStep ===
                            step.number
                                ? 'text-foreground font-semibold'
                                : 'text-muted-foreground'}"
                        >
                            {step.title}
                        </span>
                    </div>
                    {#if step.number < totalSteps}
                        <div
                            class="flex-1 h-0.5 mx-2 mb-5 {currentStep >
                            step.number
                                ? 'bg-primary'
                                : 'bg-muted'}"
                        ></div>
                    {/if}
                {/each}
            </div>
        </div>

        <form
            onsubmit={(e) => {
                e.preventDefault();
                if (currentStep === totalSteps) {
                    handleSubmit();
                }
            }}
            class="space-y-6"
        >
            <!-- Step 1: Personal Information -->
            {#if currentStep === 1}
                <div class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-2">
                            <Label for="firstName">Nome *</Label>
                            <Input
                                id="firstName"
                                bind:value={firstName}
                                placeholder="Mario"
                                required
                            />
                        </div>

                        <div class="space-y-2">
                            <Label for="lastName">Cognome *</Label>
                            <Input
                                id="lastName"
                                bind:value={lastName}
                                placeholder="Rossi"
                                required
                            />
                        </div>
                    </div>

                    <div class="space-y-2">
                        <Label for="email">Email *</Label>
                        <Input
                            id="email"
                            type="email"
                            bind:value={email}
                            placeholder="mario.rossi@example.com"
                            required
                        />
                    </div>

                    <DatePicker
                        id="birthDate"
                        bind:value={birthDate}
                        label="Data di Nascita *"
                        placeholder="Seleziona data"
                    />
                </div>
            {/if}

            <!-- Step 2: Addresses -->
            {#if currentStep === 2}
                <div class="space-y-4">
                    <div class="flex items-center justify-between">
                        <h3
                            class="text-sm font-semibold flex items-center gap-2"
                        >
                            <MapPin class="h-4 w-4" />
                            Indirizzi
                        </h3>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onclick={addAddress}
                        >
                            <Plus class="h-4 w-4 mr-1" />
                            Aggiungi Indirizzo
                        </Button>
                    </div>

                    {#each addresses as address, index (index)}
                        <div class="space-y-3 p-4 border rounded-lg relative">
                            {#if addresses.length > 1}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    class="absolute top-2 right-2 h-8 w-8"
                                    onclick={() => removeAddress(index)}
                                >
                                    <Trash2 class="h-4 w-4 text-destructive" />
                                </Button>
                            {/if}

                            <div class="grid grid-cols-2 gap-3">
                                <div class="space-y-2">
                                    <Label for="country-{index}">Paese *</Label>
                                    <Input
                                        id="country-{index}"
                                        bind:value={address.country}
                                        placeholder="Italia"
                                        required
                                    />
                                </div>

                                <div class="space-y-2">
                                    <Label for="city-{index}">Città *</Label>
                                    <Input
                                        id="city-{index}"
                                        bind:value={address.city}
                                        placeholder="Roma"
                                        required
                                    />
                                </div>
                            </div>

                            <div class="grid grid-cols-3 gap-3">
                                <div class="col-span-2 space-y-2">
                                    <Label for="street-{index}">Via *</Label>
                                    <Input
                                        id="street-{index}"
                                        bind:value={address.street}
                                        placeholder="Via Roma"
                                        required
                                    />
                                </div>

                                <div class="space-y-2">
                                    <Label for="number-{index}">Numero *</Label>
                                    <Input
                                        id="number-{index}"
                                        bind:value={address.number}
                                        placeholder="123"
                                        required
                                    />
                                </div>
                            </div>

                            <div class="space-y-2">
                                <Label for="zipCode-{index}">CAP *</Label>
                                <Input
                                    id="zipCode-{index}"
                                    bind:value={address.zipCode}
                                    placeholder="00100"
                                    required
                                />
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}

            <!-- Step 3: Phone Numbers -->
            {#if currentStep === 3}
                <div class="space-y-4">
                    <div class="flex items-center justify-between">
                        <h3
                            class="text-sm font-semibold flex items-center gap-2"
                        >
                            <Phone class="h-4 w-4" />
                            Numeri di Telefono
                        </h3>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onclick={addPhoneNumber}
                        >
                            <Plus class="h-4 w-4 mr-1" />
                            Aggiungi Numero
                        </Button>
                    </div>

                    {#each phoneNumbers as phone, index (index)}
                        <div class="space-y-3 p-4 border rounded-lg relative">
                            {#if phoneNumbers.length > 1}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    class="absolute top-2 right-2 h-8 w-8"
                                    onclick={() => removePhoneNumber(index)}
                                >
                                    <Trash2 class="h-4 w-4 text-destructive" />
                                </Button>
                            {/if}

                            <div class="space-y-2">
                                <Label for="phone-type-{index}">Tipo *</Label>
                                <Select.Root
                                    type="single"
                                    bind:value={phone.type}
                                >
                                    <Select.Trigger
                                        id="phone-type-{index}"
                                        class="w-full"
                                    >
                                        {#if phone.type === "mobile"}
                                            <span
                                                class="flex items-center gap-2"
                                            >
                                                <Smartphone class="h-4 w-4" />
                                                Cellulare
                                            </span>
                                        {:else}
                                            <span
                                                class="flex items-center gap-2"
                                            >
                                                <House class="h-4 w-4" />
                                                Fisso
                                            </span>
                                        {/if}
                                    </Select.Trigger>
                                    <Select.Content>
                                        <Select.Item value="mobile">
                                            <span
                                                class="flex items-center gap-2"
                                            >
                                                <Smartphone class="h-4 w-4" />
                                                Cellulare
                                            </span>
                                        </Select.Item>
                                        <Select.Item value="landline">
                                            <span
                                                class="flex items-center gap-2"
                                            >
                                                <House class="h-4 w-4" />
                                                Fisso
                                            </span>
                                        </Select.Item>
                                    </Select.Content>
                                </Select.Root>
                            </div>

                            {#if phone.type === "mobile"}
                                <div class="space-y-2">
                                    <Label for="mobile-number-{index}"
                                        >Numero di Cellulare *</Label
                                    >
                                    <PhoneInput
                                        placeholder="333 123 4567"
                                        bind:country={phone.mobileCountry}
                                        bind:value={phone.mobileNumber}
                                    />
                                </div>
                            {:else}
                                <div class="space-y-2">
                                    <Label for="landline-number-{index}"
                                        >Numero Fisso *</Label
                                    >
                                    <Input
                                        id="landline-number-{index}"
                                        bind:value={phone.landlineNumber}
                                        placeholder="06 1234 5678"
                                        required
                                    />
                                </div>
                            {/if}
                        </div>
                    {/each}
                </div>
            {/if}

            <!-- Step 4: Membership -->
            {#if currentStep === 4}
                <div class="space-y-4">
                    <h3 class="text-sm font-semibold">Tessera</h3>

                    <div class="space-y-4">
                        <div class="flex items-center space-x-2">
                            <Checkbox
                                id="add-membership"
                                checked={addMembershipNow}
                                onCheckedChange={(checked) => {
                                    addMembershipNow = checked === true;
                                }}
                            />
                            <Label for="add-membership" class="cursor-pointer">
                                Aggiungi tessera adesso
                            </Label>
                        </div>

                        {#if addMembershipNow}
                            <div class="space-y-2">
                                <Label for="season">Stagione *</Label>
                                <Select.Root
                                    type="single"
                                    bind:value={selectedSeason}
                                >
                                    <Select.Trigger id="season" class="w-full">
                                        {selectedSeason
                                            ? selectedSeason
                                            : "Seleziona stagione"}
                                    </Select.Trigger>
                                    <Select.Content>
                                        {#each availableSeasons as season}
                                            <Select.Item value={season.value}>
                                                {season.label}
                                            </Select.Item>
                                        {/each}
                                    </Select.Content>
                                </Select.Root>
                            </div>
                            <!-- Price Input -->
                            <div class="grid gap-2">
                                <label for="price" class="text-sm font-medium">
                                    Prezzo<span class="text-destructive">*</span
                                    >
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
                                        bind:value={membershipPrice}
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
                        {/if}

                        {#if !addMembershipNow}
                            <p class="text-sm text-muted-foreground">
                                Potrai aggiungere la tessera in seguito dalla
                                pagina del socio.
                            </p>
                        {/if}
                    </div>
                </div>
            {/if}

            <Separator />

            <!-- Navigation Buttons -->
            <Dialog.Footer class="flex justify-between sm:justify-between">
                <div class="flex gap-2">
                    {#if currentStep > 1}
                        <Button
                            type="button"
                            variant="outline"
                            onclick={previousStep}
                        >
                            <ChevronLeft class="h-4 w-4 mr-1" />
                            Indietro
                        </Button>
                    {:else}
                        <Button
                            type="button"
                            variant="outline"
                            onclick={() => handleOpenChange(false)}
                        >
                            Annulla
                        </Button>
                    {/if}
                </div>

                <div>
                    {#if currentStep < totalSteps}
                        <Button
                            type="button"
                            onclick={nextStep}
                            disabled={!canProceed()}
                        >
                            Avanti
                            <ChevronRight class="h-4 w-4 ml-1" />
                        </Button>
                    {:else}
                        <Button type="submit" disabled={!canProceed()}>
                            <UserPlus class="h-4 w-4 mr-2" />
                            Aggiungi Socio
                        </Button>
                    {/if}
                </div>
            </Dialog.Footer>
        </form>
    </Dialog.Content>
</Dialog.Root>
