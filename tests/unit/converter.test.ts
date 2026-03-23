import { describe, it, expect, afterAll } from 'vitest'
import { writeFile, rm, mkdtemp, access } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { convert } from '../../src/core/converter.js'
import { closeBrowser } from '../../src/core/converters/browser.js'
import { DccError } from '../../src/core/errors.js'

const SAMPLE_MD = '# Test\n\nHello world.\n\n```js\nconst x = 1\n```\n'
const SAMPLE_HTML = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Test</title></head><body><h1>Test</h1></body></html>`

let tempDirs: string[] = []

async function makeTempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'dcc-orch-'))
  tempDirs.push(dir)
  return dir
}

afterAll(async () => {
  await closeBrowser()
  for (const dir of tempDirs) {
    await rm(dir, { recursive: true, force: true })
  }
  tempDirs = []
})

describe('convert orchestrator', () => {
  it('routes md→html: returns outputFile ending in .html', async () => {
    const dir = await makeTempDir()
    const input = join(dir, 'doc.md')
    const output = join(dir, 'doc.html')
    await writeFile(input, SAMPLE_MD, 'utf-8')

    const result = await convert({ from: 'md', to: 'html', input, output })

    expect(result.outputFile).toBe(output)
    await expect(access(output)).resolves.toBeUndefined()
    expect(result.bytesWritten).toBeGreaterThan(0)
  })

  it('routes html→pdf: returns outputFile ending in .pdf', { timeout: 30000 }, async () => {
    const dir = await makeTempDir()
    const input = join(dir, 'page.html')
    const output = join(dir, 'page.pdf')
    await writeFile(input, SAMPLE_HTML, 'utf-8')

    const result = await convert({ from: 'html', to: 'pdf', input, output })

    expect(result.outputFile).toBe(output)
    await expect(access(output)).resolves.toBeUndefined()
    expect(result.bytesWritten).toBeGreaterThan(0)
  })

  it('chains md→pdf: produces PDF and cleans up temp HTML', { timeout: 30000 }, async () => {
    const dir = await makeTempDir()
    const input = join(dir, 'report.md')
    const output = join(dir, 'report.pdf')
    await writeFile(input, SAMPLE_MD, 'utf-8')

    const result = await convert({ from: 'md', to: 'pdf', input, output })

    expect(result.outputFile).toBe(output)
    await expect(access(output)).resolves.toBeUndefined()
    expect(result.bytesWritten).toBeGreaterThan(0)

    // No stray .html files in temp dir (besides the input .md)
    const { readdir } = await import('node:fs/promises')
    const files = await readdir(dir)
    const htmlFiles = files.filter((f) => f.endsWith('.html'))
    expect(htmlFiles).toHaveLength(0)
  })

  it('throws DccError(UNSUPPORTED_CONVERSION) for html→md', async () => {
    await expect(
      convert({ from: 'html', to: 'md', input: '/any/file.html' })
    ).rejects.toThrow(expect.objectContaining({ code: 'UNSUPPORTED_CONVERSION' }))
  })

  it('throws DccError(UNSUPPORTED_CONVERSION) for pdf→html', async () => {
    await expect(
      convert({ from: 'pdf', to: 'html', input: '/any/file.pdf' })
    ).rejects.toThrow(expect.objectContaining({ code: 'UNSUPPORTED_CONVERSION' }))
  })

  it('throws DccError(UNSUPPORTED_CONVERSION) for pdf→md', async () => {
    await expect(
      convert({ from: 'pdf', to: 'md', input: '/any/file.pdf' })
    ).rejects.toThrow(expect.objectContaining({ code: 'UNSUPPORTED_CONVERSION' }))
  })

  it('throws DccError instance for unsupported conversion', async () => {
    await expect(
      convert({ from: 'pdf', to: 'md', input: '/any/file.pdf' })
    ).rejects.toBeInstanceOf(DccError)
  })
})
