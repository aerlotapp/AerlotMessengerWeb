# Routing Architecture

This directory contains the core routing logic for **AerlotMessengerWeb**, powered by [TanStack Router](https://tanstack.com/router). The project follows a **file-based routing** convention where the file structure directly maps to the application's URL paths.

## Core Structure

### Root Layout: `__root.tsx`
The [Root Route](file:///Users/apple/AerlotMessengerWeb/src/routes/__root.tsx) serves as the application's global shell. It handles:
- **Global Providers**: Integrates `QueryClientProvider` and `Toaster`.
- **Global Components**: Managed via the `RootComponent`, ensuring high-level UI elements like notifications are available across all pages.
- **Error Handling**: Defines the `NotFoundComponent` and a global `ErrorComponent` for resilient failure recovery.
- **Head Metadata**: Sets default SEO tags (viewport, title, descriptions).

## Route Definitions

| Route file | URL Path | Description |
| :--- | :--- | :--- |
| [`index.tsx`](file:///Users/apple/AerlotMessengerWeb/src/routes/index.tsx) | `/` | **Home & Authentication**: The entry point for users. Handles OTP-based login and highlights premium features. |
| [`premium.tsx`](file:///Users/apple/AerlotMessengerWeb/src/routes/premium.tsx) | `/premium` | **Subscription Management**: Secure area for users to view plans and process payments via Paystack integration. |

## Technical Patterns

### Route Guards & Middleware
Security and state-based navigation are handled directly within the route definitions. For instance, the `premium` route uses the `beforeLoad` hook to enforce authentication:

```tsx
// Example from src/routes/premium.tsx
beforeLoad: () => {
  if (typeof window === "undefined") return;
  const raw = window.localStorage.getItem("aerlot-auth");
  if (!raw) throw redirect({ to: "/" });
  // ... validation logic
}
```

### SEO & Head Content
Each route defines its own `head` property to manage page-specific metadata dynamically, ensuring optimal search engine visibility and social sharing previews.

### Code Generation
The routing tree is automatically managed. Whenever a file is added or modified in this directory, the development server updates:
- [`src/routeTree.gen.ts`](file:///Users/apple/AerlotMessengerWeb/src/routeTree.gen.ts): The compiler-generated routing tree (do not edit manually).
- [`src/router.tsx`](file:///Users/apple/AerlotMessengerWeb/src/router.tsx): The router instance configuration.

## Development Guidelines

1. **Adding Routes**: To create a new page at `/settings`, create a file named `settings.tsx` in this directory.
2. **Directory Routes**: For complex features (e.g., `/profile/edit`), use a directory structure: `profile/edit.tsx`.
3. **Drafting Documentation**: Always update this README when adding major new routing modules or changing architectural patterns.
