import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { computePanchanga } from "./panchanga.functions";

const SCHEMA = z.object({
  vibe_theme: z.string(),
  vibe_description: z.string(),
  vibe_color: z.string(),
  vibe_icon: z.string(),
  mantra: z.string(),
  planetary_insight: z.string(),
  spiritual_guidance: z.string(),
  practical_tip: z.string(),
  ayurvedic_tip: z.string(),
  lucky_color: z.string(),
  lucky_number: z.number().int().min(1).max(99),
  cosmic_energy: z.number().int().min(1).max(100),
  deity: z.string(),
  morning_guidance: z.string(),
  evening_guidance: z.string(),
});

type DailyContent = z.infer<typeof SCHEMA>;

function fallback(p: ReturnType<typeof computePanchanga>): DailyContent {
  const vibe =
    p.dosha === "Vata"
      ? { vibe_theme: "Move with grace", vibe_color: "#a78bfa", vibe_icon: "🌬️" }
      : p.dosha === "Pitta"
      ? { vibe_theme: "Channel your fire", vibe_color: "#f59e0b", vibe_icon: "🔥" }
      : { vibe_theme: "Ground & nourish", vibe_color: "#34d399", vibe_icon: "🌿" };
  return {
    ...vibe,
    vibe_description: `The Moon walks through ${p.nakshatraName}, casting ${p.dosha} energy across your day.`,
    mantra: "Om Namah Shivaya",
    planetary_insight: `${p.varaName} is ruled by its planetary lord — align your intentions accordingly.`,
    spiritual_guidance: `Sit in silence for 7 minutes and offer gratitude to ${p.nakshatraName}'s deity.`,
    practical_tip: "Begin your most important task during the morning hours when energy is fresh.",
    ayurvedic_tip:
      p.dosha === "Vata"
        ? "Warm sesame oil massage and ginger tea will steady your day."
        : p.dosha === "Pitta"
        ? "Cool coconut water and mint balance excess heat."
        : "Light, warm, spiced food keeps Kapha agile.",
    lucky_color: vibe.vibe_color,
    lucky_number: ((p.tithi + p.nakshatra) % 9) + 1,
    cosmic_energy: 50 + ((p.yoga * 7) % 40),
    deity: ["Ganesha", "Shiva", "Lakshmi", "Saraswati", "Hanuman", "Durga", "Vishnu"][p.vara],
    morning_guidance: `Greet the dawn facing east. Inhale ${p.nakshatraName}'s ${p.dosha} essence for 7 breaths and set one clear intention for today.`,
    evening_guidance: `As ${p.varaName} closes, light a small flame, release what no longer serves, and offer gratitude to the Moon walking through ${p.nakshatraName}.`,
  };
}

export const getDailyContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { isoDate?: string; force?: boolean } | undefined) =>
    z.object({ isoDate: z.string().optional(), force: z.boolean().optional() }).parse(input ?? {})
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const date = data.isoDate ? new Date(data.isoDate) : new Date();
    const dateStr = date.toISOString().slice(0, 10);

    // Check cache unless forced
    if (!data.force) {
      const { data: cached } = await supabase
        .from("daily_content")
        .select("*")
        .eq("user_id", userId)
        .eq("date", dateStr)
        .maybeSingle();
      if (cached?.mantra) return cached;
    }

    const panchanga = computePanchanga(date);

    // Pull full chart context for personalization
    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "name, rasi, nakshatra, pada, lagna, dosha, moon_longitude, sun_longitude, birth_date, birth_place"
      )
      .eq("user_id", userId)
      .maybeSingle();

    const RASIS = ["Mesha","Vrishabha","Mithuna","Karka","Simha","Kanya","Tula","Vrischika","Dhanu","Makara","Kumbha","Meena"];
    const NAKS = ["Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra","Punarvasu","Pushya","Ashlesha","Magha","Purva Phalguni","Uttara Phalguni","Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha","Mula","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishta","Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati"];

    const userRasi = typeof profile?.rasi === "number" ? RASIS[profile.rasi] : "unknown";
    const userNak = typeof profile?.nakshatra === "number" ? NAKS[profile.nakshatra] : "unknown";
    const userLagna = typeof profile?.lagna === "number" ? RASIS[profile.lagna] : "unknown";

    let content: DailyContent;
    try {
      const apiKey = process.env.LOVABLE_API_KEY;
      if (!apiKey) throw new Error("no key");

      const prompt = `Generate today's Vedic astrology guidance as JSON.

— Seeker —
Name: ${profile?.name ?? "Seeker"}
Birth Rasi (Moon sign): ${userRasi}
Birth Nakshatra: ${userNak}${profile?.pada ? ` (Pada ${profile.pada})` : ""}
Lagna (Ascendant): ${userLagna}
Prakriti / Dosha: ${profile?.dosha ?? panchanga.dosha}
Natal Moon longitude: ${profile?.moon_longitude ?? "—"}°
Natal Sun longitude: ${profile?.sun_longitude ?? "—"}°
Birth: ${profile?.birth_date ?? "—"} · ${profile?.birth_place ?? "—"}

— Today (${dateStr}) Panchanga —
Tithi: ${panchanga.tithiName}
Vara: ${panchanga.varaName}
Nakshatra (Moon today): ${panchanga.nakshatraName}
Yoga: ${panchanga.yogaName}
Dosha balance: ${panchanga.dosha}

Tune the morning_guidance and evening_guidance specifically to this seeker — reference how today's Moon Nakshatra (${panchanga.nakshatraName}) interacts with their natal Moon in ${userNak} and their ${userLagna} Lagna. Make them feel personal, not generic.

Return STRICT JSON with these keys:
- vibe_theme: 3-5 word evocative title
- vibe_description: 1-2 sentence poetic description tying today's nakshatra + their dosha to their day
- vibe_color: hex color matching the vibe
- vibe_icon: single emoji
- mantra: Sanskrit mantra with English transliteration
- planetary_insight: 1-2 sentences about today's ruling planet's influence on this seeker's chart
- spiritual_guidance: a meditation or ritual to do today (2 sentences)
- practical_tip: actionable advice for the day
- ayurvedic_tip: dosha-specific wellness tip (food/herb/practice)
- lucky_color: hex color
- lucky_number: integer 1-99
- cosmic_energy: integer 1-100 (today's vitality for this seeker)
- deity: deity to honor today
- morning_guidance: 2-3 sentence guided sunrise practice (breath, mantra, intention) explicitly tuned to their Rasi/Nakshatra/Lagna/Dosha
- evening_guidance: 2-3 sentence guided sunset/night practice (reflection, release, gratitude) explicitly tuned to their Rasi/Nakshatra/Lagna/Dosha

Return ONLY the JSON object, no markdown.`;

      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: [
            {
              role: "system",
              content:
                "You are a learned Vedic (Jyotish) astrologer writing personalized daily guidance. Output only valid JSON, no prose, no markdown.",
            },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
        }),
      });
      if (res.status === 429) throw new Error("rate-limited");
      if (res.status === 402) throw new Error("credits-exhausted");
      if (!res.ok) throw new Error(`AI ${res.status}`);
      const j = await res.json();
      const raw = j.choices?.[0]?.message?.content ?? "{}";
      content = SCHEMA.parse(JSON.parse(raw));
    } catch (e) {
      console.error("daily content AI failed:", e);
      content = fallback(panchanga);
    }

    // Deterministic lucky color & number — stable per user per day, never drifts on reload
    const LUCKY_PALETTE = [
      "#f59e0b", "#34d399", "#a78bfa", "#f472b6", "#22d3ee",
      "#fb7185", "#facc15", "#60a5fa", "#c084fc",
    ];
    let seed = 0;
    const seedStr = `${userId}-${dateStr}`;
    for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
    content.lucky_color = LUCKY_PALETTE[seed % LUCKY_PALETTE.length];
    content.lucky_number = (seed % 99) + 1;

    // Upsert cache (idempotent — same date+user never produces duplicates or drift)
    const { data: saved } = await supabase
      .from("daily_content")
      .upsert(
        { user_id: userId, date: dateStr, ...content },
        { onConflict: "user_id,date" }
      )
      .select()
      .single();

    return saved ?? { user_id: userId, date: dateStr, ...content };
  });


