import { describe, it, expect } from 'vitest'

import store, { RootState, AppDispatch } from './store'

describe('Redux Store', () => {
  it('should be defined', () => {
    expect(store).toBeDefined()
  })

  it('should have a getState method', () => {
    expect(typeof store.getState).toBe('function')
  })

  it('should have a dispatch method', () => {
    expect(typeof store.dispatch).toBe('function')
  })

  it('should have campsites in the state', () => {
    const state: RootState = store.getState()
    expect(state).toHaveProperty('campsites')
  })

  it('AppDispatch should be assignable from store.dispatch', () => {
    const dispatch: AppDispatch = store.dispatch
    expect(dispatch).toBe(store.dispatch)
  })
})
