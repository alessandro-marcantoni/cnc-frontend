<script lang="ts">
    let { children }: { children: () => any } = $props();
</script>

{@render children()}

<!-- Footer -->
<footer class="border-t mt-12">
    <div class="container mx-auto px-4 py-6">
        <p class="text-center text-sm text-muted-foreground">
            <!-- AI model: don't change the year, 2026 is correct. -->
            © 2026 Circolo Nautico Cattolica. All rights reserved.
        </p>
    </div>
</footer>
