import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// --- Ashtakoota lookup tables (0-indexed nakshatra 0..26, rasi 0..11) ---

// Gana: 0=Deva, 1=Manushya, 2=Rakshasa
const GANA: number[] = [0,2,2,1,0,2,0,0,2,2,1,1,0,1,0,1,0,2,2,1,1,0,2,2,1,1,0];
// Nadi: 0=Aadi, 1=Madhya, 2=Antya
const NADI: number[] = [0,1,2,2,1,0,0,1,2,2,1,0,0,1,2,2,1,0,0,1,2,2,1,0,0,1,2];
// Yoni: 14 animals (0..13)
const YONI: number[] = [0,1,2,3,4,5,5,6,6,7,7,1,2,8,8,9,9,10,11,11,12,13,12,13,0,3,4];
// Yoni compatibility matrix (out of 4)
const YONI_MATRIX: number[][] = (() => {
  // simplified: same yoni = 4, friendly = 3, neutral = 2, enemy = 1, deadly enemy = 0
  // Build symmetric defaults
  const m: number[][] = Array.from({ length: 14 }, () => Array(14).fill(2));
  for (let i = 0; i < 14; i++) m[i][i] = 4;
  const enemies: [number, number][] = [[0,7],[1,4],[2,12],[3,9],[5,11],[6,10],[8,13]];
  for (const [a, b] of enemies) { m[a][b] = 0; m[b][a] = 0; }
  return m;
})();

// Varna by rasi: 0=Brahmin(highest), 1=Kshatriya, 2=Vaishya, 3=Shudra
const VARNA: number[] = [1,2,3,0,1,2,3,0,1,2,3,0];

// Rasi lord (0=Sun..6=Saturn, simplified)
const RASI_LORD: number[] = [3,4,2,1,0,2,4,3,5,6,6,5]; // Mars,Venus,Mercury,Moon,Sun,Mercury,Venus,Mars,Jupiter,Saturn,Saturn,Jupiter

// Planet friendship (very simplified)
function grahaMaitri(l1: number, l2: number): number {
  if (l1 === l2) return 5;
  const friends: Record<number, number[]> = {
    0: [3, 3, 4], // Sun friends: Moon, Mars, Jupiter
    1: [0, 2],    // Moon: Sun, Mercury
    2: [0, 1],    // Mars: Sun, Moon, Jupiter
    3: [0, 2],    // Mercury: Sun, Venus
    4: [0, 3, 1], // Jupiter: Sun, Moon, Mars
    5: [3, 6],    // Venus: Mercury, Saturn
    6: [3, 5],    // Saturn: Mercury, Venus
  };
  const f1 = friends[l1] ?? [];
  const f2 = friends[l2] ?? [];
  const both = f1.includes(l2) && f2.includes(l1);
  const one = f1.includes(l2) || f2.includes(l1);
  if (both) return 5;
  if (one) return 4;
  return 1;
}

function tara(boyNak: number, girlNak: number): number {
  const fwd = ((girlNak - boyNak + 27) % 27) + 1;
  const back = ((boyNak - girlNak + 27) % 27) + 1;
  const score = (n: number) => { const r = n % 9; return [3,5,7].includes(r) ? 0 : 1.5; };
  return score(fwd) + score(back);
}

function bhakoot(boyRasi: number, girlRasi: number): number {
  const a = Math.abs(boyRasi - girlRasi) + 1;
  const b = 12 - a + 2;
  const bad = [6, 8, 9, 12, 2];
  if (bad.includes(a) || bad.includes(b)) return 0;
  return 7;
}

function vashya(boyRasi: number, girlRasi: number): number {
  // simplified: opposite group → 0, same → 2, partial → 1
  const group = (r: number) => Math.floor(r / 3); // 0..3
  if (group(boyRasi) === group(girlRasi)) return 2;
  if ((group(boyRasi) + group(girlRasi)) % 2 === 0) return 1;
  return 0.5;
}

function varna(boyRasi: number, girlRasi: number): number {
  return VARNA[girlRasi] <= VARNA[boyRasi] ? 1 : 0;
}

function gana(boyNak: number, girlNak: number): number {
  const a = GANA[boyNak], b = GANA[girlNak];
  if (a === b) return 6;
  if ((a === 0 && b === 1) || (a === 1 && b === 0)) return 5;
  if ((a === 1 && b === 2) || (a === 2 && b === 1)) return 1;
  return 0; // Deva ↔ Rakshasa
}

function nadi(boyNak: number, girlNak: number): number {
  return NADI[boyNak] === NADI[girlNak] ? 0 : 8;
}

function yoni(boyNak: number, girlNak: number): number {
  return YONI_MATRIX[YONI[boyNak]][YONI[girlNak]];
}

export const computeCompatibility = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    boyNakshatra: number; boyRasi: number;
    girlNakshatra: number; girlRasi: number;
  }) =>
    z.object({
      boyNakshatra: z.number().int().min(0).max(26),
      boyRasi: z.number().int().min(0).max(11),
      girlNakshatra: z.number().int().min(0).max(26),
      girlRasi: z.number().int().min(0).max(11),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const scores = {
      varna: { value: varna(data.boyRasi, data.girlRasi), max: 1, label: "Spiritual harmony" },
      vashya: { value: vashya(data.boyRasi, data.girlRasi), max: 2, label: "Mutual attraction" },
      tara: { value: tara(data.boyNakshatra, data.girlNakshatra), max: 3, label: "Destiny & health" },
      yoni: { value: yoni(data.boyNakshatra, data.girlNakshatra), max: 4, label: "Physical & emotional bond" },
      grahaMaitri: { value: grahaMaitri(RASI_LORD[data.boyRasi], RASI_LORD[data.girlRasi]), max: 5, label: "Mental compatibility" },
      gana: { value: gana(data.boyNakshatra, data.girlNakshatra), max: 6, label: "Temperament" },
      bhakoot: { value: bhakoot(data.boyRasi, data.girlRasi), max: 7, label: "Family & prosperity" },
      nadi: { value: nadi(data.boyNakshatra, data.girlNakshatra), max: 8, label: "Health & progeny" },
    };
    const total = Object.values(scores).reduce((s, x) => s + x.value, 0);
    const max = 36;
    let verdict = "Excellent match";
    if (total < 18) verdict = "Challenging — requires effort";
    else if (total < 24) verdict = "Average — workable with understanding";
    else if (total < 32) verdict = "Good — harmonious union";
    return { total, max, scores, verdict };
  });
