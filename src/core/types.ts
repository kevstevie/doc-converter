export type ConversionFormat = 'md' | 'html' | 'pdf'

export interface ConversionOptions {
  from: ConversionFormat
  to: ConversionFormat
  input: string
  output?: string
}

export interface ConversionResult {
  outputFile: string
  bytesWritten: number
  conversionTimeMs: number
}

export type ErrorCode =
  | 'INPUT_NOT_FOUND'
  | 'INPUT_UNREADABLE'
  | 'UNSUPPORTED_CONVERSION'
  | 'INVALID_FORMAT'
  | 'INVALID_OPTIONS'
  | 'RENDER_FAILED'
  | 'OUTPUT_WRITE_FAILED'
  | 'CHROMIUM_NOT_AVAILABLE'

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: ErrorCode
    message: string
    suggestion?: string
  }
}
