import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ... keep existing code (imports continue)

export const findHinduBirthday = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
import { z } from "zod";
import { computePanchanga } from "./panchanga.functions";

export const findHinduBirthday = createServerFn({ method: "POST" })
  .inputValidator((input: { birthIso: string; year: number }) =>
    z.object({
      birthIso: z.string().min(8),
      year: z.number().int().min(1900).max(2100),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const birth = new Date(data.birthIso);
    if (Number.isNaN(birth.getTime())) throw new Error("Invalid birth date");
    const bp = computePanchanga(birth);
    const targetTithi = bp.tithi;
    const targetSunRasi = Math.floor(bp.sunLongitude / 30);

    const matches: Array<{
      date: string;
      tithi: string;
      nakshatra: string;
      vara: string;
    }> = [];

    // Sweep the full year, plus a bit of slack at edges.
    const start = new Date(Date.UTC(data.year, 0, 1));
    for (let i = -2; i < 367; i++) {
      const d = new Date(start.getTime() + i * 86_400_000);
      const p = computePanchanga(d);
      const sunRasi = Math.floor(p.sunLongitude / 30);
      if (p.tithi === targetTithi && sunRasi === targetSunRasi) {
        const iso = d.toISOString().slice(0, 10);
        if (!matches.find((m) => m.date === iso)) {
          matches.push({
            date: iso,
            tithi: p.tithiName,
            nakshatra: p.nakshatraName,
            vara: p.varaName,
          });
        }
      }
    }

    return {
      matches,
      birthTithi: bp.tithiName,
      birthNakshatra: bp.nakshatraName,
      birthRasi: bp.rasiName,
    };
  });
