<script lang="ts">
    import { onMount } from "svelte";
    import Header from "$lib/components/shared/header.svelte";
    import * as Card from "$lib/components/ui/card";
    import * as Select from "$lib/components/ui/select";
    import * as Dialog from "$lib/components/ui/dialog";
    import * as Popover from "$lib/components/ui/popover";
    import * as Command from "$lib/components/ui/command";
    import * as InputGroup from "$lib/components/ui/input-group";
    import { Button } from "$lib/components/ui/button";
    import { Badge } from "$lib/components/ui/badge";
    import { Separator } from "$lib/components/ui/separator";
    import { Input } from "$lib/components/ui/input";
    import {
        RefreshCw,
        CircleAlert,
        ArrowLeft,
        User,
        Mail,
        Phone,
        MapPin,
        Calendar,
        CreditCard,
        Anchor,
        CircleCheck,
        CircleX,
        Clock,
        Ship,
        UsersRound,
        Plus,
        ChevronsUpDown,
        Check,
    } from "@lucide/svelte";
    import * as Empty from "$lib/components/ui/empty";
    import {
        loadMemberDetail,
        memberDetail,
        isLoadingMemberDetail,
        memberDetailError,
    } from "$lib/data/repositories/member-detail-repository";
    import {
        loadRentedFacilities,
        rentedFacilities,
        isLoadingRentedFacilities,
        rentedFacilitiesError,
    } from "$lib/data/repositories/rented-facilities-repository";
    import {
        getSeasons,
        getCurrentSeason,
    } from "$lib/data/repositories/seasons-repository";
    import {
        loadFacilitiesCatalog,
        facilitiesCatalog,
    } from "$lib/data/repositories/facilities-catalog-repository";
    import {
        loadFacilitiesByType,
        facilitiesByType,
    } from "$lib/data/repositories/facilities-by-type-repository";
    import type { Season } from "$model/shared/season";
    import type { FacilityType } from "$model/facilities/facility-type";
    import type { FacilityWithStatus } from "$model/facilities/facility-with-status";

    let { route } = $props();
    let memberId = $derived(parseInt(route.result.path.params.id, 10));
    let isValidId = $derived(!isNaN(memberId) && memberId > 0);

    // Get available seasons
    const seasons = getSeasons();
    const currentSeason = getCurrentSeason();

    // Selected season state
    let selectedSeason = $state<Season | null>(currentSeason);
    let selectedSeasonValue = $state<string>(
        currentSeason ? currentSeason.name.toString() : "",
    );

    let member = $derived(isValidId ? $memberDetail(memberId) : null);
    let memberLoading = $derived(
        isValidId ? $isLoadingMemberDetail(memberId) : false,
    );
    let memberError = $derived(
        !isValidId ? "ID membro non valido" : $memberDetailError(memberId),
    );

    let facilities = $derived(isValidId ? $rentedFacilities(memberId) : []);
    let facilitiesLoading = $derived(
        isValidId ? $isLoadingRentedFacilities(memberId) : false,
    );
    let facilitiesError = $derived(
        isValidId ? $rentedFacilitiesError(memberId) : null,
    );

    // Combined loading and error states
    let loading = $derived(memberLoading || facilitiesLoading);
    let error = $derived(memberError || facilitiesError);

    // Rent facility dialog state
    let isRentDialogOpen = $state(false);
    let selectedFacilityType = $state<number | null>(null);
    let selectedFacilityId = $state<number | null>(null);
    let isWholeSeason = $state(true);
    let bookingStartDate = $state("");
    let bookingEndDate = $state("");
    let bookingPrice = $state("");
    let facilityTypeComboboxOpen = $state(false);

    // Load facility catalog on mount
    onMount(() => {
        loadFacilitiesCatalog();
    });

    // Load facilities when type is selected
    $effect(() => {
        if (selectedFacilityType) {
            loadFacilitiesByType(selectedFacilityType);
        }
    });

    // Helper function to format date for input[type="date"]
    function formatDateForInput(date: Date): string {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    }

    // Load member detail and facilities on mount
    onMount(async () => {
        if (!isValidId) {
            console.error("Invalid member ID:", memberId);
            return;
        }

        try {
            const season = selectedSeasonValue || undefined;
            await Promise.all([
                loadMemberDetail(memberId, false, season),
                loadRentedFacilities(memberId, false, season),
            ]);
        } catch (error) {
            console.error("Failed to load data:", error);
        }
    });

    async function handleRefresh() {
        if (!isValidId) {
            return;
        }

        try {
            const season = selectedSeasonValue || undefined;
            await Promise.all([
                loadMemberDetail(memberId, true, season),
                loadRentedFacilities(memberId, true, season),
            ]);
        } catch (error) {
            console.error("Failed to refresh data:", error);
        }
    }

    // Watch for season changes and reload data
    $effect(() => {
        if (!isValidId) return;

        if (selectedSeasonValue) {
            const season = seasons.find(
                (s) => s.name.toString() === selectedSeasonValue,
            );
            if (season) {
                selectedSeason = season;
                Promise.all([
                    loadMemberDetail(memberId, true, selectedSeasonValue),
                    loadRentedFacilities(memberId, true, selectedSeasonValue),
                ]).catch((error) => {
                    console.error("Failed to load data for season:", error);
                });
            }
        }
    });

    function goBack() {
        window.history.pushState({}, "", "/");
        window.dispatchEvent(new PopStateEvent("popstate"));
    }

    function getStatusBadgeVariant(status: string) {
        switch (status.toUpperCase()) {
            case "ACTIVE":
                return "default";
            case "UNPAID":
                return "destructive";
            case "EXCLUSION_DELIBERATED":
                return "destructive";
            case "EXCLUDED":
                return "secondary";
            default:
                return "outline";
        }
    }

    function formatCurrency(amount: number, currency: string): string {
        return new Intl.NumberFormat("it-IT", {
            style: "currency",
            currency: currency,
        }).format(amount);
    }

    function formatDate(date: Date): string {
        return new Intl.DateTimeFormat("it-IT", {
            year: "numeric",
            month: "long",
            day: "numeric",
        }).format(date);
    }

    function formatDateTime(date: Date): string {
        return new Intl.DateTimeFormat("it-IT", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(date);
    }

    function calculateAge(birthDate: Date): number {
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (
            monthDiff < 0 ||
            (monthDiff === 0 && today.getDate() < birthDate.getDate())
        ) {
            age--;
        }
        return age;
    }

    function isFacilityActive(expiresAt: Date): boolean {
        return new Date(expiresAt) > new Date();
    }

    // Rent facility dialog functions
    function openRentDialog() {
        selectedFacilityType = null;
        selectedFacilityId = null;
        facilityTypeComboboxOpen = false;
        isWholeSeason = true;

        // Set default dates
        const today = new Date();
        const currentSeasonData = currentSeason;

        bookingStartDate = formatDateForInput(today);
        bookingEndDate = currentSeasonData
            ? formatDateForInput(currentSeasonData.endsAt)
            : "";

        // Reset price
        bookingPrice = "";

        isRentDialogOpen = true;
    }

    // Update dates when season toggle changes
    $effect(() => {
        if (isRentDialogOpen) {
            if (isWholeSeason) {
                const currentSeasonData = currentSeason;
                if (currentSeasonData) {
                    bookingStartDate = formatDateForInput(
                        currentSeasonData.startsAt,
                    );
                    bookingEndDate = formatDateForInput(
                        currentSeasonData.endsAt,
                    );
                }
            } else {
                const today = new Date();
                const currentSeasonData = currentSeason;
                bookingStartDate = formatDateForInput(today);
                bookingEndDate = currentSeasonData
                    ? formatDateForInput(currentSeasonData.endsAt)
                    : "";
            }
        }
    });

    // Update price when facility is selected
    $effect(() => {
        if (selectedFacilityId && $facilitiesByType.length > 0) {
            const facility = $facilitiesByType.find(
                (f) => f.id === selectedFacilityId,
            );
            if (facility) {
                bookingPrice = facility.suggestedPrice.toString();
            }
        }
    });

    function handleRentSubmit() {
        if (!selectedFacilityId || !memberId) return;

        // TODO: Implement booking logic here
        console.log("Booking facility:", {
            facilityId: selectedFacilityId,
            memberId: memberId,
            isWholeSeason,
            startDate: bookingStartDate,
            endDate: bookingEndDate,
            price: parseFloat(bookingPrice),
        });

        // Close dialog
        isRentDialogOpen = false;
    }

    // Computed values for dialog
    const facilityTypeOptions = $derived(
        $facilitiesCatalog.map((type: FacilityType) => ({
            value: type.id,
            label: type.name,
            description: type.description,
        })),
    );

    const availableFacilitiesForType = $derived(
        $facilitiesByType.filter((f) => !f.isRented),
    );

    const selectedFacility = $derived(
        selectedFacilityId
            ? $facilitiesByType.find((f) => f.id === selectedFacilityId)
            : null,
    );

    const selectedFacilityTypeName = $derived(
        selectedFacilityType
            ? $facilitiesCatalog.find((t) => t.id === selectedFacilityType)
                  ?.name
            : null,
    );

    function getStatusLabel(status: string): string {
        switch (status.toUpperCase()) {
            case "ACTIVE":
                return "Attivo";
            case "UNPAID":
                return "Non Pagato";
            case "EXCLUSION_DELIBERATED":
                return "Esclusione Deliberata";
            case "EXCLUDED":
                return "Escluso";
            default:
                return status;
        }
    }
</script>

<Header showAddMember={false} />

<main class="container mx-auto px-4 py-8">
    <!-- Back Button -->
    <div class="mb-6">
        <Button variant="ghost" size="sm" onclick={goBack}>
            <ArrowLeft class="h-4 w-4 mr-2" />
            Torna alla Lista
        </Button>
    </div>

    {#if error}
        <!-- Error State -->
        <div
            class="flex flex-col items-center justify-center min-h-100 text-center"
        >
            <CircleAlert class="h-12 w-12 text-destructive" />
            <div>
                <h2 class="text-xl font-semibold mb-2">
                    Errore nel caricamento
                </h2>
                <p class="text-muted-foreground mb-4">{error}</p>
                <Button onclick={handleRefresh}>
                    <RefreshCw class="h-4 w-4 mr-2" />
                    Riprova
                </Button>
            </div>
        </div>
    {:else if loading && !member}
        <!-- Loading State -->
        <div
            class="flex flex-col items-center justify-center min-h-100 text-center"
        >
            <div class="animate-spin">
                <RefreshCw class="h-8 w-8 text-muted-foreground" />
            </div>
            <p class="text-muted-foreground">Caricamento dettagli socio...</p>
        </div>
    {:else if member}
        <!-- Header with Member Name, Season Selector, and Refresh Button -->
        <div class="flex items-center justify-between mb-8">
            <div>
                <h1 class="text-4xl font-bold tracking-tight">
                    {member.firstName}
                    {member.lastName}
                </h1>
            </div>
            <div class="flex gap-2 items-center">
                <!-- Season Selector -->
                <div class="flex items-center gap-2">
                    <Calendar class="h-4 w-4 text-muted-foreground" />
                    <Select.Root type="single" bind:value={selectedSeasonValue}>
                        <Select.Trigger class="w-40">
                            {#if selectedSeasonValue}
                                Stagione {selectedSeasonValue}
                            {:else}
                                Seleziona stagione
                            {/if}
                        </Select.Trigger>
                        <Select.Content>
                            <Select.Group>
                                <Select.Label>Stagioni Disponibili</Select.Label
                                >
                                {#each seasons as season (season.name)}
                                    <Select.Item value={season.name.toString()}>
                                        Stagione {season.name}
                                    </Select.Item>
                                {/each}
                            </Select.Group>
                        </Select.Content>
                    </Select.Root>
                    {#if selectedSeason}
                        <span class="text-xs text-muted-foreground">
                            ({new Date(
                                selectedSeason.startsAt,
                            ).toLocaleDateString("it-IT", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                            })} - {new Date(
                                selectedSeason.endsAt,
                            ).toLocaleDateString("it-IT", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                            })})
                        </span>
                    {/if}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onclick={handleRefresh}
                    disabled={loading}
                >
                    <RefreshCw
                        class={loading
                            ? "h-4 w-4 mr-2 animate-spin"
                            : "h-4 w-4 mr-2"}
                    />
                    Aggiorna
                </Button>
            </div>
        </div>

        <div class="grid gap-6 lg:grid-cols-3">
            <!-- Left Column: Personal Information -->
            <div class="lg:col-span-1 space-y-6">
                <!-- Personal Details Card -->
                <Card.Root>
                    <Card.Header>
                        <Card.Title class="flex items-center gap-2">
                            <User class="h-5 w-5" />
                            Informazioni Personali
                        </Card.Title>
                    </Card.Header>
                    <Card.Content class="space-y-4">
                        <div>
                            <div class="flex items-center gap-2 mb-1">
                                <Mail class="h-4 w-4 text-muted-foreground" />
                                <span
                                    class="text-sm font-medium text-muted-foreground"
                                    >Email</span
                                >
                            </div>
                            <p class="text-sm">{member.email}</p>
                        </div>

                        <Separator />

                        <div>
                            <div class="flex items-center gap-2 mb-1">
                                <Calendar
                                    class="h-4 w-4 text-muted-foreground"
                                />
                                <span
                                    class="text-sm font-medium text-muted-foreground"
                                    >Data di Nascita</span
                                >
                            </div>
                            <p class="text-sm">
                                {formatDate(member.birthDate)} ({calculateAge(
                                    member.birthDate,
                                )} anni)
                            </p>
                        </div>

                        <Separator />

                        <div>
                            <div class="flex items-center gap-2 mb-2">
                                <Phone class="h-4 w-4 text-muted-foreground" />
                                <span
                                    class="text-sm font-medium text-muted-foreground"
                                    >Numeri di Telefono</span
                                >
                            </div>
                            {#if member.phoneNumbers && member.phoneNumbers.length > 0}
                                <div class="space-y-1">
                                    {#each member.phoneNumbers as phone}
                                        <p class="text-sm">{phone.number}</p>
                                    {/each}
                                </div>
                            {:else}
                                <p class="text-sm text-muted-foreground">
                                    Nessun numero di telefono
                                </p>
                            {/if}
                        </div>

                        <Separator />

                        <div>
                            <div class="flex items-center gap-2 mb-2">
                                <MapPin class="h-4 w-4 text-muted-foreground" />
                                <span
                                    class="text-sm font-medium text-muted-foreground"
                                    >Indirizzi</span
                                >
                            </div>
                            {#if member.addresses && member.addresses.length > 0}
                                <div class="space-y-3">
                                    {#each member.addresses as address}
                                        <div class="text-sm">
                                            <p>
                                                {address.street}
                                                {address.number}
                                            </p>
                                            <p>
                                                {address.zipCode}
                                                {address.city}
                                            </p>
                                            <p class="text-muted-foreground">
                                                {address.country}
                                            </p>
                                        </div>
                                    {/each}
                                </div>
                            {:else}
                                <p class="text-sm text-muted-foreground">
                                    Nessun indirizzo registrato
                                </p>
                            {/if}
                        </div>
                    </Card.Content>
                </Card.Root>

                <!-- Current Membership Card -->
                {#if member.memberships && member.memberships.length > 0}
                    {@const currentMembership = member.memberships[0]}
                    <Card.Root>
                        <Card.Header>
                            <Card.Title class="flex items-center gap-2"
                                ><CreditCard />Tessera Corrente</Card.Title
                            >
                        </Card.Header>
                        <Card.Content class="space-y-4">
                            <div class="flex items-center justify-between mb-4">
                                <span class="text-sm font-medium">Stato</span>
                                <Badge
                                    variant={getStatusBadgeVariant(
                                        currentMembership.status,
                                    )}
                                >
                                    {getStatusLabel(currentMembership.status)}
                                </Badge>
                            </div>

                            <Separator />

                            <div>
                                <p class="text-sm text-muted-foreground mb-1">
                                    Numero Tessera
                                </p>
                                <p class="text-sm font-medium">
                                    #{currentMembership.number}
                                </p>
                            </div>

                            <Separator />

                            <div>
                                <p class="text-sm text-muted-foreground mb-1">
                                    Periodo di Validità
                                </p>
                                <p class="text-sm font-medium">
                                    {formatDate(
                                        new Date(
                                            currentMembership.validFrom.toString(),
                                        ),
                                    )} - {formatDate(
                                        new Date(
                                            currentMembership.expiresAt.toString(),
                                        ),
                                    )}
                                </p>
                            </div>

                            {#if currentMembership.payment}
                                <Separator />

                                <div>
                                    <p
                                        class="text-sm text-muted-foreground mb-1"
                                    >
                                        Pagamento
                                    </p>
                                    <p class="text-sm font-medium">
                                        {formatCurrency(
                                            currentMembership.payment.amount,
                                            currentMembership.payment.currency,
                                        )}
                                    </p>
                                    {#if currentMembership.payment.paidAt}
                                        <p
                                            class="text-xs text-muted-foreground mt-1"
                                        >
                                            Pagato il {formatDate(
                                                new Date(
                                                    currentMembership.payment
                                                        .paidAt,
                                                ),
                                            )}
                                        </p>
                                    {/if}
                                </div>
                            {/if}
                        </Card.Content>
                    </Card.Root>
                {:else}
                    <Card.Root>
                        <Card.Content class="p-6">
                            <Empty.Root>
                                <Empty.Header>
                                    <Empty.Media variant="icon">
                                        <UsersRound class="h-6 w-6" />
                                    </Empty.Media>
                                    <Empty.Title
                                        >Nessuna Tessera Trovata</Empty.Title
                                    >
                                    <Empty.Description>
                                        Questa persona non era socia nella
                                        stagione {selectedSeasonValue ||
                                            currentSeason.name}.
                                    </Empty.Description>
                                </Empty.Header>
                            </Empty.Root>
                        </Card.Content>
                    </Card.Root>
                {/if}
            </div>

            <!-- Right Column: Facilities and Membership History -->
            <div class="lg:col-span-2 space-y-6">
                <!-- Rented Facilities Card -->
                <Card.Root>
                    <Card.Header>
                        <div class="flex items-center justify-between">
                            <div>
                                <Card.Title class="flex items-center gap-2">
                                    <Anchor class="h-5 w-5" />
                                    Servizi Affittati
                                    {#if facilities && facilities.length > 0}
                                        <Badge variant="secondary">
                                            {facilities.length}
                                            {facilities.length === 1
                                                ? "servizio"
                                                : "servizi"}
                                        </Badge>
                                    {/if}
                                </Card.Title>
                                <Card.Description>
                                    Elenco dei servizi attualmente affittati
                                </Card.Description>
                            </div>
                            <div class="flex items-center gap-2">
                                <Button size="sm" onclick={openRentDialog}>
                                    <Plus class="h-4 w-4 mr-2" />
                                    Affitta Servizio
                                </Button>
                            </div>
                        </div>
                    </Card.Header>
                    <Card.Content>
                        {#if facilitiesLoading}
                            <div class="flex items-center justify-center py-8">
                                <div class="animate-spin">
                                    <RefreshCw
                                        class="h-6 w-6 text-muted-foreground"
                                    />
                                </div>
                                <p class="ml-3 text-muted-foreground">
                                    Caricamento servizi...
                                </p>
                            </div>
                        {:else if facilitiesError}
                            <div
                                class="flex items-center justify-center py-8 text-center"
                            >
                                <CircleAlert
                                    class="h-6 w-6 text-destructive mr-2"
                                />
                                <p class="text-sm text-muted-foreground">
                                    Errore nel caricamento dei servizi
                                </p>
                            </div>
                        {:else if facilities && facilities.length > 0}
                            <div class="space-y-4">
                                {#each facilities as facility}
                                    {@const isActive = isFacilityActive(
                                        facility.expiresAt,
                                    )}
                                    <div
                                        class="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                                    >
                                        <!-- Facility Header -->
                                        <div
                                            class="flex items-start justify-between gap-4"
                                        >
                                            <div class="flex-1">
                                                <div
                                                    class="flex items-start justify-between mb-2"
                                                >
                                                    <h4
                                                        class="font-semibold text-lg"
                                                    >
                                                        {facility.facilityIdentifier}
                                                    </h4>
                                                    {#if isActive}
                                                        <Badge
                                                            variant="default"
                                                            class="ml-2"
                                                        >
                                                            <CircleCheck
                                                                class="h-3 w-3 mr-1"
                                                            />
                                                            Attivo
                                                        </Badge>
                                                    {:else}
                                                        <Badge
                                                            variant="secondary"
                                                            class="ml-2"
                                                        >
                                                            <CircleX
                                                                class="h-3 w-3 mr-1"
                                                            />
                                                            Scaduto
                                                        </Badge>
                                                    {/if}
                                                </div>
                                                <p
                                                    class="text-sm text-muted-foreground mb-1"
                                                >
                                                    {facility.facilityName}
                                                </p>
                                                <p
                                                    class="text-sm text-muted-foreground"
                                                >
                                                    {facility.facilityTypeDescription}
                                                </p>
                                            </div>
                                        </div>

                                        <!-- Facility Dates -->
                                        <div
                                            class="grid grid-cols-2 gap-4 mt-4 text-sm"
                                        >
                                            <div>
                                                <p
                                                    class="text-muted-foreground mb-1"
                                                >
                                                    Data Inizio
                                                </p>
                                                <p class="font-medium">
                                                    {formatDateTime(
                                                        facility.rentedAt,
                                                    )}
                                                </p>
                                            </div>
                                            <div>
                                                <p
                                                    class="text-muted-foreground mb-1"
                                                >
                                                    Data Scadenza
                                                </p>
                                                <p class="font-medium">
                                                    {formatDate(
                                                        facility.expiresAt,
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        <!-- Boat Info -->
                                        {#if facility.boatInfo}
                                            <Separator class="my-4" />
                                            <div
                                                class="bg-muted/50 rounded-lg p-3"
                                            >
                                                <div
                                                    class="flex items-center gap-2 mb-2"
                                                >
                                                    <Ship
                                                        class="h-4 w-4 text-muted-foreground"
                                                    />
                                                    <span
                                                        class="text-sm font-medium"
                                                        >Informazioni
                                                        Imbarcazione</span
                                                    >
                                                </div>
                                                <div
                                                    class="grid grid-cols-3 gap-3 text-sm"
                                                >
                                                    <div>
                                                        <p
                                                            class="text-muted-foreground mb-1"
                                                        >
                                                            Nome
                                                        </p>
                                                        <p class="font-medium">
                                                            {facility.boatInfo
                                                                .name}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p
                                                            class="text-muted-foreground mb-1"
                                                        >
                                                            Lunghezza
                                                        </p>
                                                        <p class="font-medium">
                                                            {facility.boatInfo
                                                                .lengthMeters}m
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p
                                                            class="text-muted-foreground mb-1"
                                                        >
                                                            Larghezza
                                                        </p>
                                                        <p class="font-medium">
                                                            {facility.boatInfo
                                                                .widthMeters}m
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        {/if}

                                        <!-- Payment Info -->
                                        {#if facility.payment}
                                            <Separator class="my-4" />
                                            <div
                                                class="bg-muted/50 rounded-lg p-3"
                                            >
                                                <div
                                                    class="flex items-center gap-2 mb-3"
                                                >
                                                    <CreditCard
                                                        class="h-4 w-4 text-muted-foreground"
                                                    />
                                                    <span
                                                        class="text-sm font-medium"
                                                        >Dettagli Pagamento</span
                                                    >
                                                </div>
                                                <div
                                                    class="grid grid-cols-2 gap-3 text-sm"
                                                >
                                                    <div>
                                                        <p
                                                            class="text-muted-foreground mb-1"
                                                        >
                                                            Importo
                                                        </p>
                                                        <p
                                                            class="font-semibold text-base"
                                                        >
                                                            {formatCurrency(
                                                                facility.payment
                                                                    .amount,
                                                                facility.payment
                                                                    .currency,
                                                            )}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p
                                                            class="text-muted-foreground mb-1"
                                                        >
                                                            Data Pagamento
                                                        </p>
                                                        <p class="font-medium">
                                                            {facility.payment
                                                                .paidAt
                                                                ? formatDateTime(
                                                                      new Date(
                                                                          facility
                                                                              .payment
                                                                              .paidAt,
                                                                      ),
                                                                  )
                                                                : "Non specificato"}
                                                        </p>
                                                    </div>
                                                    {#if facility.payment.paymentMethod}
                                                        <div>
                                                            <p
                                                                class="text-muted-foreground mb-1"
                                                            >
                                                                Metodo
                                                            </p>
                                                            <p
                                                                class="font-medium"
                                                            >
                                                                {facility
                                                                    .payment
                                                                    .paymentMethod}
                                                            </p>
                                                        </div>
                                                    {/if}
                                                    {#if facility.payment.transactionRef}
                                                        <div>
                                                            <p
                                                                class="text-muted-foreground mb-1"
                                                            >
                                                                Riferimento
                                                            </p>
                                                            <p
                                                                class="font-medium font-mono text-xs"
                                                            >
                                                                {facility
                                                                    .payment
                                                                    .transactionRef}
                                                            </p>
                                                        </div>
                                                    {/if}
                                                </div>
                                            </div>
                                        {:else}
                                            <Separator class="my-4" />
                                            <div
                                                class="flex items-center gap-2 text-sm text-muted-foreground py-2"
                                            >
                                                <Clock class="h-4 w-4" />
                                                <span
                                                    >Pagamento non ancora
                                                    effettuato</span
                                                >
                                            </div>
                                        {/if}
                                    </div>
                                {/each}
                            </div>
                        {:else}
                            <div
                                class="flex flex-col items-center justify-center py-12 text-center"
                            >
                                <Anchor
                                    class="h-12 w-12 text-muted-foreground mb-4"
                                />
                                <p>Nessun servizio affittato</p>
                            </div>
                        {/if}
                    </Card.Content>
                </Card.Root>

                <!-- Membership History Card -->
                {#if member.memberships && member.memberships.length > 1}
                    <Card.Root>
                        <Card.Header>
                            <Card.Title>Storico Tessere</Card.Title>
                            <Card.Description>
                                Tessere precedenti del socio
                            </Card.Description>
                        </Card.Header>
                        <Card.Content>
                            <div class="space-y-3">
                                {#each member.memberships.slice(1) as membership}
                                    <div
                                        class="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                                    >
                                        <div>
                                            <div
                                                class="flex items-center justify-between mb-2"
                                            >
                                                <span class="font-medium"
                                                    >Tessera #{membership.number}</span
                                                >
                                                <Badge
                                                    variant={getStatusBadgeVariant(
                                                        membership.status,
                                                    )}
                                                >
                                                    {getStatusLabel(
                                                        membership.status,
                                                    )}
                                                </Badge>
                                            </div>
                                            <p
                                                class="text-sm text-muted-foreground"
                                            >
                                                {formatDate(
                                                    new Date(
                                                        membership.validFrom.toString(),
                                                    ),
                                                )} - {formatDate(
                                                    new Date(
                                                        membership.expiresAt.toString(),
                                                    ),
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                {/each}
                            </div>
                        </Card.Content>
                    </Card.Root>
                {/if}
            </div>
        </div>
    {/if}
</main>

<!-- Rent Facility Dialog -->
<Dialog.Root bind:open={isRentDialogOpen}>
    <Dialog.Content class="sm:max-w-125">
        <Dialog.Header>
            <Dialog.Title>Affitta Servizio</Dialog.Title>
            <Dialog.Description>
                Seleziona il servizio da affittare per {member?.firstName}
                {member?.lastName}
            </Dialog.Description>
        </Dialog.Header>

        <div class="grid gap-4 py-4">
            <!-- Facility Type Selection -->
            <div class="grid gap-2">
                <label class="text-sm font-medium">
                    Tipo di Servizio <span class="text-destructive">*</span>
                </label>
                <Popover.Root bind:open={facilityTypeComboboxOpen}>
                    <Popover.Trigger>
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
                                                selectedFacilityType =
                                                    option.value;
                                                selectedFacilityId = null;
                                                facilityTypeComboboxOpen = false;
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
                    <label class="text-sm font-medium">
                        Servizio Specifico <span class="text-destructive"
                            >*</span
                        >
                    </label>
                    <Select.Root
                        type="single"
                        onValueChange={(value) => {
                            selectedFacilityId = value ? parseInt(value) : null;
                        }}
                    >
                        <Select.Trigger class="w-full">
                            {#if selectedFacilityId}
                                {availableFacilitiesForType.find(
                                    (f) => f.id === selectedFacilityId,
                                )?.identifier || "Seleziona servizio..."}
                            {:else}
                                Seleziona servizio...
                            {/if}
                        </Select.Trigger>
                        <Select.Content>
                            <Select.Group>
                                <Select.Label>Servizi Disponibili</Select.Label>
                                {#if availableFacilitiesForType.length > 0}
                                    {#each availableFacilitiesForType as facility (facility.id)}
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
                                        Nessuna servizio disponibile
                                    </Select.Item>
                                {/if}
                            </Select.Group>
                        </Select.Content>
                    </Select.Root>
                </div>
            {/if}

            <!-- Season Toggle -->
            <div class="grid gap-2">
                <label class="text-sm font-medium">Periodo</label>
                <div class="flex gap-2">
                    <Button
                        variant={isWholeSeason ? "default" : "outline"}
                        size="sm"
                        class="flex-1"
                        onclick={() => (isWholeSeason = true)}
                        type="button"
                    >
                        Intera Stagione
                    </Button>
                    <Button
                        variant={!isWholeSeason ? "default" : "outline"}
                        size="sm"
                        class="flex-1"
                        onclick={() => (isWholeSeason = false)}
                        type="button"
                    >
                        Date Personalizzate
                    </Button>
                </div>
            </div>

            <!-- Date Inputs -->
            <div class="grid grid-cols-2 gap-4">
                <!-- Start Date -->
                <div class="grid gap-2">
                    <label for="start-date" class="text-sm font-medium">
                        Data Inizio <span class="text-destructive">*</span>
                    </label>
                    <Input
                        id="start-date"
                        type="date"
                        bind:value={bookingStartDate}
                        disabled={isWholeSeason}
                        required
                    />
                </div>

                <!-- End Date -->
                <div class="grid gap-2">
                    <label for="end-date" class="text-sm font-medium">
                        Data Fine <span class="text-destructive">*</span>
                    </label>
                    <Input
                        id="end-date"
                        type="date"
                        bind:value={bookingEndDate}
                        disabled={isWholeSeason}
                        required
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
                        bind:value={bookingPrice}
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

        <Dialog.Footer>
            <Button
                variant="outline"
                onclick={() => (isRentDialogOpen = false)}
            >
                Annulla
            </Button>
            <Button
                onclick={handleRentSubmit}
                disabled={!selectedFacilityId ||
                    !bookingStartDate ||
                    !bookingEndDate ||
                    !bookingPrice}
            >
                Conferma Affitto
            </Button>
        </Dialog.Footer>
    </Dialog.Content>
</Dialog.Root>
