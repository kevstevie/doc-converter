import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Command } from 'commander'
import { registerHealthCommand } from '../../../src/cli/commands/health.js'
import { DccError } from '../../../src/core/errors.js'

vi.mock('../../../src/core/converters/browser.js', () => ({
  getBrowser: vi.fn(),
  closeBrowser: vi.fn(),
}))
vi.mock('puppeteer', () => ({
  default: { executablePath: vi.fn(() => '/path/to/chrome') },
}))

import { getBrowser, closeBrowser } from '../../../src/core/converters/browser.js'

describe('registerHealthCommand', () => {
  let exitSpy: ReturnType<typeof vi.spyOn>
  let stdoutSpy: ReturnType<typeof vi.spyOn>
  let stderrSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((_code?: number | string | null) => undefined as never)
    stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation((_chunk: unknown) => true)
    stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation((_chunk: unknown) => true)
    vi.mocked(getBrowser).mockReset()
    vi.mocked(closeBrowser).mockReset()
  })

  afterEach(() => {
    exitSpy.mockRestore()
    stdoutSpy.mockRestore()
    stderrSpy.mockRestore()
  })

  it('registers a "health" command on the program', () => {
    const program = new Command()
    registerHealthCommand(program)
    const cmd = program.commands.find((c) => c.name() === 'health')
    expect(cmd).toBeDefined()
  })

  it('writes success JSON to stdout when Chromium is available', async () => {
    vi.mocked(getBrowser).mockResolvedValue({} as never)
    vi.mocked(closeBrowser).mockResolvedValue()

    const program = new Command()
    program.exitOverride()
    registerHealthCommand(program)

    await program.parseAsync(['node', 'dcc', 'health'])

    const written = (stdoutSpy.mock.calls[0][0]) as string
    const json = JSON.parse(written)
    expect(json.success).toBe(true)
    expect(json.data.chromium).toBe('available')
    expect(exitSpy).not.toHaveBeenCalled()
  })

  it('writes error JSON to stderr and exits 1 when Chromium unavailable', async () => {
    vi.mocked(getBrowser).mockRejectedValue(
      new DccError('CHROMIUM_NOT_AVAILABLE', 'Chromium not found')
    )

    const program = new Command()
    program.exitOverride()
    registerHealthCommand(program)

    await program.parseAsync(['node', 'dcc', 'health'])

    const written = (stderrSpy.mock.calls[0][0]) as string
    const json = JSON.parse(written)
    expect(json.success).toBe(false)
    expect(json.error.code).toBe('CHROMIUM_NOT_AVAILABLE')
    expect(exitSpy).toHaveBeenCalledWith(1)
  })
})
