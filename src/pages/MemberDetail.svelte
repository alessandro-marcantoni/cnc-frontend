<script lang="ts">
    import { onMount, untrack } from "svelte";
    import Header from "$lib/components/shared/header.svelte";
    import * as Select from "$lib/components/ui/select";
    import { Button } from "$lib/components/ui/button";
    import {
        RefreshCw,
        CircleAlert,
        ArrowLeft,
        Calendar,
    } from "@lucide/svelte";

    // Import extracted components
    import MemberInfoCard from "$lib/components/member-detail/member-info-card.svelte";
    import MembershipCard from "$lib/components/member-detail/membership-card.svelte";
    import RentedFacilitiesCard from "$lib/components/member-detail/rented-facilities-card.svelte";
    import MembershipHistoryCard from "$lib/components/member-detail/membership-history-card.svelte";
    import RentFacilityDialog from "$lib/components/member-detail/rent-facility-dialog.svelte";
    import PaymentDialog from "$lib/components/member-detail/payment-dialog.svelte";
    import FreeFacilityDialog from "$lib/components/member-detail/free-facility-dialog.svelte";
    import RenewMembershipDialog from "$lib/components/member-detail/renew-membership-dialog.svelte";

    import {
        loadMemberDetail,
        memberDetail,
        isLoadingMemberDetail,
        memberDetailError,
    } from "$lib/data/repositories/member-detail-repository";
    import { addMembership } from "$lib/data/api";
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
    import type { RentedFacility } from "$model/facilities/rented-facility";
    import { formatDate } from "$model/shared/date-utils";
    import { getQueryParam, setQueryParam } from "$lib/utils/query-params";

    let { route } = $props();
    let memberId = $derived(parseInt(route.result.path.params.id, 10));
    let isValidId = $derived(!isNaN(memberId) && memberId > 0);

    // Get available seasons
    const seasons = getSeasons();
    const currentSeason = getCurrentSeason();

    // Initialize season from URL query param (using season name) or default to current season
    const seasonNameFromUrl = getQueryParam("season");
    const seasonFromUrl = seasonNameFromUrl
        ? seasons.find((s) => s.name.toString() === seasonNameFromUrl)
        : null;
    const initialSeasonId = seasonFromUrl
        ? seasonFromUrl.id.toString()
        : currentSeason.id.toString();

    // Selected season state (stores ID internally)
    let selectedSeasonValue = $state<string>(initialSeasonId);
    let selectedSeason = $derived<Season | null>(
        seasons.find(
            (season) => season.id.toString() === selectedSeasonValue,
        ) ?? null,
    );

    let member = $derived(
        isValidId
            ? $memberDetail(memberId, parseInt(selectedSeasonValue))
            : null,
    );
    let memberLoading = $derived(
        isValidId
            ? $isLoadingMemberDetail(memberId, parseInt(selectedSeasonValue))
            : false,
    );
    let memberError = $derived(
        !isValidId
            ? "ID socio non valido"
            : $memberDetailError(memberId, parseInt(selectedSeasonValue)),
    );

    let facilities = $derived(
        isValidId
            ? $rentedFacilities(memberId, parseInt(selectedSeasonValue))
            : [],
    );
    let facilitiesLoading = $derived(
        isValidId
            ? $isLoadingRentedFacilities(
                  memberId,
                  parseInt(selectedSeasonValue),
              )
            : false,
    );
    let facilitiesError = $derived(
        isValidId
            ? $rentedFacilitiesError(memberId, parseInt(selectedSeasonValue))
            : null,
    );

    // Combined loading and error states
    let loading = $derived(memberLoading || facilitiesLoading);
    let error = $derived(memberError || facilitiesError);
    // Rent/Renew facility dialog state
    let isRentDialogOpen = $state(false);
    let rentDialogMode = $state<"rent" | "renew">("rent");
    let renewFacilityToRenew = $state<RentedFacility | null>(null);

    // Renew membership dialog state
    let isRenewMembershipDialogOpen = $state(false);
    let renewMembershipSeason = $state<string | undefined>(undefined);
    let renewMembershipPrice = $state("");

    // Modify/Free facility dialog state
    let isPaymentDialogOpen = $state(false);
    let isFreeDialogOpen = $state(false);
    let selectedRentedFacility = $state<RentedFacility | null>(null);

    // Load facility catalog on mount
    onMount(() => {
        loadFacilitiesCatalog();
    });

    async function handleRefresh() {
        if (!isValidId) {
            return;
        }

        try {
            const season = parseInt(selectedSeasonValue) || undefined;
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

        // Update URL with season name (not ID) without triggering the effect again
        untrack(() => {
            if (selectedSeason) {
                setQueryParam("season", selectedSeason.name.toString());
            }
        });

        console.log("Season changed:", selectedSeason);

        if (selectedSeason) {
            Promise.all([
                loadMemberDetail(
                    memberId,
                    false,
                    parseInt(selectedSeasonValue),
                ),
                loadRentedFacilities(
                    memberId,
                    false,
                    parseInt(selectedSeasonValue),
                ),
            ]).catch((error) => {
                console.error("Failed to load data for season:", error);
            });
        }
    });

    function goBack() {
        window.history.pushState({}, "", "/");
        window.dispatchEvent(new PopStateEvent("popstate"));
    }

    // Rent facility dialog functions
    function openRentDialog() {
        rentDialogMode = "rent";
        renewFacilityToRenew = null;
        isRentDialogOpen = true;
    }

    // Modify/Free facility functions
    function openPaymentDialog(facility: RentedFacility) {
        selectedRentedFacility = facility;
        isPaymentDialogOpen = true;
    }

    function openFreeDialog(facility: RentedFacility) {
        selectedRentedFacility = facility;
        isFreeDialogOpen = true;
    }

    function handleFreeFacility() {
        if (!selectedRentedFacility) return;

        // TODO: Implement free facility logic here
        // Also refresh the facilities by type
        console.log("Free facility:", {
            rentalId: selectedRentedFacility.id,
            facilityId: selectedRentedFacility.facilityId,
        });

        isFreeDialogOpen = false;
    }

    // Renew membership functions
    function openRenewMembershipDialog() {
        renewMembershipSeason = undefined;
        renewMembershipPrice = "";
        isRenewMembershipDialogOpen = true;
    }

    async function handleRenewMembershipSubmit() {
        if (!renewMembershipSeason || !renewMembershipPrice || !member) return;

        try {
            // Find the selected season object
            const selectedSeasonObj = seasons.find(
                (s) => s.name.toString() === renewMembershipSeason,
            );

            if (!selectedSeasonObj) {
                console.error("Season not found");
                return;
            }

            // Call the API to add the membership
            const updatedMember = await addMembership(
                memberId,
                selectedSeasonObj,
                parseFloat(renewMembershipPrice),
            );

            // Update the local member state
            member = updatedMember;

            // Close the dialog
            isRenewMembershipDialogOpen = false;

            // Optionally refresh the data to ensure consistency
            await handleRefresh();
        } catch (error) {
            console.error("Failed to add membership:", error);
            // You might want to show an error toast/notification here
        }
    }

    // Renew facility functions
    function openRenewFacilityDialog(facility: RentedFacility) {
        rentDialogMode = "renew";
        renewFacilityToRenew = facility;
        isRentDialogOpen = true;
    }

    async function handleRentFacilitySuccess(
        facilityTypeId: number,
        seasonId: number,
    ) {
        await Promise.all([
            loadRentedFacilities(memberId, true, seasonId),
            loadFacilitiesByType(facilityTypeId, seasonId, true),
        ]);
    }
</script>

<Header showAddMember={false} />

<main class="container mx-auto px-4 py-8">
    <!-- Back Button -->
    <div class="mb-6">
        <Button variant="ghost" size="sm" onclick={goBack}>
            <ArrowLeft class="h-4 w-4 mr-2" />
            Torna alla lista
        </Button>
    </div>

    {#if error}
        <!-- Error State -->
        <div
            class="flex flex-col items-center justify-center py-16 text-center"
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
            class="flex flex-col items-center justify-center py-16 text-center"
        >
            <div class="animate-spin">
                <RefreshCw class="h-8 w-8 text-muted-foreground" />
            </div>
            <p class="text-muted-foreground">Caricamento in corso...</p>
        </div>
    {:else if member}
        <!-- Member Detail Content -->
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
                                {seasons.find(
                                    (season) =>
                                        season.id.toString() ===
                                        selectedSeasonValue,
                                )?.name ?? "Seleziona stagione"}
                            {:else}
                                Seleziona stagione
                            {/if}
                        </Select.Trigger>
                        <Select.Content>
                            <Select.Group>
                                <Select.Label>Stagione</Select.Label>
                                {#each seasons as season (season.id)}
                                    <Select.Item value={season.id.toString()}>
                                        {season.name}
                                    </Select.Item>
                                {/each}
                            </Select.Group>
                        </Select.Content>
                    </Select.Root>
                    {#if selectedSeason}
                        <span class="text-xs text-muted-foreground">
                            ({formatDate(selectedSeason.startsAt)} - {formatDate(
                                selectedSeason.endsAt,
                            )})
                        </span>
                    {/if}
                </div>
                <Button
                    variant="outline"
                    onclick={handleRefresh}
                    disabled={loading}
                >
                    <RefreshCw
                        class="h-4 w-4 {loading ? 'animate-spin' : ''}"
                    />
                    Aggiorna
                </Button>
            </div>
        </div>

        <div class="grid gap-6 lg:grid-cols-3">
            <!-- Left Column: Personal Info & Membership -->
            <div class="lg:col-span-1 space-y-6">
                <!-- Personal Information Card -->
                <MemberInfoCard {member} />

                <!-- Current Membership Card -->
                <MembershipCard
                    memberships={member.memberships}
                    selectedSeasonName={selectedSeasonValue ||
                        currentSeason.name.toString()}
                    onRenew={openRenewMembershipDialog}
                    onSuccess={handleRefresh}
                />
            </div>

            <!-- Right Column: Facilities & History -->
            <div class="lg:col-span-2 space-y-6">
                <!-- Rented Facilities Card -->
                <RentedFacilitiesCard
                    {facilities}
                    loading={facilitiesLoading}
                    error={facilitiesError}
                    onRentClick={openRentDialog}
                    onEditPayment={openPaymentDialog}
                    onFree={openFreeDialog}
                    onRenew={openRenewFacilityDialog}
                />

                <!-- Membership History Card -->
                {#if member.memberships && member.memberships.length > 1}
                    <MembershipHistoryCard memberships={member.memberships} />
                {/if}
            </div>
        </div>
    {/if}
</main>

<!-- Rent/Renew Facility Dialog -->
<RentFacilityDialog
    bind:open={isRentDialogOpen}
    mode={rentDialogMode}
    {memberId}
    memberName={member ? `${member.firstName} ${member.lastName}` : ""}
    facilityTypes={$facilitiesCatalog ?? []}
    availableFacilities={$facilitiesByType ?? []}
    {currentSeason}
    availableSeasons={seasons}
    facilityToRenew={renewFacilityToRenew}
    onClose={() => {
        rentDialogMode = "rent";
        renewFacilityToRenew = null;
    }}
    onSuccess={(facilityTypeId, seasonId) =>
        handleRentFacilitySuccess(facilityTypeId, seasonId)}
    onLoadFacilitiesForType={(typeId, seasonId) =>
        loadFacilitiesByType(typeId, seasonId)}
/>

<!-- Payment Dialog -->
<PaymentDialog
    bind:open={isPaymentDialogOpen}
    entityType="facility"
    entityId={selectedRentedFacility?.id || null}
    entityIdentifier={selectedRentedFacility?.facilityIdentifier || ""}
    price={selectedRentedFacility?.price}
    payment={selectedRentedFacility?.payment}
    onClose={() => (isPaymentDialogOpen = false)}
    onSuccess={handleRefresh}
/>

<!-- Free Facility Dialog -->
<FreeFacilityDialog
    bind:open={isFreeDialogOpen}
    facility={selectedRentedFacility}
    onConfirm={handleFreeFacility}
/>

<!-- Renew Membership Dialog -->
<RenewMembershipDialog
    bind:open={isRenewMembershipDialogOpen}
    memberName={member ? `${member.firstName} ${member.lastName}` : ""}
    {currentSeason}
    availableSeasons={seasons}
    bind:selectedSeason={renewMembershipSeason}
    bind:price={renewMembershipPrice}
    onClose={() => (isRenewMembershipDialogOpen = false)}
    onSubmit={handleRenewMembershipSubmit}
    onSeasonChange={(season) => (renewMembershipSeason = season)}
    onPriceChange={(price) => (renewMembershipPrice = price)}
/>

<!-- Renew Facility Dialog -->
