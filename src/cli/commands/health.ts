import type { Command } from 'commander'
import puppeteer from 'puppeteer'
import { getBrowser, closeBrowser } from '../../core/converters/browser.js'

export function registerHealthCommand(program: Command): void {
  program
    .command('health')
    .description('Check Chromium availability for PDF rendering')
    .action(async () => {
      try {
        await getBrowser()
        await closeBrowser()
        const response = {
          success: true,
          data: {
            chromium: 'available',
            executablePath: puppeteer.executablePath(),
          },
        }
        process.stdout.write(JSON.stringify(response, null, 2) + '\n')
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        const response = {
          success: false,
          error: {
            code: 'CHROMIUM_NOT_AVAILABLE',
            message,
            suggestion: 'Run: npx puppeteer browsers install chrome',
          },
        }
        process.stderr.write(JSON.stringify(response, null, 2) + '\n')
        process.exit(1)
      }
    })
}
