export interface WeatherPeriod {
  number: number;
  name: string;
  startTime: string;
  endTime: string;
  isDaytime: boolean;
  temperature: number;
  temperatureUnit: string;
  windSpeed: string;
  windDirection: string;
  shortForecast: string;
  detailedForecast: string;
  probabilityOfPrecipitation?: { value: number | null };
}

export interface WeatherAlert {
  event: string;
  headline?: string;
  severity?: string;
  description?: string;
  instruction?: string;
  ends?: string;
}
