import { describe, it, expect, afterAll } from 'vitest'
import { writeFile, rm, mkdtemp, access } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { convertHtmlToPdf } from '../../../src/core/converters/html-to-pdf.js'
import { closeBrowser } from '../../../src/core/converters/browser.js'
import { DccError } from '../../../src/core/errors.js'

const SIMPLE_HTML = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>Test</title></head>
<body><h1>Hello PDF</h1><p>Content here.</p></body></html>`

let tempDirs: string[] = []

async function createTempHtml(content: string = SIMPLE_HTML): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'dcc-pdf-test-'))
  tempDirs.push(dir)
  const filePath = join(dir, 'test.html')
  await writeFile(filePath, content, 'utf-8')
  return filePath
}

afterAll(async () => {
  await closeBrowser()
  for (const dir of tempDirs) {
    await rm(dir, { recursive: true, force: true })
  }
  tempDirs = []
})

describe('convertHtmlToPdf', () => {
  it('converts a simple HTML file to a PDF file', { timeout: 30000 }, async () => {
    const input = await createTempHtml()
    const output = input.replace('.html', '.pdf')

    const result = await convertHtmlToPdf({ input, output })

    expect(result.outputFile).toBe(output)
    await expect(access(output)).resolves.toBeUndefined()
  })

  it('returns bytesWritten > 0 and valid conversionTimeMs', { timeout: 30000 }, async () => {
    const input = await createTempHtml()
    const output = input.replace('.html', '.pdf')

    const result = await convertHtmlToPdf({ input, output })

    expect(result.bytesWritten).toBeGreaterThan(0)
    expect(result.conversionTimeMs).toBeGreaterThanOrEqual(0)
  })

  it('derives output path from input (.html → .pdf) when output not specified', { timeout: 30000 }, async () => {
    const input = await createTempHtml()

    const result = await convertHtmlToPdf({ input })

    expect(result.outputFile).toBe(input.replace('.html', '.pdf'))
    await expect(access(result.outputFile)).resolves.toBeUndefined()
  })

  it('appends .pdf when input has no .html extension', { timeout: 30000 }, async () => {
    const dir = await mkdtemp(join(tmpdir(), 'dcc-pdf-test-'))
    tempDirs.push(dir)
    const input = join(dir, 'document.htm')
    await writeFile(input, SIMPLE_HTML, 'utf-8')

    const result = await convertHtmlToPdf({ input })

    expect(result.outputFile).toBe(input + '.pdf')
  })

  it('throws DccError(INPUT_NOT_FOUND) for nonexistent input', async () => {
    await expect(
      convertHtmlToPdf({ input: '/nonexistent/path/file.html' })
    ).rejects.toThrow(
      expect.objectContaining({ code: 'INPUT_NOT_FOUND' })
    )
  })

  it('throws a DccError instance for nonexistent input', async () => {
    await expect(
      convertHtmlToPdf({ input: '/nonexistent/path/file.html' })
    ).rejects.toBeInstanceOf(DccError)
  })
})
