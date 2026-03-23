import type { ApiResponse, ConversionResult } from '../core/types.js'
import { DccError } from '../core/errors.js'

export function formatSuccess(data: ConversionResult): ApiResponse<ConversionResult> {
  return { success: true, data }
}

export function formatError(err: DccError | Error): ApiResponse<never> {
  if (err instanceof DccError) {
    const error: ApiResponse<never>['error'] = {
      code: err.code,
      message: err.message,
      ...(err.suggestion !== undefined && { suggestion: err.suggestion }),
    }
    return { success: false, error }
  }

  return {
    success: false,
    error: { code: 'RENDER_FAILED', message: err.message },
  }
}

export function printResult(result: ApiResponse<unknown>): void {
  const json = JSON.stringify(result, null, 2) + '\n'
  if (result.success) {
    process.stdout.write(json)
  } else {
    process.stderr.write(json)
  }
}
