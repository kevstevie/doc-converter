import { rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { randomUUID } from 'node:crypto'
import type { ConversionOptions, ConversionResult } from './types.js'
import { DccError } from './errors.js'
import { convertMdToHtml } from './converters/md-to-html.js'
import { convertHtmlToPdf } from './converters/html-to-pdf.js'

export async function convert(options: ConversionOptions): Promise<ConversionResult> {
  const { from, to, input, output } = options

  if (from === 'md' && to === 'html') {
    return convertMdToHtml({ input, output })
  }

  if (from === 'html' && to === 'pdf') {
    return convertHtmlToPdf({ input, output })
  }

  if (from === 'md' && to === 'pdf') {
    return convertMdToPdf(input, output)
  }

  throw new DccError(
    'UNSUPPORTED_CONVERSION',
    `${from}→${to} is not supported`,
    'Run dcc formats to see supported conversions'
  )
}

async function convertMdToPdf(input: string, output?: string): Promise<ConversionResult> {
  const tempHtml = join(tmpdir(), `dcc-${randomUUID()}.html`)

  try {
    await convertMdToHtml({ input, output: tempHtml })
    return await convertHtmlToPdf({ input: tempHtml, output })
  } finally {
    await rm(tempHtml, { force: true })
  }
}
