import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Command } from 'commander'
import { registerConvertCommand } from '../../../src/cli/commands/convert.js'

vi.mock('../../../src/core/converter.js', () => ({
  convert: vi.fn(),
}))
vi.mock('../../../src/core/converters/browser.js', () => ({
  closeBrowser: vi.fn(),
}))
vi.mock('../../../src/cli/output.js', () => ({
  formatSuccess: vi.fn((data) => ({ success: true, data })),
  formatError: vi.fn((err) => ({ success: false, error: { code: 'RENDER_FAILED', message: err.message } })),
  printResult: vi.fn(),
}))
vi.mock('../../../src/cli/options.js', () => ({
  validateOptions: vi.fn((opts) => opts),
}))

import { convert } from '../../../src/core/converter.js'
import { printResult, formatSuccess, formatError } from '../../../src/cli/output.js'
import { validateOptions } from '../../../src/cli/options.js'

describe('registerConvertCommand', () => {
  let exitSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((_code?: number | string | null) => undefined as never)
    vi.mocked(convert).mockReset()
    vi.mocked(printResult).mockReset()
    vi.mocked(formatSuccess).mockReset().mockImplementation((data) => ({ success: true, data }))
    vi.mocked(formatError).mockReset().mockImplementation((err) => ({
      success: false,
      error: { code: 'RENDER_FAILED', message: (err as Error).message },
    }))
    vi.mocked(validateOptions).mockReset().mockImplementation((opts) => opts as ReturnType<typeof validateOptions>)
  })

  afterEach(() => {
    exitSpy.mockRestore()
  })

  it('registers a "convert" command on the program', () => {
    const program = new Command()
    registerConvertCommand(program)
    const cmd = program.commands.find((c) => c.name() === 'convert')
    expect(cmd).toBeDefined()
  })

  it('calls convert() and printResult(formatSuccess()) on success', async () => {
    const mockResult = { outputFile: 'out.html', bytesWritten: 100, conversionTimeMs: 10 }
    vi.mocked(convert).mockResolvedValue(mockResult)

    const program = new Command()
    program.exitOverride()
    registerConvertCommand(program)

    await program.parseAsync([
      'node', 'dcc', 'convert',
      '--from', 'md', '--to', 'html', '--input', 'doc.md',
    ])

    expect(convert).toHaveBeenCalled()
    expect(printResult).toHaveBeenCalledWith({ success: true, data: mockResult })
    expect(exitSpy).not.toHaveBeenCalled()
  })

  it('calls printResult(formatError()) and process.exit(1) on error', async () => {
    vi.mocked(convert).mockRejectedValue(new Error('boom'))

    const program = new Command()
    program.exitOverride()
    registerConvertCommand(program)

    await program.parseAsync([
      'node', 'dcc', 'convert',
      '--from', 'md', '--to', 'html', '--input', 'doc.md',
    ])

    expect(printResult).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    )
    expect(exitSpy).toHaveBeenCalledWith(1)
  })
})
