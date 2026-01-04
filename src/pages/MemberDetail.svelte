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
        CheckCircle,
        XCircle,
        Clock,
    } from "@lucide/svelte";
    import {
        loadMemberDetail,
        memberDetail,
        isLoadingMemberDetail,
        memberDetailError,
    } from "$lib/data/repositories/member-detail-repository";
    import type { MemberDetail } from "$model/members/member-detail";
    import type { RentedFacility } from "$model/facilities/rented-facility";

    interface Props {
        memberId: string;
    }

    let { memberId: memberIdStr }: Props = $props();
    let memberId = 1;
    // let memberId = $derived(parseInt(memberIdStr, 10));

    let member = $derived($memberDetail(memberId));
    let loading = $derived($isLoadingMemberDetail(memberId));
    let error = $derived($memberDetailError(memberId));

    // Load member detail on mount
    onMount(async () => {
        try {
            await loadMemberDetail(memberId);
        } catch (error) {
            console.error("Failed to load member detail:", error);
        }
    });

    async function handleRefresh() {
        try {
            await loadMemberDetail(memberId, true);
        } catch (error) {
            console.error("Failed to refresh member detail:", error);
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
            case "SUSPENDED":
                return "destructive";
            case "EXPIRED":
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
</script>

<Header showAddMember={false} />

<main class="container mx-auto px-4 py-8">
    <!-- Back Button -->
    <div class="mb-6">
        <Button variant="ghost" size="sm" onclick={goBack}>
            <ArrowLeft class="h-4 w-4 mr-2" />
            Torna ai Soci
        </Button>
    </div>

    {#if error}
        <!-- Error State -->
        <div
            class="flex flex-col items-center justify-center gap-4 py-12 text-center"
        >
            <CircleAlert class="h-12 w-12 text-destructive" />
            <div>
                <h2 class="text-xl font-semibold mb-2">
                    Impossibile Caricare i Dettagli del Socio
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
            class="flex flex-col items-center justify-center gap-4 py-12 text-center"
        >
            <div class="animate-spin">
                <RefreshCw class="h-8 w-8 text-muted-foreground" />
            </div>
            <p class="text-muted-foreground">Caricamento dettagli socio...</p>
        </div>
    {:else if member}
        <!-- Header Section -->
        <div class="flex items-center justify-between mb-8">
            <div>
                <h1 class="text-4xl font-bold tracking-tight">
                    {member.firstName}
                    {member.lastName}
                </h1>
                <p class="text-muted-foreground mt-1">
                    Socio #{member.memberships[0]?.number || "N/D"}
                </p>
            </div>
            <Button
                variant="outline"
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
            <!-- Left Column: Personal Info & Membership -->
            <div class="lg:col-span-1 space-y-6">
                <!-- Personal Information -->
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
                            {#if member.phoneNumbers.length > 0}
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
                            {#if member.addresses.length > 0}
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
                                    Nessun indirizzo
                                </p>
                            {/if}
                        </div>
                    </Card.Content>
                </Card.Root>

                <!-- Current Membership -->
                {#if member.memberships.length > 0}
                    {@const currentMembership = member.memberships[0]}
                    <Card.Root>
                        <Card.Header>
                            <Card.Title>Iscrizione Attuale</Card.Title>
                        </Card.Header>
                        <Card.Content class="space-y-4">
                            <div class="flex items-center justify-between mb-4">
                                <span class="text-sm font-medium">Stato</span>
                                <Badge
                                    variant={getStatusBadgeVariant(
                                        currentMembership.status,
                                    )}
                                >
                                    {currentMembership.status}
                                </Badge>
                            </div>

                            <Separator />

                            <div>
                                <p class="text-sm text-muted-foreground mb-1">
                                    Socio dal
                                </p>
                                <p class="text-sm font-medium">
                                    {formatDate(currentMembership.validFrom)}
                                </p>
                            </div>

                            <Separator />

                            <div>
                                <p class="text-sm text-muted-foreground mb-1">
                                    Scadenza
                                </p>
                                <p class="text-sm font-medium">
                                    {formatDate(currentMembership.expiresAt)}
                                </p>
                            </div>
                        </Card.Content>
                    </Card.Root>
                {/if}
            </div>

            <!-- Right Column: Facilities & History -->
            <div class="lg:col-span-2 space-y-6">
                <!-- Rented Facilities -->
                <Card.Root>
                    <Card.Header>
                        <div class="flex items-center justify-between">
                            <div>
                                <Card.Title class="flex items-center gap-2">
                                    <Anchor class="h-5 w-5" />
                                    Strutture Affittate
                                </Card.Title>
                                <Card.Description>
                                    Affitti di strutture attuali e passati
                                </Card.Description>
                            </div>
                            {#if member.rentedFacilities.length > 0}
                                <Badge variant="secondary">
                                    {member.rentedFacilities.filter(
                                        (f: RentedFacility) =>
                                            isFacilityActive(f.expiresAt),
                                    ).length} Attive
                                </Badge>
                            {/if}
                        </div>
                    </Card.Header>
                    <Card.Content>
                        {#if member.rentedFacilities.length > 0}
                            <div class="space-y-4">
                                {#each member.rentedFacilities as facility}
                                    {@const isActive = isFacilityActive(
                                        facility.expiresAt,
                                    )}
                                    <div
                                        class="border rounded-lg p-4 space-y-3"
                                    >
                                        <!-- Facility Header -->
                                        <div
                                            class="flex items-start justify-between"
                                        >
                                            <div class="flex-1">
                                                <div
                                                    class="flex items-center gap-2 mb-1"
                                                >
                                                    <h4
                                                        class="font-semibold text-base"
                                                    >
                                                        {facility.facilityName}
                                                    </h4>
                                                    {#if isActive}
                                                        <Badge
                                                            variant="default"
                                                            class="flex items-center gap-1"
                                                        >
                                                            <CheckCircle
                                                                class="h-3 w-3"
                                                            />
                                                            Attiva
                                                        </Badge>
                                                    {:else}
                                                        <Badge
                                                            variant="secondary"
                                                            class="flex items-center gap-1"
                                                        >
                                                            <XCircle
                                                                class="h-3 w-3"
                                                            />
                                                            Scaduta
                                                        </Badge>
                                                    {/if}
                                                </div>
                                                <p
                                                    class="text-sm text-muted-foreground"
                                                >
                                                    {facility.facilityIdentifier}
                                                </p>
                                            </div>
                                        </div>

                                        <!-- Facility Details -->
                                        <div
                                            class="grid grid-cols-2 gap-4 text-sm"
                                        >
                                            <div>
                                                <p
                                                    class="text-muted-foreground mb-1"
                                                >
                                                    Inizio Affitto
                                                </p>
                                                <p class="font-medium">
                                                    {formatDate(
                                                        facility.rentedAt,
                                                    )}
                                                </p>
                                            </div>
                                            <div>
                                                <p
                                                    class="text-muted-foreground mb-1"
                                                >
                                                    Scadenza
                                                </p>
                                                <p class="font-medium">
                                                    {formatDate(
                                                        facility.expiresAt,
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        <!-- Payment Information -->
                                        {#if facility.payment}
                                            <Separator />
                                            <div
                                                class="bg-muted/50 rounded-md p-3 space-y-2"
                                            >
                                                <div
                                                    class="flex items-center gap-2 mb-2"
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
                                                    class="grid grid-cols-2 gap-x-4 gap-y-2 text-sm"
                                                >
                                                    <div>
                                                        <p
                                                            class="text-muted-foreground"
                                                        >
                                                            Importo
                                                        </p>
                                                        <p
                                                            class="font-semibold"
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
                                                            class="text-muted-foreground"
                                                        >
                                                            Pagato il
                                                        </p>
                                                        <p class="font-medium">
                                                            {formatDate(
                                                                facility.payment
                                                                    .paidAt,
                                                            )}
                                                        </p>
                                                    </div>
                                                    {#if facility.payment.paymentMethod}
                                                        <div>
                                                            <p
                                                                class="text-muted-foreground"
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
                                                                class="text-muted-foreground"
                                                            >
                                                                Riferimento
                                                            </p>
                                                            <p
                                                                class="font-mono text-xs"
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
                                            <Separator />
                                            <div
                                                class="flex items-center gap-2 text-sm text-muted-foreground"
                                            >
                                                <Clock class="h-4 w-4" />
                                                <span>Pagamento in attesa</span>
                                            </div>
                                        {/if}
                                    </div>
                                {/each}
                            </div>
                        {:else}
                            <div
                                class="text-center py-12 text-muted-foreground"
                            >
                                <Anchor
                                    class="h-12 w-12 mx-auto mb-3 opacity-20"
                                />
                                <p>Nessuna struttura affittata</p>
                            </div>
                        {/if}
                    </Card.Content>
                </Card.Root>

                <!-- Membership History -->
                {#if member.memberships.length > 1}
                    <Card.Root>
                        <Card.Header>
                            <Card.Title>Storico Iscrizioni</Card.Title>
                            <Card.Description>
                                Periodi di iscrizione precedenti
                            </Card.Description>
                        </Card.Header>
                        <Card.Content>
                            <div class="space-y-3">
                                {#each member.memberships.slice(1) as membership}
                                    <div
                                        class="border rounded-lg p-4 flex items-center justify-between"
                                    >
                                        <div>
                                            <div
                                                class="flex items-center gap-2 mb-1"
                                            >
                                                <span class="font-medium"
                                                    >Socio #{membership.number}</span
                                                >
                                                <Badge
                                                    variant={getStatusBadgeVariant(
                                                        membership.status,
                                                    )}
                                                >
                                                    {membership.status}
                                                </Badge>
                                            </div>
                                            <p
                                                class="text-sm text-muted-foreground"
                                            >
                                                {formatDate(
                                                    membership.validFrom,
                                                )} - {formatDate(
                                                    membership.expiresAt,
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
