import { describe, it, expect } from "vitest";
import { groupForecast, weatherKind } from "./weather";
import { getSunTimes } from "./sun";

const period = (number: number, name: string, isDaytime: boolean, temperature: number, shortForecast: string, precip: number | null = null) => ({
  number, name, isDaytime, temperature, shortForecast,
  startTime: "", endTime: "", temperatureUnit: "F", windSpeed: "5 mph", windDirection: "SW",
  detailedForecast: `${shortForecast}.`, probabilityOfPrecipitation: { value: precip },
});

describe("groupForecast", () => {
  it("pairs day and night periods into one day with high and low", () => {
    const days = groupForecast([
      period(1, "Tuesday", true, 61, "Sunny"),
      period(2, "Tuesday Night", false, 33, "Clear", 10),
      period(3, "Wednesday", true, 55, "Chance Rain Showers", 40),
    ]);
    expect(days).toHaveLength(2);
    expect(days[0]).toMatchObject({ name: "Tuesday", high: 61, low: 33, kind: "clear", precip: 10 });
    expect(days[1]).toMatchObject({ name: "Wednesday", high: 55, low: null, kind: "rain", precip: 40 });
  });

  it("starts with a night-only card when the forecast begins tonight", () => {
    const days = groupForecast([period(1, "Tonight", false, 28, "Mostly Clear"), period(2, "Wednesday", true, 50, "Sunny")]);
    expect(days[0]).toMatchObject({ name: "Tonight", high: null, low: 28, isNight: true, kind: "partly" });
  });
});

describe("weatherKind", () => {
  it.each([
    ["Slight Chance Showers And Thunderstorms", "storm"],
    ["Light Snow Likely", "snow"],
    ["Areas Of Smoke", "fog"],
    ["Mostly Cloudy", "cloudy"],
    ["Partly Sunny", "partly"],
    ["Breezy", "wind"],
    ["Sunny", "clear"],
  ])("%s -> %s", (text, kind) => expect(weatherKind(text)).toBe(kind));
});

describe("getSunTimes", () => {
  it("matches published sunrise and sunset for Denver within a few minutes", () => {
    const t = getSunTimes(new Date("2026-11-10T19:00:00Z"), 39.74, -104.99)!;
    const fmt = (d: Date) => d.toLocaleTimeString("en-US", { timeZone: "America/Denver", hour: "numeric", minute: "2-digit" });
    expect(fmt(t.sunrise)).toMatch(/^6:(3[6-9]|4[0-2]) AM$/);
    expect(fmt(t.sunset)).toMatch(/^4:(4[6-9]|5[0-2]) PM$/);
  });
});
