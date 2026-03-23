import { access, stat } from 'node:fs/promises'
import { extname } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { ConversionResult } from '../types.js'
import { DccError } from '../errors.js'
import { getBrowser } from './browser.js'

export interface HtmlToPdfOptions {
  input: string
  output?: string
}

function deriveOutputPath(input: string): string {
  const ext = extname(input)
  if (ext.toLowerCase() === '.html') {
    return input.slice(0, -ext.length) + '.pdf'
  }
  return input + '.pdf'
}

export async function convertHtmlToPdf(options: HtmlToPdfOptions): Promise<ConversionResult> {
  const { input } = options
  const output = options.output ?? deriveOutputPath(input)

  const start = Date.now()

  try {
    await access(input)
  } catch {
    throw new DccError(
      'INPUT_NOT_FOUND',
      `Input file not found: ${input}`,
      'Check that the file path is correct and the file exists'
    )
  }

  const browser = await getBrowser()
  const page = await browser.newPage()

  try {
    const fileUrl = pathToFileURL(input).href
    await page.goto(fileUrl, { waitUntil: 'networkidle0' })

    await page.pdf({
      path: output,
      format: 'A4',
      printBackground: true,
      margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' },
    })
  } catch (err) {
    if (err instanceof DccError) throw err
    throw new DccError(
      'RENDER_FAILED',
      `Failed to render PDF: ${err instanceof Error ? err.message : String(err)}`,
      'Check that the HTML file is valid and Chromium is available'
    )
  } finally {
    await page.close()
  }

  const { size } = await stat(output)

  return {
    outputFile: output,
    bytesWritten: size,
    conversionTimeMs: Date.now() - start,
  }
}
