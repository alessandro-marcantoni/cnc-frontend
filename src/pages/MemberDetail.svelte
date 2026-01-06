<script lang="ts">
    import { onMount } from "svelte";
    import Header from "$lib/components/shared/header.svelte";
    import * as Card from "$lib/components/ui/card";
    import { Button } from "$lib/components/ui/button";
    import { Badge } from "$lib/components/ui/badge";
    import { Separator } from "$lib/components/ui/separator";
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
    } from "@lucide/svelte";
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

    let { route } = $props();
    let memberId = $derived(parseInt(route.result.path.params.id, 10));
    let isValidId = $derived(!isNaN(memberId) && memberId > 0);

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

    // Load member detail and facilities on mount
    onMount(async () => {
        if (!isValidId) {
            console.error("Invalid member ID:", memberId);
            return;
        }

        try {
            await Promise.all([
                loadMemberDetail(memberId),
                loadRentedFacilities(memberId),
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
            await Promise.all([
                loadMemberDetail(memberId, true),
                loadRentedFacilities(memberId, true),
            ]);
        } catch (error) {
            console.error("Failed to refresh data:", error);
        }
    }

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
        <!-- Header with Member Name and Refresh Button -->
        <div class="flex items-center justify-between mb-8">
            <div>
                <h1 class="text-4xl font-bold tracking-tight">
                    {member.firstName}
                    {member.lastName}
                </h1>
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
                            <Card.Title>Tessera Corrente</Card.Title>
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
                                            Pagato il {currentMembership.payment
                                                .paidAt}
                                        </p>
                                    {/if}
                                </div>
                            {/if}
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
                                </Card.Title>
                                <Card.Description>
                                    Elenco dei servizi attualmente in uso
                                </Card.Description>
                            </div>
                            {#if facilities && facilities.length > 0}
                                <Badge variant="secondary">
                                    {facilities.length}
                                    {facilities.length === 1
                                        ? "servizio"
                                        : "servizi"}
                                </Badge>
                            {/if}
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
                                                <span>Pagamento in sospeso</span
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
