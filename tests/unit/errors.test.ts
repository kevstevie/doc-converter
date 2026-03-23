import { describe, it, expect } from 'vitest'
import { DccError } from '../../src/core/errors.js'

describe('DccError', () => {
  it('sets code, message, and suggestion', () => {
    const err = new DccError('INPUT_NOT_FOUND', 'file not found', 'check path')
    expect(err.code).toBe('INPUT_NOT_FOUND')
    expect(err.message).toBe('file not found')
    expect(err.suggestion).toBe('check path')
  })

  it('works without suggestion', () => {
    const err = new DccError('RENDER_FAILED', 'render error')
    expect(err.code).toBe('RENDER_FAILED')
    expect(err.message).toBe('render error')
    expect(err.suggestion).toBeUndefined()
  })

  it('is an instance of Error', () => {
    const err = new DccError('INVALID_FORMAT', 'bad format')
    expect(err).toBeInstanceOf(Error)
    expect(err).toBeInstanceOf(DccError)
  })

  it('has correct name', () => {
    const err = new DccError('INVALID_OPTIONS', 'bad opts')
    expect(err.name).toBe('DccError')
  })
})
