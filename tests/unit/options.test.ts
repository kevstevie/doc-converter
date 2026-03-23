import { describe, it, expect } from 'vitest'
import { validateOptions } from '../../src/cli/options.js'
import { DccError } from '../../src/core/errors.js'

describe('validateOptions', () => {
  it('returns valid options unchanged', () => {
    const result = validateOptions({ from: 'md', to: 'html', input: 'doc.md' })
    expect(result).toEqual({ from: 'md', to: 'html', input: 'doc.md' })
  })

  it('includes output when provided', () => {
    const result = validateOptions({ from: 'html', to: 'pdf', input: 'page.html', output: 'page.pdf' })
    expect(result).toEqual({ from: 'html', to: 'pdf', input: 'page.html', output: 'page.pdf' })
  })

  it('throws DccError(INVALID_OPTIONS) when input is missing', () => {
    expect(() => validateOptions({ from: 'md', to: 'html' })).toThrow(DccError)
    expect(() => validateOptions({ from: 'md', to: 'html' })).toThrow(
      expect.objectContaining({ code: 'INVALID_OPTIONS' })
    )
  })

  it('throws DccError(INVALID_FORMAT) when from is invalid', () => {
    expect(() => validateOptions({ from: 'docx', to: 'html', input: 'doc.docx' })).toThrow(DccError)
    expect(() => validateOptions({ from: 'docx', to: 'html', input: 'doc.docx' })).toThrow(
      expect.objectContaining({ code: 'INVALID_FORMAT' })
    )
  })

  it('throws DccError(INVALID_FORMAT) when to is invalid', () => {
    expect(() => validateOptions({ from: 'md', to: 'docx', input: 'doc.md' })).toThrow(DccError)
    expect(() => validateOptions({ from: 'md', to: 'docx', input: 'doc.md' })).toThrow(
      expect.objectContaining({ code: 'INVALID_FORMAT' })
    )
  })

  it('throws DccError(INVALID_OPTIONS) when from is missing', () => {
    expect(() => validateOptions({ to: 'html', input: 'doc.md' })).toThrow(
      expect.objectContaining({ code: 'INVALID_OPTIONS' })
    )
  })
})
