import type { Command } from 'commander'
import { validateOptions } from '../options.js'
import { formatSuccess, formatError, printResult } from '../output.js'
import { convert } from '../../core/converter.js'
import { closeBrowser } from '../../core/converters/browser.js'

export function registerConvertCommand(program: Command): void {
  program
    .command('convert')
    .description('Convert a document from one format to another')
    .requiredOption('--from <format>', 'Source format: md, html')
    .requiredOption('--to <format>', 'Target format: html, pdf')
    .requiredOption('--input <path>', 'Input file path')
    .option('--output <path>', 'Output file path (default: derived from input)')
    .action(async (opts) => {
      try {
        const options = validateOptions(opts)
        const result = await convert(options)
        printResult(formatSuccess(result))
      } catch (err) {
        printResult(formatError(err instanceof Error ? err : new Error(String(err))))
        process.exit(1)
      } finally {
        await closeBrowser()
      }
    })
}
