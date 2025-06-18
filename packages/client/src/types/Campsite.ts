export interface Campsite {
  id: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
  rating: number;
  requires_4wd?: boolean;
}

export interface CampsitePayload {
  id: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
  rating: number;
  requires_4wd?: boolean;
  last_updated: string;
}