<script lang="ts">
    import "./app.css";
    import { ModeWatcher } from "mode-watcher";
    import { mockMembers } from "$lib/data/mock-members";
    import { Router } from "@mateothegreat/svelte5-router";
    import { routes } from "./router";
</script>

<ModeWatcher />
<Router {routes} />
