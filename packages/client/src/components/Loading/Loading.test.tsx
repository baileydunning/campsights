import { render, screen } from '@testing-library/react'
import Loading from './Loading'
import { describe, it, expect } from 'vitest'

describe('<Loading />', () => {
  it('renders the loading screen with tent SVG', () => {
    render(<Loading />)
    expect(screen.getByRole('img', { name: /campsite tent marker/i })).toBeInTheDocument()
    expect(document.querySelector('.breathing-tent')).toBeInTheDocument()
    expect(document.querySelector('.loading-screen')).toBeInTheDocument()
  })
})
