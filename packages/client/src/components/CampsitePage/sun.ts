// Sunrise and sunset from the standard sunrise equation (accurate to a minute
// or two, which is plenty for planning). See https://en.wikipedia.org/wiki/Sunrise_equation

const RAD = Math.PI / 180;
const J2000 = 2451545.0;
const toJulian = (ms: number) => ms / 86400000 + 2440587.5;
const fromJulian = (j: number) => new Date((j - 2440587.5) * 86400000);

export interface SunTimes {
  sunrise: Date;
  sunset: Date;
  daylightMinutes: number;
}

export const getSunTimes = (date: Date, lat: number, lng: number): SunTimes | null => {
  // Day number whose solar noon at this longitude is closest to the given time.
  const n = Math.round(toJulian(date.getTime()) - J2000 + lng / 360);
  const jStar = n - lng / 360;
  const M = (357.5291 + 0.98560028 * jStar) % 360;
  const C = 1.9148 * Math.sin(M * RAD) + 0.02 * Math.sin(2 * M * RAD) + 0.0003 * Math.sin(3 * M * RAD);
  const lambda = (M + C + 180 + 102.9372) % 360;
  const jTransit = J2000 + jStar + 0.0053 * Math.sin(M * RAD) - 0.0069 * Math.sin(2 * lambda * RAD);
  const sinDecl = Math.sin(lambda * RAD) * Math.sin(23.4397 * RAD);
  const cosDecl = Math.cos(Math.asin(sinDecl));
  const cosHour = (Math.sin(-0.833 * RAD) - Math.sin(lat * RAD) * sinDecl) / (Math.cos(lat * RAD) * cosDecl);
  if (cosHour < -1 || cosHour > 1) return null; // midnight sun or polar night
  const hourAngle = Math.acos(cosHour) / RAD;
  const sunrise = fromJulian(jTransit - hourAngle / 360);
  const sunset = fromJulian(jTransit + hourAngle / 360);
  return { sunrise, sunset, daylightMinutes: Math.round((sunset.getTime() - sunrise.getTime()) / 60000) };
};
