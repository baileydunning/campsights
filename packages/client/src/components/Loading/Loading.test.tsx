import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import Loading from './Loading'

describe('<Loading />', () => {
  it('renders the loading screen with tent SVG', () => {
    render(<Loading />)
    expect(screen.getByRole('img', { name: /campsite tent marker/i })).toBeInTheDocument()
    expect(document.querySelector('.breathing-tent')).toBeInTheDocument()
    expect(document.querySelector('.loading-screen')).toBeInTheDocument()
  })
})
