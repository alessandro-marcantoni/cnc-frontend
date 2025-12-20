import type { RouteConfig, RouteResult } from "@mateothegreat/svelte5-router";
import Home from "./pages/Home.svelte";
import Services from "./pages/Services.svelte";

const homePaths: string[] = ["", "/"];
const openPaths: string[] = ["/login"];

export const routes: RouteConfig[] = [
  {
    path: "/",
    component: Home,
    hooks: {
      pre: homeGuard,
    },
  },
  {
    path: "/services",
    component: Services,
    hooks: {
      pre: homeGuard,
    },
  },
];

async function homeGuard(route: RouteResult): Promise<boolean> {
  return true;
}
