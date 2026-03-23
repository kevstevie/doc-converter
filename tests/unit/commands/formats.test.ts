import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Command } from 'commander'
import { registerFormatsCommand } from '../../../src/cli/commands/formats.js'

describe('registerFormatsCommand', () => {
  beforeEach(() => {
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true)
  })

  it('registers a "formats" command on the program', () => {
    const program = new Command()
    registerFormatsCommand(program)
    const cmd = program.commands.find((c) => c.name() === 'formats')
    expect(cmd).toBeDefined()
  })

  it('prints JSON with success:true and conversions array', async () => {
    const program = new Command()
    program.exitOverride()
    registerFormatsCommand(program)

    await program.parseAsync(['node', 'dcc', 'formats'])

    const written = (process.stdout.write as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
    const json = JSON.parse(written)
    expect(json.success).toBe(true)
    expect(Array.isArray(json.data.conversions)).toBe(true)
    expect(json.data.conversions).toHaveLength(3)
  })

  it('each conversion has from, to, and description fields', async () => {
    const program = new Command()
    program.exitOverride()
    registerFormatsCommand(program)

    await program.parseAsync(['node', 'dcc', 'formats'])

    const written = (process.stdout.write as ReturnType<typeof vi.fn>).mock.calls[0][0] as string
    const { data } = JSON.parse(written)
    for (const conv of data.conversions) {
      expect(conv).toHaveProperty('from')
      expect(conv).toHaveProperty('to')
      expect(conv).toHaveProperty('description')
    }
  })
})
