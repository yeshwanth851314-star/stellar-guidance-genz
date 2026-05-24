import { useEffect } from "react";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { StarField } from "@/components/cosmos/StarField";
import { OmAmbient } from "@/components/OmAmbient";
import { ScrollProgress } from "@/components/ScrollProgress";
import { supabase } from "@/integrations/supabase/client";
import { Toaster } from "sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass max-w-md rounded-2xl p-8 text-center">
        <h1 className="text-gradient-gold font-display text-6xl">404</h1>
        <p className="mt-3 text-sm text-muted-foreground">This star isn't in our sky.</p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass max-w-md rounded-2xl p-8 text-center">
        <h1 className="font-display text-2xl text-foreground">A cosmic disturbance</h1>
        <p className="mt-2 text-sm text-muted-foreground">{import.meta.env.PROD ? "An unexpected error occurred." : error.message}</p>
        <button
          onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Realign
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#1a1033" },
      { title: "Karma Compass — Daily Cosmos · Daily Self" },
      { name: "description", content: "Vedic astrology, Panchanga, and wellness for daily alignment." },
      { property: "og:title", content: "Karma Compass — Daily Cosmos · Daily Self" },
      { property: "og:description", content: "Vedic astrology, Panchanga, and wellness for daily alignment." },
      { property: "og:type", content: "website" },
      { name: "twitter:title", content: "Karma Compass — Daily Cosmos · Daily Self" },
      { name: "twitter:description", content: "Vedic astrology, Panchanga, and wellness for daily alignment." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/419ec44e-4f09-4213-8537-4c825f1c3ef0/id-preview-c4fd7e51--f52dba0b-7b64-47f3-beb1-ab4a1e0d934b.lovable.app-1779551117379.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/419ec44e-4f09-4213-8537-4c825f1c3ef0/id-preview-c4fd7e51--f52dba0b-7b64-47f3-beb1-ab4a1e0d934b.lovable.app-1779551117379.png" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600;700&family=Cinzel+Decorative:wght@400;700;900&family=Lato:wght@300;400;700&family=Noto+Sans+Telugu:wght@400;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthSync />
      <ScrollProgress />
      <OmAmbient />
      <div className="relative mx-auto min-h-screen w-full max-w-[440px] overflow-x-hidden">
        <StarField />
        <Outlet />
      </div>
      <Toaster theme="dark" position="top-center" />
    </QueryClientProvider>
  );
}

function AuthSync() {
  const router = useRouter();
  const qc = useQueryClient();
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      router.invalidate();
      qc.invalidateQueries();
    });
    return () => subscription.unsubscribe();
  }, [router, qc]);
  return null;
}
