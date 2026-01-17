<script lang="ts">
    import { Check, ChevronDown } from "@lucide/svelte";
    import { Button } from "$lib/components/ui/button";
    import { Badge } from "$lib/components/ui/badge";
    import { cn } from "$lib/utils";

    interface Option {
        value: string;
        label: string;
        variant?: "default" | "secondary" | "destructive" | "outline";
    }

    interface Props {
        options: Option[];
        selected?: string[];
        placeholder?: string;
        class?: string;
    }

    let {
        options,
        selected = $bindable([]),
        placeholder = "Seleziona elementi...",
        class: className,
    }: Props = $props();

    let isOpen = $state(false);
    let uniqueId = $state(
        `multi-select-${Math.random().toString(36).substr(2, 9)}`,
    );

    function toggleOption(value: string) {
        if (selected.includes(value)) {
            selected = selected.filter((v) => v !== value);
        } else {
            selected = [...selected, value];
        }
    }

    function getLabel(value: string): string {
        return options.find((opt) => opt.value === value)?.label || value;
    }

    function getVariant(value: string) {
        return options.find((opt) => opt.value === value)?.variant || "default";
    }

    function handleClickOutside(event: MouseEvent) {
        const target = event.target as HTMLElement;
        const container = document.getElementById(uniqueId);
        if (container && !container.contains(target)) {
            isOpen = false;
        }
    }

    $effect(() => {
        if (isOpen) {
            document.addEventListener("click", handleClickOutside);
            return () => {
                document.removeEventListener("click", handleClickOutside);
            };
        }
    });
</script>

<div id={uniqueId} class={cn("relative", className)}>
    <Button
        variant="outline"
        role="combobox"
        aria-expanded={isOpen}
        class="w-full justify-between"
        onclick={() => (isOpen = !isOpen)}
    >
        <div class="flex gap-1 flex-wrap">
            {#if selected.length === 0}
                <span class="text-muted-foreground">{placeholder}</span>
            {:else if selected.length <= 2}
                {#each selected as value (value)}
                    <Badge variant={getVariant(value)} class="text-xs">
                        {getLabel(value)}
                    </Badge>
                {/each}
            {:else}
                <Badge variant="secondary" class="text-xs">
                    {selected.length} selezionati
                </Badge>
            {/if}
        </div>
        <ChevronDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
    </Button>

    {#if isOpen}
        <div
            class="absolute z-50 mt-2 w-full rounded-md border bg-popover p-1 text-popover-foreground shadow-md outline-none animate-in fade-in-80"
        >
            <div class="max-h-75 overflow-auto">
                {#each options as option (option.value)}
                    <div
                        role="option"
                        tabindex="0"
                        aria-selected={selected.includes(option.value)}
                        class="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
                        onclick={() => toggleOption(option.value)}
                        onkeydown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                toggleOption(option.value);
                            }
                        }}
                    >
                        <div
                            class={cn(
                                "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                selected.includes(option.value)
                                    ? "bg-primary text-primary-foreground"
                                    : "opacity-50 [&_svg]:invisible",
                            )}
                        >
                            <Check class="h-4 w-4" />
                        </div>
                        <span>{option.label}</span>
                    </div>
                {/each}
            </div>
        </div>
    {/if}
</div>
