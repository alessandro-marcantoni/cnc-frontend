<script>
    import { Sailboat, Settings, UserPlus } from "@lucide/svelte";
    import Button from "$lib/components/ui/button/button.svelte";
</script>

<!-- Header -->
<header class="border-b">
    <div class="container mx-auto px-4 py-6">
        <div class="flex items-center justify-between">
            <div>
                <h1
                    class="text-4xl font-bold tracking-tight flex items-center gap-3"
                >
                    <Sailboat class="h-10 w-10" />
                    Circolo Nautico Cattolica
                </h1>
                <p class="text-muted-foreground mt-1">
                    Member Management Dashboard
                </p>
            </div>
            <div class="flex gap-2">
                <Button variant="outline">
                    <Settings class="h-4 w-4 mr-2" />
                    Settings
                </Button>
                <Button>
                    <UserPlus class="h-4 w-4 mr-2" />
                    Add Member
                </Button>
            </div>
        </div>
    </div>
</header>
