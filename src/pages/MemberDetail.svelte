<script lang="ts">
    import { onMount } from "svelte";
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
    import RenewFacilityDialog from "$lib/components/member-detail/renew-facility-dialog.svelte";

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
    import {
        CalendarDate,
        getLocalTimeZone,
        today,
        toCalendarDate,
    } from "@internationalized/date";
    import { formatDate } from "$model/shared/date-utils";

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
    let bookingStartDate: CalendarDate | undefined = $state(undefined);
    let bookingEndDate: CalendarDate | undefined = $state(undefined);
    let bookingPrice = $state("");
    let facilityTypeComboboxOpen = $state(false);

    // Renew membership dialog state
    let isRenewMembershipDialogOpen = $state(false);
    let renewMembershipSeason = $state<string | undefined>(undefined);
    let renewMembershipPrice = $state("");

    // Renew facility dialog state
    let isRenewFacilityDialogOpen = $state(false);
    let renewFacilityToRenew = $state<RentedFacility | null>(null);
    let renewFacilitySeason = $state<string | undefined>(undefined);
    let renewFacilityIsWholeSeason = $state(true);
    let renewFacilityStartDate: CalendarDate | undefined = $state(undefined);
    let renewFacilityEndDate: CalendarDate | undefined = $state(undefined);
    let renewFacilityPrice = $state("");

    // Modify/Free facility dialog state
    let isPaymentDialogOpen = $state(false);
    let isFreeDialogOpen = $state(false);
    let selectedRentedFacility = $state<RentedFacility | null>(null);
    let paymentAmount = $state("");
    let paymentMethod = $state("");
    let paymentTransactionRef = $state("");
    let paymentDate: CalendarDate | undefined = $state(
        today(getLocalTimeZone()),
    );

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

    // Rent facility dialog functions
    function openRentDialog() {
        selectedFacilityType = null;
        selectedFacilityId = null;
        facilityTypeComboboxOpen = false;
        isWholeSeason = true;

        // Set default dates
        const todayDate: CalendarDate = today(getLocalTimeZone());
        const currentSeasonData = currentSeason;

        bookingStartDate = todayDate;
        bookingEndDate = currentSeasonData
            ? toCalendarDate(currentSeasonData.endsAt)
            : undefined;

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
                    bookingStartDate = toCalendarDate(
                        currentSeasonData.startsAt,
                    );
                    bookingEndDate = toCalendarDate(currentSeasonData.endsAt);
                }
            } else {
                const currentSeasonData = currentSeason;
                bookingStartDate = today(getLocalTimeZone());
                bookingEndDate = currentSeasonData
                    ? toCalendarDate(currentSeasonData.endsAt)
                    : undefined;
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

    const availableFacilitiesForType = $derived(
        $facilitiesByType.filter((f) => !f.isRented),
    );

    // Modify/Free facility functions
    function openPaymentDialog(facility: RentedFacility) {
        selectedRentedFacility = facility;

        // Pre-fill with existing payment data if available
        if (facility.payment) {
            paymentAmount = facility.payment.amount.toString();
            paymentMethod = facility.payment.paymentMethod || "";
            paymentTransactionRef = facility.payment.transactionRef || "";
            paymentDate = facility.payment.paidAt
                ? toCalendarDate(facility.payment.paidAt)
                : today(getLocalTimeZone());
        } else {
            paymentAmount = "";
            paymentMethod = "";
            paymentTransactionRef = "";
            paymentDate = today(getLocalTimeZone());
        }

        isPaymentDialogOpen = true;
    }

    function openFreeDialog(facility: RentedFacility) {
        selectedRentedFacility = facility;
        isFreeDialogOpen = true;
    }

    function handlePaymentSubmit() {
        if (!selectedRentedFacility || !paymentAmount) return;

        // TODO: Implement payment update logic here
        console.log("Update payment:", {
            rentalId: selectedRentedFacility.id,
            amount: parseFloat(paymentAmount),
            method: paymentMethod,
            transactionRef: paymentTransactionRef,
            paidAt: paymentDate,
        });

        isPaymentDialogOpen = false;
    }

    function handleFreeFacility() {
        if (!selectedRentedFacility) return;

        // TODO: Implement free facility logic here
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
        renewFacilityToRenew = facility;
        renewFacilitySeason = undefined;
        renewFacilityIsWholeSeason = true;
        renewFacilityPrice = "";

        // Set default dates based on current season
        const currentSeasonData = currentSeason;
        if (currentSeasonData) {
            renewFacilityStartDate = toCalendarDate(currentSeasonData.startsAt);
            renewFacilityEndDate = toCalendarDate(currentSeasonData.endsAt);
        }

        isRenewFacilityDialogOpen = true;
    }

    // Update dates when season toggle changes for renew dialog
    $effect(() => {
        if (isRenewFacilityDialogOpen) {
            if (renewFacilityIsWholeSeason) {
                const currentSeasonData = currentSeason;
                if (currentSeasonData) {
                    renewFacilityStartDate = toCalendarDate(
                        currentSeasonData.startsAt,
                    );
                    renewFacilityEndDate = toCalendarDate(
                        currentSeasonData.endsAt,
                    );
                }
            } else {
                const currentSeasonData = currentSeason;
                renewFacilityStartDate = today(getLocalTimeZone());
                renewFacilityEndDate = currentSeasonData
                    ? toCalendarDate(currentSeasonData.endsAt)
                    : undefined;
            }
        }
    });

    function handleRenewFacilitySubmit() {
        if (
            !renewFacilityToRenew ||
            !renewFacilitySeason ||
            !renewFacilityStartDate ||
            !renewFacilityEndDate ||
            !renewFacilityPrice
        )
            return;

        // TODO: Implement renew facility logic here
        console.log("Renew facility rental:", {
            facilityId: renewFacilityToRenew.facilityId,
            memberId: memberId,
            season: renewFacilitySeason,
            startDate: renewFacilityStartDate,
            endDate: renewFacilityEndDate,
            price: parseFloat(renewFacilityPrice),
        });

        isRenewFacilityDialogOpen = false;
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
                                {selectedSeasonValue}
                            {:else}
                                Seleziona stagione
                            {/if}
                        </Select.Trigger>
                        <Select.Content>
                            <Select.Group>
                                <Select.Label>Stagione</Select.Label>
                                {#each seasons as season (season.name)}
                                    <Select.Item value={season.name.toString()}>
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

<!-- Rent Facility Dialog -->
<RentFacilityDialog
    bind:open={isRentDialogOpen}
    memberName={member ? `${member.firstName} ${member.lastName}` : ""}
    facilityTypes={$facilitiesCatalog}
    availableFacilities={availableFacilitiesForType}
    bind:selectedFacilityType
    bind:selectedFacilityId
    bind:isWholeSeason
    bind:startDate={bookingStartDate}
    bind:endDate={bookingEndDate}
    bind:price={bookingPrice}
    bind:facilityTypeComboboxOpen
    onClose={() => (isRentDialogOpen = false)}
    onSubmit={handleRentSubmit}
    onFacilityTypeSelect={(typeId) => (selectedFacilityType = typeId)}
    onFacilityIdChange={(facilityId) => (selectedFacilityId = facilityId)}
    onSeasonToggle={(wholeSeason) => (isWholeSeason = wholeSeason)}
    onStartDateChange={(date) => (bookingStartDate = date)}
    onEndDateChange={(date) => (bookingEndDate = date)}
    onPriceChange={(price) => (bookingPrice = price)}
    onComboboxToggle={(open) => (facilityTypeComboboxOpen = open)}
/>

<!-- Payment Dialog -->
<PaymentDialog
    bind:open={isPaymentDialogOpen}
    facility={selectedRentedFacility}
    bind:amount={paymentAmount}
    bind:method={paymentMethod}
    bind:transactionRef={paymentTransactionRef}
    bind:date={paymentDate}
    onClose={() => (isPaymentDialogOpen = false)}
    onSubmit={handlePaymentSubmit}
    onAmountChange={(amount) => (paymentAmount = amount)}
    onMethodChange={(method) => (paymentMethod = method)}
    onTransactionRefChange={(ref) => (paymentTransactionRef = ref)}
    onDateChange={(date) => (paymentDate = date)}
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
<RenewFacilityDialog
    bind:open={isRenewFacilityDialogOpen}
    memberName={member ? `${member.firstName} ${member.lastName}` : ""}
    facilityName={renewFacilityToRenew?.facilityName || ""}
    facilityIdentifier={renewFacilityToRenew?.facilityIdentifier || ""}
    {currentSeason}
    availableSeasons={seasons}
    bind:selectedSeason={renewFacilitySeason}
    bind:isWholeSeason={renewFacilityIsWholeSeason}
    bind:startDate={renewFacilityStartDate}
    bind:endDate={renewFacilityEndDate}
    bind:price={renewFacilityPrice}
    suggestedPrice={0}
    onClose={() => (isRenewFacilityDialogOpen = false)}
    onSubmit={handleRenewFacilitySubmit}
    onSeasonChange={(season) => (renewFacilitySeason = season)}
    onSeasonToggle={(wholeSeason) => (renewFacilityIsWholeSeason = wholeSeason)}
    onStartDateChange={(date) => (renewFacilityStartDate = date)}
    onEndDateChange={(date) => (renewFacilityEndDate = date)}
    onPriceChange={(price) => (renewFacilityPrice = price)}
/>
