import type { RouteConfig, RouteResult } from "@mateothegreat/svelte5-router";
import Home from "./pages/Home.svelte";

const homePaths: string[] = ["", "/"];
const openPaths: string[] = ["/login"];

export const routes: RouteConfig[] = [
  {
    component: Home,
    hooks: {
      pre: homeGuard,
    },
  },
];

async function homeGuard(route: RouteResult): Promise<boolean> {
  return true;
}
