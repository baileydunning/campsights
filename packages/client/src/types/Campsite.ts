export interface Campsite {
  id: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
  elevation?: number | null;
  requires_4wd: boolean;
  last_updated: string;
}

export interface CampsitesState {
  campsites: Campsite[];
  loading: boolean;
  error: string | null;
}