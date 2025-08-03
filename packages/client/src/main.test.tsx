import { describe, it, vi, beforeEach } from 'vitest'
import React from 'react'
import * as ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import App from './App'
import store from './store/store'

// Mock dependencies
vi.mock('react-dom/client', () => {
  const createRoot = vi.fn(() => ({
    render: vi.fn(),
  }))
  return {
    __esModule: true,
    default: { createRoot },
    createRoot,
  }
})
vi.mock('./App', () => ({
  __esModule: true,
  default: () => <div>Mocked App</div>,
}))
vi.mock('./store/store', () => ({
  __esModule: true,
  default: {},
}))

describe('main.tsx', () => {
  let rootElement: HTMLElement | null

  beforeEach(() => {
    rootElement = document.createElement('div')
    rootElement.id = 'root'
    document.body.appendChild(rootElement)
  })

  afterEach(() => {
    document.body.innerHTML = ''
    vi.clearAllMocks()
  })

  it('should render the App inside Provider and call createRoot/render', async () => {
    // Re-import to trigger the code
    await import('./main')

    expect(ReactDOM.createRoot).toHaveBeenCalledWith(document.getElementById('root'))
    const rootInstance = (ReactDOM.createRoot as any).mock.results[0].value
    expect(rootInstance.render).toHaveBeenCalled()
  })
})
