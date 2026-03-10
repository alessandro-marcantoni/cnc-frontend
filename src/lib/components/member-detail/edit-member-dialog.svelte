<script lang="ts">
    import * as Dialog from "$lib/components/ui/dialog";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import * as Alert from "$lib/components/ui/alert";
    import {
        Loader2,
        AlertCircle,
        UserPen,
        Plus,
        Trash2,
    } from "@lucide/svelte";
    import type { MemberDetail } from "$model/members/member-detail";
    import DatePicker from "$lib/components/ui/date-picker.svelte";
    import type { CalendarDate } from "@internationalized/date";
    import { parseDate } from "@internationalized/date";
    import { updateMember } from "$lib/data/repositories";

    interface Props {
        open: boolean;
        member: MemberDetail;
        season: number;
        onClose: () => void;
        onSuccess: (updatedMember: MemberDetail) => void;
    }

    let {
        open = $bindable(),
        member,
        season,
        onClose,
        onSuccess,
    }: Props = $props();

    // Form state - initialized with defaults, will be set in $effect
    let firstName = $state("");
    let lastName = $state("");
    let email = $state("");
    let taxCode = $state("");
    let birthDate = $state<CalendarDate | undefined>(undefined);
    let phoneNumbers = $state<Array<{ number: string }>>([{ number: "" }]);
    let addresses = $state<
        Array<{
            country: string;
            city: string;
            zipCode: string;
            street: string;
            number: string;
        }>
    >([{ country: "", city: "", zipCode: "", street: "", number: "" }]);

    let isSubmitting = $state(false);
    let errorMessage = $state<string | null>(null);

    // Validation
    const isValid = $derived(
        firstName.trim() !== "" &&
            lastName.trim() !== "" &&
            birthDate !== null &&
            phoneNumbers.some((p) => p.number.trim() !== "") &&
            addresses.some(
                (a) =>
                    a.country.trim() !== "" ||
                    a.city.trim() !== "" ||
                    a.street.trim() !== "" ||
                    a.number.trim() !== "",
            ),
    );

    function handleClose() {
        open = false;
        onClose();
    }

    function addPhoneNumber() {
        phoneNumbers = [...phoneNumbers, { number: "" }];
    }

    function removePhoneNumber(index: number) {
        phoneNumbers = phoneNumbers.filter((_, i) => i !== index);
        // Ensure at least one phone number field
        if (phoneNumbers.length === 0) {
            phoneNumbers = [{ number: "" }];
        }
    }

    function addAddress() {
        addresses = [
            ...addresses,
            { country: "", city: "", zipCode: "", street: "", number: "" },
        ];
    }

    function removeAddress(index: number) {
        addresses = addresses.filter((_, i) => i !== index);
        // Ensure at least one address field
        if (addresses.length === 0) {
            addresses = [
                { country: "", city: "", zipCode: "", street: "", number: "" },
            ];
        }
    }

    async function handleSubmit() {
        if (!isValid) return;

        isSubmitting = true;
        errorMessage = null;

        try {
            // Filter out empty phone numbers
            const validPhoneNumbers = phoneNumbers.filter(
                (p) => p.number.trim() !== "",
            );

            // Filter out empty addresses
            const validAddresses = addresses.filter(
                (a) =>
                    a.country.trim() !== "" ||
                    a.city.trim() !== "" ||
                    a.street.trim() !== "" ||
                    a.number.trim() !== "",
            );

            // Format birthdate as YYYY-MM-DD
            if (!birthDate) {
                errorMessage = "Data di nascita è obbligatoria";
                return;
            }
            const birthDateStr = `${birthDate.year.toString().padStart(4, "0")}-${birthDate.month.toString().padStart(2, "0")}-${birthDate.day.toString().padStart(2, "0")}`;

            const updatedMember = await updateMember(
                member.id,
                {
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    birthDate: birthDateStr,
                    email: email.trim() || undefined,
                    taxCode: taxCode.trim() || undefined,
                    phoneNumbers: validPhoneNumbers,
                    addresses: validAddresses,
                },
                season,
            );

            onSuccess(updatedMember);
            handleClose();
        } catch (error) {
            console.error("Failed to update member:", error);
            errorMessage =
                error instanceof Error
                    ? error.message
                    : "Si è verificato un errore";
        } finally {
            isSubmitting = false;
        }
    }

    // Reset form when dialog opens
    $effect(() => {
        if (open) {
            firstName = member.firstName;
            lastName = member.lastName;
            email = member.email || "";
            taxCode = member.taxCode || "";
            // Convert DateValue to CalendarDate if needed
            birthDate = member.birthDate as CalendarDate;
            phoneNumbers =
                member.phoneNumbers.length > 0
                    ? [...member.phoneNumbers]
                    : [{ number: "" }];
            addresses =
                member.addresses.length > 0
                    ? member.addresses.map((addr) => ({
                          country: addr.country,
                          city: addr.city,
                          zipCode: addr.zipCode,
                          street: addr.street,
                          number: addr.number,
                      }))
                    : [
                          {
                              country: "",
                              city: "",
                              zipCode: "",
                              street: "",
                              number: "",
                          },
                      ];
            errorMessage = null;
        }
    });
</script>

<Dialog.Root bind:open>
    <Dialog.Content class="max-h-[90vh] overflow-y-auto sm:max-w-150">
        <Dialog.Header>
            <Dialog.Title class="flex items-center gap-2">
                <UserPen class="h-5 w-5" />
                Modifica Informazioni Socio
            </Dialog.Title>
            <Dialog.Description>
                Aggiorna le informazioni personali del socio. I campi
                contrassegnati con * sono obbligatori.
            </Dialog.Description>
        </Dialog.Header>

        <div class="grid gap-4 py-4">
            <!-- Personal Information -->
            <div class="grid gap-4">
                <div class="grid grid-cols-2 gap-4">
                    <div class="grid gap-2">
                        <Label for="firstName">
                            Nome <span class="text-destructive">*</span>
                        </Label>
                        <Input
                            id="firstName"
                            bind:value={firstName}
                            placeholder="Nome"
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    <div class="grid gap-2">
                        <Label for="lastName">
                            Cognome <span class="text-destructive">*</span>
                        </Label>
                        <Input
                            id="lastName"
                            bind:value={lastName}
                            placeholder="Cognome"
                            required
                            disabled={isSubmitting}
                        />
                    </div>
                </div>

                <div class="grid gap-2">
                    <Label for="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        bind:value={email}
                        placeholder="email@esempio.it"
                        disabled={isSubmitting}
                    />
                </div>

                <div class="grid gap-2">
                    <Label for="taxCode">Codice Fiscale</Label>
                    <Input
                        id="taxCode"
                        bind:value={taxCode}
                        placeholder="RSSMRA80A01H501U"
                        class="uppercase"
                        disabled={isSubmitting}
                    />
                </div>

                <DatePicker
                    id="birthDate"
                    bind:value={birthDate}
                    label="Data di Nascita *"
                    placeholder="Seleziona data"
                    disabled={isSubmitting}
                />
            </div>

            <!-- Phone Numbers -->
            <div class="grid gap-3">
                <div class="flex items-center justify-between">
                    <Label
                        >Numeri di Telefono <span class="text-destructive"
                            >*</span
                        ></Label
                    >
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onclick={addPhoneNumber}
                        disabled={isSubmitting}
                    >
                        <Plus class="h-3 w-3 mr-1" />
                        Aggiungi
                    </Button>
                </div>

                {#each phoneNumbers as phone, index (index)}
                    <div class="flex gap-2">
                        <Input
                            bind:value={phone.number}
                            placeholder="+39 123 456 7890"
                            disabled={isSubmitting}
                            class="flex-1"
                        />
                        {#if phoneNumbers.length > 1}
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onclick={() => removePhoneNumber(index)}
                                disabled={isSubmitting}
                            >
                                <Trash2 class="h-4 w-4" />
                            </Button>
                        {/if}
                    </div>
                {/each}
                <p class="text-xs text-muted-foreground">
                    Almeno un numero di telefono è richiesto
                </p>
            </div>

            <!-- Addresses -->
            <div class="grid gap-3">
                <div class="flex items-center justify-between">
                    <Label
                        >Indirizzi <span class="text-destructive">*</span
                        ></Label
                    >
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onclick={addAddress}
                        disabled={isSubmitting}
                    >
                        <Plus class="h-3 w-3 mr-1" />
                        Aggiungi
                    </Button>
                </div>

                {#each addresses as address, index (index)}
                    <div class="grid gap-3 p-3 border rounded-lg">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-sm font-medium"
                                >Indirizzo {index + 1}</span
                            >
                            {#if addresses.length > 1}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onclick={() => removeAddress(index)}
                                    disabled={isSubmitting}
                                >
                                    <Trash2 class="h-4 w-4" />
                                </Button>
                            {/if}
                        </div>

                        <div class="grid grid-cols-2 gap-3">
                            <Input
                                bind:value={address.street}
                                placeholder="Via/Piazza"
                                disabled={isSubmitting}
                            />
                            <Input
                                bind:value={address.number}
                                placeholder="Numero"
                                disabled={isSubmitting}
                            />
                        </div>

                        <div class="grid grid-cols-3 gap-3">
                            <Input
                                bind:value={address.zipCode}
                                placeholder="CAP"
                                disabled={isSubmitting}
                            />
                            <Input
                                bind:value={address.city}
                                placeholder="Città"
                                disabled={isSubmitting}
                                class="col-span-2"
                            />
                        </div>

                        <Input
                            bind:value={address.country}
                            placeholder="Paese"
                            disabled={isSubmitting}
                        />
                    </div>
                {/each}
                <p class="text-xs text-muted-foreground">
                    Almeno un indirizzo è richiesto
                </p>
            </div>
        </div>

        {#if errorMessage}
            <Alert.Root variant="destructive">
                <AlertCircle class="h-4 w-4" />
                <Alert.Title>Errore</Alert.Title>
                <Alert.Description>{errorMessage}</Alert.Description>
            </Alert.Root>
        {/if}

        <Dialog.Footer>
            <Button
                variant="outline"
                onclick={handleClose}
                disabled={isSubmitting}
            >
                Annulla
            </Button>
            <Button onclick={handleSubmit} disabled={!isValid || isSubmitting}>
                {#if isSubmitting}
                    <Loader2 class="mr-2 h-4 w-4 animate-spin" />
                    Salvataggio...
                {:else}
                    Salva Modifiche
                {/if}
            </Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
