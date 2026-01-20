import { jwtClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/svelte";
export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_AUTH_SERVER_URL || "http://localhost:3000",
  plugins: [jwtClient()],
});
