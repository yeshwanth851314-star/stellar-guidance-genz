import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import * as Astronomy from "astronomy-engine";
import { computePanchanga } from "./panchanga.functions";

function lahiriAyanamsha(date: Date): number {
  const y = date.getUTCFullYear() + date.getUTCMonth() / 12;
  return 23.85 + ((y - 2000) * 50.3) / 3600;
}

function computeLagna(date: Date, latDeg: number, lngDeg: number): { tropical: number; sidereal: number; rasi: number } {
  // Greenwich Apparent Sidereal Time in hours
  const gstHours = Astronomy.SiderealTime(date);
  let lstHours = gstHours + lngDeg / 15;
  lstHours = ((lstHours % 24) + 24) % 24;
  const ramc = (lstHours * 15) * Math.PI / 180;

  const eps = 23.4392911 * Math.PI / 180;
  const lat = latDeg * Math.PI / 180;

  // Standard Ascendant formula
  const y = -Math.cos(ramc);
  const x = Math.sin(ramc) * Math.cos(eps) + Math.tan(lat) * Math.sin(eps);
  let asc = Math.atan2(y, x) * 180 / Math.PI;
  asc = ((asc % 360) + 360) % 360;

  const ayan = lahiriAyanamsha(date);
  let sidereal = asc - ayan;
  sidereal = ((sidereal % 360) + 360) % 360;
  return { tropical: +asc.toFixed(4), sidereal: +sidereal.toFixed(4), rasi: Math.floor(sidereal / 30) };
}

export const geocodePlace = createServerFn({ method: "POST" })
  .inputValidator((input: { place: string }) =>
    z.object({ place: z.string().min(2).max(200) }).parse(input)
  )
  .handler(async ({ data }) => {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(data.place)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "stellar-guidance/1.0 (vedic-astro app)" },
    });
    if (!res.ok) throw new Error(`Geocoding failed (${res.status})`);
    const arr = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
    if (!arr.length) throw new Error("Place not found");
    const r = arr[0];
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    // Rough timezone offset by longitude, rounded to 0.5h
    const approxTz = Math.round((lng / 15) * 2) / 2;
    return { lat, lng, display_name: r.display_name, approxTzHours: approxTz };
  });

export const computeFullChart = createServerFn({ method: "POST" })
  .inputValidator((input: {
    birthDate: string; // YYYY-MM-DD
    birthTime: string; // HH:MM (local)
    tzOffsetHours: number;
    lat: number;
    lng: number;
  }) =>
    z.object({
      birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      birthTime: z.string().regex(/^\d{2}:\d{2}$/),
      tzOffsetHours: z.number().min(-12).max(14),
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    }).parse(input)
  )
  .handler(async ({ data }) => {
    const [hh, mm] = data.birthTime.split(":").map(Number);
    const [Y, M, D] = data.birthDate.split("-").map(Number);
    // Local time → UTC
    const utcMillis = Date.UTC(Y, M - 1, D, hh, mm) - data.tzOffsetHours * 3600_000;
    const utc = new Date(utcMillis);

    const p = computePanchanga(utc);
    const lagna = computeLagna(utc, data.lat, data.lng);

    return { panchanga: p, lagna, utcIso: utc.toISOString() };
  });
