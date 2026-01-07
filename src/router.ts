import type { RouteConfig, RouteResult } from "@mateothegreat/svelte5-router";
import Home from "./pages/Home.svelte";
import Services from "./pages/Services.svelte";
import MemberDetail from "./pages/MemberDetail.svelte";
import Members from "./pages/Members.svelte";
import FacilityTypeDetail from "./pages/FacilityTypeDetail.svelte";

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
    path: "/members",
    component: Members,
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
  {
    path: /^\/members(?:\/(?<id>[0-9]+))$/,
    component: MemberDetail,
    hooks: {
      pre: homeGuard,
    },
  },
  {
    path: /^\/services(?:\/(?<id>[0-9]+))$/,
    component: FacilityTypeDetail,
    hooks: {
      pre: homeGuard,
    },
  },
];

async function homeGuard(route: RouteResult): Promise<boolean> {
  return true;
}
