<script lang="ts">
    import { Sailboat, Settings, UserPlus } from "@lucide/svelte";
    import Button from "$lib/components/ui/button/button.svelte";

    // Get current path for active state
    let currentPath = $state(window.location.pathname);

    // Update currentPath when navigation occurs
    if (typeof window !== "undefined") {
        window.addEventListener("popstate", () => {
            currentPath = window.location.pathname;
        });
    }

    function navigate(path: string) {
        window.history.pushState({}, "", path);
        currentPath = path;
        window.dispatchEvent(new PopStateEvent("popstate"));
    }

    interface NavProps {
        showAddMember?: boolean;
    }

    let { showAddMember = false }: NavProps = $props();
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
                    Dashboard Gestione Soci
                </p>
            </div>
            <div class="flex gap-4 items-center">
                <!-- Navigation Links -->
                <nav class="flex gap-1 mr-4">
                    <button
                        onclick={() => navigate("/")}
                        class="px-4 py-2 rounded-md text-sm font-medium transition-colors {currentPath ===
                        '/'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'}"
                    >
                        Home
                    </button>
                    <button
                        onclick={() => navigate("/services")}
                        class="px-4 py-2 rounded-md text-sm font-medium transition-colors {currentPath ===
                        '/services'
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'}"
                    >
                        Servizi
                    </button>
                </nav>

                <!-- Action Buttons -->
                <div class="flex gap-2">
                    {#if showAddMember}
                        <Button variant="outline">
                            <Settings class="h-4 w-4 mr-2" />
                            Impostazioni
                        </Button>
                        <Button>
                            <UserPlus class="h-4 w-4 mr-2" />
                            Aggiungi Socio
                        </Button>
                    {/if}
                </div>
            </div>
        </div>
    </div>
</header>
