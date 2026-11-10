import type { WeatherPeriod } from "../../types/Weather";

export type WeatherKind = "clear" | "partly" | "cloudy" | "rain" | "storm" | "snow" | "fog" | "wind";

export const weatherKind = (forecast: string): WeatherKind => {
  const f = forecast.toLowerCase();
  if (f.includes("thunder")) return "storm";
  if (/(snow|flurr|sleet|ice|freezing|blizzard)/.test(f)) return "snow";
  if (/(rain|shower|drizzle)/.test(f)) return "rain";
  if (/(fog|haze|smoke|dust)/.test(f)) return "fog";
  if (/(partly|mostly sunny|mostly clear|few clouds|becoming sunny)/.test(f)) return "partly";
  if (/(cloud|overcast)/.test(f)) return "cloudy";
  if (/(wind|breezy|blustery|gust)/.test(f)) return "wind";
  return "clear";
};

export interface ForecastDay {
  key: string;
  name: string;
  high: number | null;
  low: number | null;
  unit: string;
  shortForecast: string;
  detailedForecast: string;
  kind: WeatherKind;
  isNight: boolean; // true when the day only has a night period (e.g. "Tonight")
  precip: number | null;
  wind: string;
}

// NWS returns alternating day/night periods. Pair them into one card per day:
// the day period gives the high and conditions, the night period the low.
export const groupForecast = (periods: WeatherPeriod[]): ForecastDay[] => {
  const days: ForecastDay[] = [];
  for (const p of periods) {
    const precip = p.probabilityOfPrecipitation?.value ?? null;
    if (p.isDaytime || days.length === 0) {
      days.push({
        key: String(p.number),
        name: p.name,
        high: p.isDaytime ? p.temperature : null,
        low: p.isDaytime ? null : p.temperature,
        unit: p.temperatureUnit,
        shortForecast: p.shortForecast,
        detailedForecast: p.detailedForecast,
        kind: weatherKind(p.shortForecast),
        isNight: !p.isDaytime,
        precip,
        wind: `${p.windDirection} ${p.windSpeed}`.trim(),
      });
    } else {
      const day = days[days.length - 1];
      if (day.low === null) day.low = p.temperature;
      if (precip !== null) day.precip = Math.max(day.precip ?? 0, precip);
    }
  }
  return days;
};
