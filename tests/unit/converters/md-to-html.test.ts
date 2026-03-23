import { describe, it, expect, afterEach } from 'vitest'
import { writeFile, readFile, rm, mkdtemp } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { convertMdToHtml } from '../../../src/core/converters/md-to-html.js'
import { DccError } from '../../../src/core/errors.js'

let tempFiles: string[] = []

async function createTempMd(content: string): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'dcc-test-'))
  const filePath = join(dir, 'test.md')
  await writeFile(filePath, content, 'utf-8')
  tempFiles.push(dir)
  return filePath
}

afterEach(async () => {
  for (const dir of tempFiles) {
    await rm(dir, { recursive: true, force: true })
  }
  tempFiles = []
})

describe('convertMdToHtml', () => {
  it('converts a simple markdown file to an HTML file', async () => {
    const input = await createTempMd('# Hello\n\nWorld')
    const output = input.replace('.md', '.html')

    const result = await convertMdToHtml({ input, output })

    expect(result.outputFile).toBe(output)
    const html = await readFile(output, 'utf-8')
    expect(html).toContain('Hello')
  })

  it('output HTML contains <h1> for # heading', async () => {
    const input = await createTempMd('# My Title\n\nSome content.')
    const output = input.replace('.md', '.html')

    await convertMdToHtml({ input, output })

    const html = await readFile(output, 'utf-8')
    expect(html).toContain('<h1')
    expect(html).toContain('My Title')
  })

  it('output HTML contains syntax-highlighted code block', async () => {
    const input = await createTempMd('```javascript\nconst x = 42\n```')
    const output = input.replace('.md', '.html')

    await convertMdToHtml({ input, output })

    const html = await readFile(output, 'utf-8')
    expect(html).toContain('hljs')
  })

  it('derives output path from input when output not specified (.md → .html)', async () => {
    const input = await createTempMd('# Auto\n\nDerived output path.')

    const result = await convertMdToHtml({ input })

    expect(result.outputFile).toBe(input.replace('.md', '.html'))
    const html = await readFile(result.outputFile, 'utf-8')
    expect(html).toContain('Auto')
  })

  it('output contains full HTML document structure', async () => {
    const input = await createTempMd('# Doc\n\nContent here.')
    const output = input.replace('.md', '.html')

    await convertMdToHtml({ input, output })

    const html = await readFile(output, 'utf-8')
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('<head>')
    expect(html).toContain('<body>')
    expect(html).toContain('</html>')
  })

  it('uses first H1 as document title', async () => {
    const input = await createTempMd('# My Document\n\nContent.')
    const output = input.replace('.md', '.html')

    await convertMdToHtml({ input, output })

    const html = await readFile(output, 'utf-8')
    expect(html).toContain('<title>My Document</title>')
  })

  it('throws DccError(INPUT_NOT_FOUND) for nonexistent input', async () => {
    await expect(
      convertMdToHtml({ input: '/nonexistent/path/file.md' })
    ).rejects.toThrow(
      expect.objectContaining({ code: 'INPUT_NOT_FOUND' })
    )
  })

  it('throws a DccError instance for nonexistent input', async () => {
    await expect(
      convertMdToHtml({ input: '/nonexistent/path/file.md' })
    ).rejects.toBeInstanceOf(DccError)
  })

  it('returns ConversionResult with bytesWritten > 0', async () => {
    const input = await createTempMd('# Hello\n\nWorld.')
    const output = input.replace('.md', '.html')

    const result = await convertMdToHtml({ input, output })

    expect(result.bytesWritten).toBeGreaterThan(0)
    expect(result.conversionTimeMs).toBeGreaterThanOrEqual(0)
    expect(result.outputFile).toBe(output)
  })

  it('appends .html when input has no .md extension', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'dcc-test-'))
    tempFiles.push(dir)
    const input = join(dir, 'document.txt')
    await writeFile(input, '# No MD Extension\n\nContent.', 'utf-8')

    const result = await convertMdToHtml({ input })

    expect(result.outputFile).toBe(input + '.html')
    const html = await readFile(result.outputFile, 'utf-8')
    expect(html).toContain('No MD Extension')
  })

  it('throws DccError(OUTPUT_WRITE_FAILED) when output path is invalid', async () => {
    const input = await createTempMd('# Hello\n\nContent.')

    await expect(
      convertMdToHtml({ input, output: '/nonexistent-dir/output.html' })
    ).rejects.toThrow(
      expect.objectContaining({ code: 'OUTPUT_WRITE_FAILED' })
    )
  })
})
