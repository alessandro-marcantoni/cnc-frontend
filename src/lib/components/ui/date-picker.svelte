<script lang="ts">
    import ChevronDownIcon from "@lucide/svelte/icons/chevron-down";
    import {
        getLocalTimeZone,
        today,
        type CalendarDate,
    } from "@internationalized/date";
    import Button from "./button/button.svelte";
    import Calendar from "./calendar/calendar.svelte";
    import * as Popover from "$lib/components/ui/popover/index.js";
    import Label from "./label/label.svelte";
    import { formatDate } from "$model/shared/date-utils";

    type Props = {
        id: string;
        value?: CalendarDate;
        onValueChange?: (value: CalendarDate | undefined) => void;
        placeholder?: string;
        label?: string;
        disabled?: boolean;
    };

    let {
        id,
        value = $bindable(),
        onValueChange,
        placeholder,
        label,
        disabled,
    }: Props = $props();

    let open = $state(false);
</script>

<div class="flex flex-col gap-3">
    <Label for="{id}-date">{label}</Label>
    <Popover.Root bind:open>
        <Popover.Trigger {id} {disabled}>
            {#snippet child({ props })}
                <Button
                    {...props}
                    variant="outline"
                    class="w-full justify-between font-normal"
                >
                    {value ? formatDate(value) : "Select date"}
                    <ChevronDownIcon />
                </Button>
            {/snippet}
        </Popover.Trigger>
        <Popover.Content class="w-auto overflow-hidden p-0" align="start">
            <Calendar
                type="single"
                bind:value
                captionLayout="dropdown"
                onValueChange={() => {
                    open = false;
                }}
                maxValue={today(getLocalTimeZone())}
            />
        </Popover.Content>
    </Popover.Root>
</div>
