import { describe, it, expect } from 'vitest'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { access, rm } from 'node:fs/promises'
import { resolve } from 'node:path'

const execFileAsync = promisify(execFile)

const CLI = resolve('dist/index.js')
const SAMPLE_MD = resolve('tests/fixtures/sample.md')

interface CliResult {
  exitCode: number
  stdout: string
  stderr: string
}

async function runCli(args: string[]): Promise<CliResult> {
  try {
    const { stdout, stderr } = await execFileAsync('node', [CLI, ...args])
    return { exitCode: 0, stdout, stderr }
  } catch (err: unknown) {
    const e = err as { code?: number; stdout?: string; stderr?: string }
    return {
      exitCode: e.code ?? 1,
      stdout: e.stdout ?? '',
      stderr: e.stderr ?? '',
    }
  }
}

describe('CLI integration', () => {
  it('dcc formats: exits 0, stdout is valid JSON with conversions array', async () => {
    const { exitCode, stdout } = await runCli(['formats'])

    expect(exitCode).toBe(0)
    const json = JSON.parse(stdout)
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data.conversions)).toBe(true)
    expect(json.data.conversions.length).toBeGreaterThan(0)
    expect(json.data.conversions[0]).toMatchObject({ from: expect.any(String), to: expect.any(String) })
  })

  it('dcc convert md→html: exits 0, stdout JSON with success:true', { timeout: 30000 }, async () => {
    const output = '/tmp/dcc-test-out.html'
    try { await rm(output, { force: true }) } catch {}

    const { exitCode, stdout } = await runCli([
      'convert', '--from', 'md', '--to', 'html',
      '--input', SAMPLE_MD, '--output', output,
    ])

    expect(exitCode).toBe(0)
    const json = JSON.parse(stdout)
    expect(json.success).toBe(true)
    expect(json.data.outputFile).toBe(output)
    await expect(access(output)).resolves.toBeUndefined()
    await rm(output, { force: true })
  })

  it('dcc convert nonexistent input: exits 1, stderr JSON with INPUT_NOT_FOUND', async () => {
    const { exitCode, stderr } = await runCli([
      'convert', '--from', 'md', '--to', 'html', '--input', '/nonexistent/file.md',
    ])

    expect(exitCode).toBe(1)
    const json = JSON.parse(stderr)
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('INPUT_NOT_FOUND')
  })

  it('dcc convert invalid format: exits 1, stderr JSON with INVALID_FORMAT', async () => {
    const { exitCode, stderr } = await runCli([
      'convert', '--from', 'docx', '--to', 'html', '--input', 'foo.md',
    ])

    expect(exitCode).toBe(1)
    const json = JSON.parse(stderr)
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('INVALID_FORMAT')
  })

  it('dcc health: exits 0 or 1, response is valid JSON', { timeout: 30000 }, async () => {
    const result = await runCli(['health'])

    expect([0, 1]).toContain(result.exitCode)
    const raw = result.exitCode === 0 ? result.stdout : result.stderr
    const json = JSON.parse(raw)
    expect(typeof json.success).toBe('boolean')
  })
})
