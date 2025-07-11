export interface Campsite {
  id: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
  requires_4wd: boolean;
  last_updated: string;
  elevation?: number | null;
}