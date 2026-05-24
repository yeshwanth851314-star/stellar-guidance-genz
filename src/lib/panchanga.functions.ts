import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import * as Astronomy from "astronomy-engine";

// Lahiri ayanamsha approximation (sidereal correction)
function lahiriAyanamsha(date: Date): number {
  // Year fractional
  const y = date.getUTCFullYear() + date.getUTCMonth() / 12;
  // approx: 23.85° in 2000, +50.3"/yr
  return 23.85 + ((y - 2000) * 50.3) / 3600;
}

const NAKSHATRAS = [
  "Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra","Punarvasu","Pushya","Ashlesha",
  "Magha","Purva Phalguni","Uttara Phalguni","Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha",
  "Mula","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishta","Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati",
];
const RASIS = ["Mesha","Vrishabha","Mithuna","Karka","Simha","Kanya","Tula","Vrischika","Dhanu","Makara","Kumbha","Meena"];
const VARAS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const YOGAS = ["Vishkambha","Priti","Ayushman","Saubhagya","Shobhana","Atiganda","Sukarman","Dhriti","Shoola","Ganda","Vriddhi","Dhruva","Vyaghata","Harshana","Vajra","Siddhi","Vyatipata","Variyan","Parigha","Shiva","Siddha","Sadhya","Shubha","Shukla","Brahma","Indra","Vaidhriti"];

const norm = (d: number) => ((d % 360) + 360) % 360;

function eclipticLongitude(body: Astronomy.Body, date: Date): number {
  const ecl = Astronomy.Ecliptic(Astronomy.GeoVector(body, date, false));
  return norm(ecl.elon);
}

export interface PanchangaResult {
  date: string;
  sunLongitude: number;
  moonLongitude: number;
  ayanamsha: number;
  rasi: number; // 0..11
  rasiName: string;
  nakshatra: number; // 0..26
  nakshatraName: string;
  pada: number; // 1..4
  tithi: number; // 1..30
  tithiName: string;
  vara: number; // 0..6
  varaName: string;
  yoga: number;
  yogaName: string;
  karana: number;
  dosha: "Vata" | "Pitta" | "Kapha";
}

function tithiName(t: number): string {
  const names = ["Pratipada","Dwitiya","Tritiya","Chaturthi","Panchami","Shashthi","Saptami","Ashtami","Navami","Dashami","Ekadashi","Dwadashi","Trayodashi","Chaturdashi","Purnima"];
  const paksha = t <= 15 ? "Shukla" : "Krishna";
  const idx = t <= 15 ? t - 1 : t === 30 ? 14 : t - 16;
  const display = t === 30 ? "Amavasya" : names[idx] ?? "Pratipada";
  return `${paksha} ${display}`;
}

function doshaOf(rasi: number): "Vata" | "Pitta" | "Kapha" {
  const fire = [0, 4, 8];
  const earth = [1, 5, 9];
  if (fire.includes(rasi)) return "Pitta";
  if (earth.includes(rasi)) return "Kapha";
  return "Vata";
}


export function computePanchanga(date: Date): PanchangaResult {
  const ayan = lahiriAyanamsha(date);
  const sunTrop = eclipticLongitude(Astronomy.Body.Sun, date);
  const moonTrop = eclipticLongitude(Astronomy.Body.Moon, date);
  const sun = norm(sunTrop - ayan);
  const moon = norm(moonTrop - ayan);

  const rasi = Math.floor(moon / 30);
  const nakIdx = Math.floor(moon / (360 / 27));
  const padaIdx = Math.floor((moon % (360 / 27)) / (360 / 27 / 4)) + 1;

  const diff = norm(moonTrop - sunTrop);
  const tithi = Math.floor(diff / 12) + 1;
  const yogaIdx = Math.floor(norm(sunTrop + moonTrop) / (360 / 27));
  const karana = Math.floor(diff / 6) + 1;

  return {
    date: date.toISOString().slice(0, 10),
    sunLongitude: +sun.toFixed(4),
    moonLongitude: +moon.toFixed(4),
    ayanamsha: +ayan.toFixed(4),
    rasi,
    rasiName: RASIS[rasi],
    nakshatra: nakIdx,
    nakshatraName: NAKSHATRAS[nakIdx],
    pada: padaIdx,
    tithi,
    tithiName: tithiName(tithi),
    vara: date.getUTCDay(),
    varaName: VARAS[date.getUTCDay()],
    yoga: yogaIdx,
    yogaName: YOGAS[yogaIdx],
    karana,
    dosha: doshaOf(rasi),
  };
}

export const getPanchanga = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { isoDate?: string }) =>
    z.object({ isoDate: z.string().datetime().optional() }).parse(input ?? {})
  )
  .handler(async ({ data }) => {
    const date = data.isoDate ? new Date(data.isoDate) : new Date();
    return computePanchanga(date);
  });
