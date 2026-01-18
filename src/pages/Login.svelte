<script lang="ts">
    import { authClient } from "$lib/auth-client";
    import { goto } from "@mateothegreat/svelte5-router";
    import { Button } from "$lib/components/ui/button";
    import { Input } from "$lib/components/ui/input";
    import { Label } from "$lib/components/ui/label";
    import * as Card from "$lib/components/ui/card";
    import * as Alert from "$lib/components/ui/alert";

    let email = $state("");
    let password = $state("");
    let error = $state("");
    let loading = $state(false);

    async function handleSubmit() {
        error = "";
        loading = true;

        try {
            const { data, error: signInError } = await authClient.signIn.email({
                email,
                password,
                rememberMe: true,
            });

            if (signInError) {
                error = signInError.message || "Failed to sign in";
            } else if (data) {
                // Redirect to /members on successful login
                goto("/members");
            }
        } catch (err) {
            error = "An unexpected error occurred";
            console.error(err);
        } finally {
            loading = false;
        }
    }
</script>

<div class="min-h-screen flex items-center justify-center bg-muted/50 p-4">
    <Card.Root class="w-full max-w-md">
        <Card.Header>
            <Card.Title class="text-2xl text-center"
                >Circolo Nautico Cattolica</Card.Title
            >
            <Card.Description class="text-center">
                Inserisci le tue credenziali per accedere al tuo account
            </Card.Description>
        </Card.Header>
        <Card.Content>
            <form
                onsubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                }}
                class="space-y-4"
            >
                <div class="space-y-2">
                    <Label for="email">Email</Label>
                    <Input
                        type="email"
                        id="email"
                        bind:value={email}
                        required
                        placeholder="Inserisci la tua email"
                        disabled={loading}
                    />
                </div>

                <div class="space-y-2">
                    <Label for="password">Password</Label>
                    <Input
                        type="password"
                        id="password"
                        bind:value={password}
                        required
                        placeholder="Inserisci la tua password"
                        disabled={loading}
                    />
                </div>

                {#if error}
                    <Alert.Root variant="destructive">
                        <Alert.Description>{error}</Alert.Description>
                    </Alert.Root>
                {/if}

                <Button type="submit" class="w-full" disabled={loading}>
                    {loading ? "Accesso in corso..." : "Accedi"}
                </Button>
            </form>
        </Card.Content>
    </Card.Root>
</div>
