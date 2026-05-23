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
});

type DailyContent = z.infer<typeof SCHEMA>;

function fallback(p: ReturnType<typeof computePanchanga>): DailyContent {
  const vibe =
    p.dosha === "vata"
      ? { vibe_theme: "Move with grace", vibe_color: "#a78bfa", vibe_icon: "🌬️" }
      : p.dosha === "pitta"
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
      p.dosha === "vata"
        ? "Warm sesame oil massage and ginger tea will steady your day."
        : p.dosha === "pitta"
        ? "Cool coconut water and mint balance excess heat."
        : "Light, warm, spiced food keeps kapha agile.",
    lucky_color: vibe.vibe_color,
    lucky_number: ((p.tithi + p.nakshatra) % 9) + 1,
    cosmic_energy: 50 + ((p.yoga * 7) % 40),
    deity: ["Ganesha", "Shiva", "Lakshmi", "Saraswati", "Hanuman", "Durga", "Vishnu"][p.vara],
  };
}

export const getDailyContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { isoDate?: string }) =>
    z.object({ isoDate: z.string().optional() }).parse(input ?? {})
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const date = data.isoDate ? new Date(data.isoDate) : new Date();
    const dateStr = date.toISOString().slice(0, 10);

    // Check cache
    const { data: cached } = await supabase
      .from("daily_content")
      .select("*")
      .eq("user_id", userId)
      .eq("date", dateStr)
      .maybeSingle();
    if (cached?.mantra) return cached;

    const panchanga = computePanchanga(date);

    // Get profile for personalization
    const { data: profile } = await supabase
      .from("profiles")
      .select("rasi, nakshatra, dosha, name")
      .eq("user_id", userId)
      .maybeSingle();

    let content: DailyContent;
    try {
      const apiKey = process.env.LOVABLE_API_KEY;
      if (!apiKey) throw new Error("no key");

      const prompt = `Generate today's Vedic astrology guidance as JSON for a user.
Date: ${dateStr}
User Rasi: ${profile?.rasi ?? "unknown"} | Nakshatra: ${profile?.nakshatra ?? "unknown"} | Dosha: ${profile?.dosha ?? panchanga.dosha}
Today's Panchanga: Tithi ${panchanga.tithiName}, ${panchanga.varaName}, Nakshatra ${panchanga.nakshatraName}, Yoga ${panchanga.yogaName}, Dosha ${panchanga.dosha}.

Return STRICT JSON with these keys:
- vibe_theme: 3-5 word evocative title
- vibe_description: 1-2 sentence poetic description tying nakshatra+dosha to the day
- vibe_color: hex color matching the vibe
- vibe_icon: single emoji
- mantra: Sanskrit mantra with English transliteration
- planetary_insight: 1-2 sentences about today's ruling planet's influence
- spiritual_guidance: a meditation or ritual to do today (2 sentences)
- practical_tip: actionable advice for the day
- ayurvedic_tip: dosha-specific wellness tip (food/herb/practice)
- lucky_color: hex color
- lucky_number: integer 1-99
- cosmic_energy: integer 1-100 (today's vitality)
- deity: deity to honor today

Return ONLY the JSON object, no markdown.`;

      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "You are a Vedic astrologer. Output only valid JSON." },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
        }),
      });
      if (!res.ok) throw new Error(`AI ${res.status}`);
      const j = await res.json();
      const raw = j.choices?.[0]?.message?.content ?? "{}";
      content = SCHEMA.parse(JSON.parse(raw));
    } catch (e) {
      console.error("daily content AI failed:", e);
      content = fallback(panchanga);
    }

    // Cache
    const { data: saved } = await supabase
      .from("daily_content")
      .insert({ user_id: userId, date: dateStr, ...content })
      .select()
      .single();

    return saved ?? { user_id: userId, date: dateStr, ...content };
  });
