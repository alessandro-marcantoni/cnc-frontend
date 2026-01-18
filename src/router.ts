import {
  goto,
  type RouteConfig,
  type RouteResult,
} from "@mateothegreat/svelte5-router";
import Home from "./pages/Home.svelte";
import Services from "./pages/Services.svelte";
import MemberDetail from "./pages/MemberDetail.svelte";
import Members from "./pages/Members.svelte";
import FacilityTypeDetail from "./pages/FacilityTypeDetail.svelte";
import FacilityTypeWaitlist from "./pages/FacilityTypeWaitlist.svelte";
import Login from "./pages/Login.svelte";
import { authClient } from "$lib/auth-client";

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
  {
    path: /^\/services\/(?<id>[0-9]+)\/waitlist$/,
    component: FacilityTypeWaitlist,
    hooks: {
      pre: homeGuard,
    },
  },
  {
    path: "/login",
    component: Login,
    hooks: {
      pre: homeGuard,
    },
  },
];

async function homeGuard(route: RouteResult): Promise<boolean> {
  const path = route.route?.path?.toString();
  if (!path) {
    goto("/login");
    return false;
  }
  if (openPaths.includes(path)) return true;
  const token = await authClient.token().then((x) => x.data?.token);
  if (!token) {
    goto("/login");
    return false;
  }
  return true;
}
