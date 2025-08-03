import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import WeatherCard from './WeatherCard'
import { WeatherPeriod } from '../../types/Weather'

const mockWeatherData: WeatherPeriod[] = [
  {
    number: 1,
    name: 'Monday',
    startTime: '2024-06-10T06:00:00-04:00',
    endTime: '2024-06-10T18:00:00-04:00',
    isDaytime: true,
    temperature: 75,
    temperatureUnit: 'F',
    windSpeed: '10 mph',
    windDirection: 'NW',
    shortForecast: 'Sunny',
    detailedForecast: 'Clear skies throughout the day.',
  },
  {
    number: 2,
    name: 'Monday Night',
    startTime: '2024-06-10T18:00:00-04:00',
    endTime: '2024-06-11T06:00:00-04:00',
    isDaytime: false,
    temperature: 55,
    temperatureUnit: 'F',
    windSpeed: '5 mph',
    windDirection: 'N',
    shortForecast: 'Clear',
    detailedForecast: 'Clear and cool overnight.',
  },
]

describe('WeatherCard', () => {
  it('renders loading spinner when weatherData is undefined', () => {
    render(<WeatherCard campsiteId="1" />)
    expect(screen.getByTestId('weather-spinner')).toBeInTheDocument()
  })

  it("renders 'No weather data available' when weatherData is empty", () => {
    render(<WeatherCard campsiteId="1" weatherData={[]} />)
    expect(screen.getByText(/No weather data available/i)).toBeInTheDocument()
  })

  it('renders weather periods when weatherData is provided', () => {
    render(<WeatherCard campsiteId="1" weatherData={mockWeatherData} />)
    expect(screen.getByText(/Monday \(Day\)/)).toBeInTheDocument()
    expect(screen.getByText(/Monday Night \(Night\)/)).toBeInTheDocument()
    expect(screen.getAllByText(/Temp:/)).toHaveLength(2)
    expect(screen.getAllByText(/Wind:/)).toHaveLength(2)
    expect(screen.getAllByText(/Forecast:/)).toHaveLength(2)
    expect(screen.getByText(/Clear skies throughout the day./)).toBeInTheDocument()
    expect(screen.getByText(/Clear and cool overnight./)).toBeInTheDocument()
  })
})
