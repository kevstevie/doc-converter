import { describe, it, expect, vi, beforeEach } from 'vitest'
import { formatSuccess, formatError, printResult } from '../../src/cli/output.js'
import { DccError } from '../../src/core/errors.js'

describe('formatSuccess', () => {
  it('returns success response with data', () => {
    const result = formatSuccess({
      outputFile: 'out.html',
      bytesWritten: 1024,
      conversionTimeMs: 42,
    })
    expect(result).toEqual({
      success: true,
      data: { outputFile: 'out.html', bytesWritten: 1024, conversionTimeMs: 42 },
    })
  })
})

describe('formatError', () => {
  it('returns error response from DccError', () => {
    const err = new DccError('INPUT_NOT_FOUND', 'file not found', 'check path')
    const result = formatError(err)
    expect(result).toEqual({
      success: false,
      error: { code: 'INPUT_NOT_FOUND', message: 'file not found', suggestion: 'check path' },
    })
  })

  it('returns error response from DccError without suggestion', () => {
    const err = new DccError('RENDER_FAILED', 'render failed')
    const result = formatError(err)
    expect(result.success).toBe(false)
    expect(result.error?.code).toBe('RENDER_FAILED')
    expect(result.error?.suggestion).toBeUndefined()
  })

  it('returns error response from generic Error', () => {
    const err = new Error('unexpected error')
    const result = formatError(err)
    expect(result.success).toBe(false)
    expect(result.error?.code).toBe('RENDER_FAILED')
    expect(result.error?.message).toBe('unexpected error')
  })
})

describe('printResult', () => {
  beforeEach(() => {
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
    vi.spyOn(process.stderr, 'write').mockImplementation(() => true)
  })

  it('writes JSON to stdout on success', () => {
    const response = { success: true, data: { outputFile: 'out.html', bytesWritten: 100, conversionTimeMs: 10 } }
    printResult(response)
    expect(process.stdout.write).toHaveBeenCalledWith(
      JSON.stringify(response, null, 2) + '\n'
    )
    expect(process.stderr.write).not.toHaveBeenCalled()
  })

  it('writes JSON to stderr on error', () => {
    const response = { success: false, error: { code: 'INPUT_NOT_FOUND' as const, message: 'not found' } }
    printResult(response)
    expect(process.stderr.write).toHaveBeenCalledWith(
      JSON.stringify(response, null, 2) + '\n'
    )
    expect(process.stdout.write).not.toHaveBeenCalled()
  })
})
