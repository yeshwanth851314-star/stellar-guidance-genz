import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import * as Astronomy from "astronomy-engine";

// Rahu kalam slot per weekday (0=Sun..6=Sat), 1-indexed slot of 8 day-segments
const RAHU_SLOT: Record<number, number> = { 0: 8, 1: 2, 2: 7, 3: 5, 4: 6, 5: 4, 6: 3 };

function fmt(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
}

export const getMuhurats = createServerFn({ method: "POST" })
  .inputValidator((input: { lat: number; lng: number; isoDate?: string }) =>
    z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
      isoDate: z.string().optional(),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const date = data.isoDate ? new Date(data.isoDate) : new Date();
    const observer = new Astronomy.Observer(data.lat, data.lng, 0);
    // Search from start of local day (in UTC approx) for sunrise/sunset
    const dayStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const sunrise = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, +1, dayStart, 1);
    const sunset = Astronomy.SearchRiseSet(Astronomy.Body.Sun, observer, -1, dayStart, 1);

    const sr = sunrise ? sunrise.date : null;
    const ss = sunset ? sunset.date : null;
    if (!sr || !ss) {
      return { sunrise: null, sunset: null, rahuKalam: null, abhijit: null, brahmaMuhurta: null };
    }

    const dayMs = ss.getTime() - sr.getTime();
    const slotMs = dayMs / 8;
    const weekday = sr.getDay();
    const rahuSlot = RAHU_SLOT[weekday];
    const rahuStart = new Date(sr.getTime() + (rahuSlot - 1) * slotMs);
    const rahuEnd = new Date(rahuStart.getTime() + slotMs);

    // Abhijit: middle 1/15 segment around solar noon (centered between sunrise and sunset)
    const noon = new Date(sr.getTime() + dayMs / 2);
    const abhijitHalf = dayMs / 30;
    const abhijitStart = new Date(noon.getTime() - abhijitHalf);
    const abhijitEnd = new Date(noon.getTime() + abhijitHalf);

    // Brahma muhurta: 96 to 48 minutes before sunrise
    const brahmaStart = new Date(sr.getTime() - 96 * 60_000);
    const brahmaEnd = new Date(sr.getTime() - 48 * 60_000);

    return {
      sunrise: { time: fmt(sr), iso: sr.toISOString() },
      sunset: { time: fmt(ss), iso: ss.toISOString() },
      rahuKalam: { start: fmt(rahuStart), end: fmt(rahuEnd), label: "Inauspicious — avoid new beginnings" },
      abhijit: { start: fmt(abhijitStart), end: fmt(abhijitEnd), label: "Most auspicious — ideal for any important act" },
      brahmaMuhurta: { start: fmt(brahmaStart), end: fmt(brahmaEnd), label: "Sacred hour — meditation & spiritual practice" },
    };
  });
