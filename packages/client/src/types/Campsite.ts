import { WeatherPeriod } from "./Weather";

export interface Campsite {
  id: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
  requires_4wd: boolean;
  elevation?: number | null;
  weather: WeatherPeriod[]; 
  last_updated: string;
}

export interface CampsitesState {
  campsites: Campsite[];
  loading: boolean;
  error: string | null;
}