<script lang="ts">
    import * as Card from "$lib/components/ui/card";
    import { Separator } from "$lib/components/ui/separator";
    import { User, Mail, Calendar, Phone, MapPin } from "@lucide/svelte";
    import { formatDate } from "$model/shared/date-utils";
    import type { MemberDetail } from "$model/members/member-detail";
    import {
        getLocalTimeZone,
        now,
        type DateValue,
    } from "@internationalized/date";

    interface Props {
        member: MemberDetail;
    }

    let { member }: Props = $props();

    function calculateAge(birthDate: DateValue): number {
        const today = now(getLocalTimeZone());
        let age = today.year - birthDate.year;
        const monthDiff = today.month - birthDate.month;
        if (monthDiff < 0 || (monthDiff === 0 && today < birthDate)) {
            age--;
        }
        return age;
    }
</script>

<Card.Root>
    <Card.Header>
        <Card.Title class="flex items-center gap-2">
            <User class="h-5 w-5" />
            Informazioni Personali
        </Card.Title>
    </Card.Header>
    <Card.Content class="space-y-4">
        <!-- Email -->
        <div>
            <div class="flex items-center gap-2 mb-1">
                <Mail class="h-4 w-4 text-muted-foreground" />
                <span class="text-sm font-medium text-muted-foreground"
                    >Email</span
                >
            </div>
            <p class="text-sm">{member.email}</p>
        </div>

        <Separator />

        <!-- Birth Date -->
        <div>
            <div class="flex items-center gap-2 mb-1">
                <Calendar
                    class="h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                />
                <span class="text-sm font-medium text-muted-foreground"
                    >Data di Nascita</span
                >
            </div>
            <p class="text-sm">
                {formatDate(member.birthDate, {
                    month: "long",
                })} ({calculateAge(member.birthDate)} anni)
            </p>
        </div>

        <Separator />

        <!-- Phone Numbers -->
        <div>
            <div class="flex items-center gap-2 mb-2">
                <Phone class="h-4 w-4 text-muted-foreground" />
                <span class="text-sm font-medium text-muted-foreground"
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

        <!-- Addresses -->
        <div>
            <div class="flex items-center gap-2 mb-2">
                <MapPin class="h-4 w-4 text-muted-foreground" />
                <span class="text-sm font-medium text-muted-foreground"
                    >Indirizzi</span
                >
            </div>
            {#if member.addresses && member.addresses.length > 0}
                <div class="space-y-3">
                    {#each member.addresses as address}
                        <div class="text-sm">
                            <p>
                                {address.street}
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
                <p class="text-sm text-muted-foreground">Nessun indirizzo</p>
            {/if}
        </div>
    </Card.Content>
</Card.Root>
