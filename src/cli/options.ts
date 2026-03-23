import { z } from 'zod'
import type { ConversionOptions } from '../core/types.js'
import { DccError } from '../core/errors.js'

const ConversionFormatSchema = z.enum(['md', 'html', 'pdf'])

const ConversionOptionsSchema = z.object({
  from: ConversionFormatSchema,
  to: ConversionFormatSchema,
  input: z.string().min(1),
  output: z.string().optional(),
})

export function validateOptions(raw: unknown): ConversionOptions {
  const result = ConversionOptionsSchema.safeParse(raw)

  if (!result.success) {
    const issues = result.error.issues
    const formatIssue = issues.find(
      (i) =>
        (i.path.includes('from') || i.path.includes('to')) &&
        i.code === 'invalid_enum_value'
    )

    if (formatIssue) {
      throw new DccError(
        'INVALID_FORMAT',
        `Invalid format: ${formatIssue.message}`,
        `Supported formats: md, html, pdf`
      )
    }

    throw new DccError(
      'INVALID_OPTIONS',
      `Invalid options: ${issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ')}`,
      'Run dcc --help for usage information'
    )
  }

  return result.data
}
