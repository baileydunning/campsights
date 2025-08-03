import { WeatherPeriod } from './Weather'

export interface Campsite {
  id: string
  name: string
  url: string
  lat: number
  lng: number
  state: string
  mapLink: string
  elevation?: number | null
  weather?: WeatherPeriod[]
  description?: string
  directions?: string
  activities?: string[]
  campgrounds?: string[]
  wildlife?: string[]
  fees?: string
  stayLimit?: string
  images?: CampsiteImage[]
  source: 'BLM'
}

export interface CampsiteImage {
  src: string
  alt?: string
  credit?: string
}

export interface CampsitesState {
  campsites: Campsite[]
  loading: boolean
  error: string | null
}
