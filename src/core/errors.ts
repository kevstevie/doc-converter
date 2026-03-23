import type { ErrorCode } from './types.js'

export class DccError extends Error {
  readonly code: ErrorCode
  readonly suggestion?: string

  constructor(code: ErrorCode, message: string, suggestion?: string) {
    super(message)
    this.name = 'DccError'
    this.code = code
    this.suggestion = suggestion
  }
}
