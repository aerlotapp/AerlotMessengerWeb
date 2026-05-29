import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { Route as rootRoute } from "./routes/__root";
import { Route as indexRoute } from "./routes/index";
import { Route as premiumRoute } from "./routes/premium";

// Define the route tree manually
const routeTree = rootRoute.addChildren([
  indexRoute,
  premiumRoute,
]);

export const router = createRouter({
  routeTree,
  context: { queryClient: new QueryClient() },
  scrollRestoration: true,
  defaultPreloadStaleTime: 0,
});

// Register the router for maximum type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export const getRouter = () => router;
