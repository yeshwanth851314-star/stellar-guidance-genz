
# Karma Compass — Iteration 1: Foundation

Massive spec; we're going foundation-first so every later tab snaps onto a solid base. This iteration ends with a runnable app: splash → onboarding → 7-tab shell with a working Home placeholder and real panchanga calculation saved to your profile.

## What you'll get this iteration

1. **Lovable Cloud** enabled (Postgres, auth, server functions, secrets, AI Gateway).
2. **Design system** — cosmos color tokens in `src/styles.css`, Cinzel/Cinzel Decorative/Lato/Noto Sans Telugu fonts, custom Tailwind keyframes (twinkle, mandala rotation, shimmer, rasiGlow, floatOrb, pulseRing, etc.).
3. **Global animated background** — three-layer parallax star canvas + nebula blobs + shooting stars, rendered once at root, always running, pauses when tab hidden.
4. **Sound engine** — `SoundEngine` module using Web Audio API (no asset files). Lazy-inits on first user gesture. Master + per-category toggles persisted to profile.
5. **Auth + onboarding flow**
   - Splash (3.5s mandala + name reveal).
   - Step 1 Welcome → Step 2 Account (email/password + Google) → Step 3 Birth details (date, optional time, location autocomplete) → Step 4 Cosmic Identity reveal.
   - Google OAuth via Lovable broker.
   - Location autocomplete via **Google Places API** (your key — see Open Questions).
6. **Panchanga engine** — server function using `astronomy-engine` (pure JS, runs on Cloudflare Worker). Computes sidereal sun/moon longitudes with Lahiri ayanamsha → rasi, nakshatra, pada, lagna (sunrise approximation), tithi, vara, yoga, karana, dosha. See "Astronomy note" below.
7. **Database schema + seeds**
   - `profiles`, `daily_content`, `nakshatra_library` (27 rows), `rasi_library` (12 rows), `yoga_poses` (~12), `herbs` (~12). Full RLS.
   - Trigger to auto-create profile on signup.
8. **Navigation shell** — TanStack Router routes for all 7 tabs under an `_authenticated` layout. Bottom tab bar (fixed, blurred, animated active state, tap sound, haptic). Each tab gets a route file with placeholder content + proper `head()` meta.
9. **Home tab v1** — sticky header, greeting, panchanga horizontal strip (live data from saved profile, expand interaction), Daily Vibe placeholder card (animated mandala + energy meter), three insight cards (collapsed). Full AI content generation deferred.
10. **393px mobile frame** with safe-area handling; PWA manifest (no service worker yet — added in a later iteration to avoid preview-iframe issues).

## Deferred to follow-up iterations

- **Birth Chart tab** (Rasi/Planets/Nakshatra sub-tabs, SVG chart rendering).
- **AR Constellation viewer** (canvas, gyroscope, shooting stars layer).
- **Wellness tab** (dosha hero, yoga carousel, herb flip cards).
- **Archive tab** (date strip, history infinite scroll).
- **Profile + Settings tabs** (edit modal, theme switcher, sound preferences UI).
- **AI Gateway daily content generator** (Gemini) + pg_cron + push notifications.
- **PWA service worker** + offline caching.
- **Full nakshatra/rasi/herb/yoga seed data** with Telugu + constellation coordinates.

These are tracked but not built now — keeps iteration 1 reviewable.

## Astronomy note (important)

You picked "Swiss Ephemeris via server fn", but real Swiss Ephemeris (`swisseph`) requires native C bindings that **don't run on Cloudflare Workers** (our server runtime). The practical equivalent is **`astronomy-engine`** — pure JavaScript, sub-arcminute accuracy, works on Workers. This gives you Swiss-Ephemeris-grade results without the native dependency. If you ever need true `sweph` precision, we'd need to host a separate Node service and call it via HTTP — out of scope.

## Technical details

- **Stack reality check**: spec asks for "React 18 + Vite", we're on **TanStack Start (React 19 + Vite 7)** which is the project template. Same React mental model; routing is file-based via `src/routes/*` and server logic uses `createServerFn`. No CRA/Next patterns.
- **Server functions**: `calculatePanchanga`, `saveBirthDetails`, `getProfile` — all under `src/lib/*.functions.ts` with `requireSupabaseAuth`.
- **Edge runtime constraints**: no `swisseph`, `sharp`, `puppeteer`, `child_process`. We use only pure-JS deps.
- **Howler**: spec says Howler, but since all sounds are Web Audio-synthesized, we'll use the native `AudioContext` directly and skip Howler (one less dep, identical result).
- **Fonts**: loaded via Google Fonts `<link>` in `__root.tsx` head with `display=swap`.
- **State**: TanStack Query for server data; React Context only for sound/theme prefs.
- **Animations**: Framer Motion for entrance/exit, CSS keyframes for ambient loops, IntersectionObserver via `react-intersection-observer`.
- **Auth gating**: `_authenticated` layout route redirects to `/onboarding` if no profile, `/login` if no session.

## File layout (this iteration)

```text
src/
  routes/
    __root.tsx                  (fonts, star bg, sound provider, query client)
    index.tsx                   (redirects to /home or /onboarding)
    login.tsx
    onboarding.tsx              (4-step wizard)
    _authenticated.tsx          (auth + profile gate, bottom nav layout)
    _authenticated/
      home.tsx
      chart.tsx                 (placeholder)
      ar.tsx                    (placeholder)
      wellness.tsx              (placeholder)
      archive.tsx               (placeholder)
      profile.tsx               (placeholder)
      settings.tsx              (placeholder)
  components/
    cosmos/
      StarField.tsx             (canvas parallax bg)
      Mandala.tsx               (animated SVG)
      BottomNav.tsx
      PanchangaStrip.tsx
      DailyVibeCard.tsx
      InsightCard.tsx
    onboarding/
      SplashScreen.tsx
      OnboardingWizard.tsx
      CosmicReveal.tsx
      PlacesAutocomplete.tsx
  lib/
    panchanga.ts                (pure calc logic)
    panchanga.functions.ts      (server fn wrapper)
    profile.functions.ts
    sound-engine.ts
    constants/
      nakshatras.ts
      rasis.ts
  styles.css                    (cosmos tokens + keyframes)
```

## Open questions

1. **Google API key** — Yes, you can get a free Google Maps Platform key, but it requires a billing account (Google gives $200/month free credit which covers thousands of Places requests). You can't create it in AI Studio — that's a different product (Gemini API). You'll need:
   - Go to console.cloud.google.com → create project → enable "Places API (New)" → Credentials → create API key → restrict to your domains.
   
   While you do that, I'll wire the UI to accept either a Google key or fall back to free **Nominatim (OpenStreetMap)** so the app works immediately. You can paste the Google key later via Settings → Secrets.

2. **First-iteration acceptance** — Confirm "foundation only" means: I should NOT build out the seven tabs' full content this turn. Home gets a working shell; Chart/AR/Wellness/Archive/Profile/Settings are routed placeholders. Approve and I'll build.
