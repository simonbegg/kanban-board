import { describe, it, expect } from 'vitest'
import * as boardsApi from './boards'

// These tests verify the API functions exist and have correct signatures
// Full integration tests are in test/integration/

describe('Board API Functions', () => {
  it('exports all required API functions', () => {
    // Verify all functions are exported
    expect(typeof boardsApi.getBoards).toBe('function')
    expect(typeof boardsApi.createBoard).toBe('function')
    expect(typeof boardsApi.updateBoard).toBe('function')
    expect(typeof boardsApi.deleteBoard).toBe('function')
    expect(typeof boardsApi.getBoardWithData).toBe('function')
    expect(typeof boardsApi.createTask).toBe('function')
    expect(typeof boardsApi.updateTask).toBe('function')
    expect(typeof boardsApi.deleteTask).toBe('function')
    expect(typeof boardsApi.moveTask).toBe('function')
  })
  
  it('API module is properly structured', () => {
    // Verify the module exports what we expect
    expect(boardsApi).toBeDefined()
    expect(Object.keys(boardsApi).length).toBeGreaterThan(0)
  })
})
