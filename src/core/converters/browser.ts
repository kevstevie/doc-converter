import puppeteer, { type Browser } from 'puppeteer'
import { access } from 'node:fs/promises'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { DccError } from '../errors.js'

let browserInstance: Browser | null = null

async function findChromiumExecutable(): Promise<string | undefined> {
  const defaultPath = puppeteer.executablePath()

  try {
    await access(defaultPath)
    return defaultPath
  } catch {
    // Default path not found — scan the puppeteer cache for any available Chrome
  }

  const cacheDir = join(homedir(), '.cache', 'puppeteer', 'chrome')
  const { readdir } = await import('node:fs/promises')

  let versions: string[]
  try {
    versions = await readdir(cacheDir)
  } catch {
    return undefined
  }

  for (const version of versions.sort().reverse()) {
    const candidates = [
      join(cacheDir, version, 'chrome-mac-arm64', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing'),
      join(cacheDir, version, 'chrome-linux64', 'chrome'),
      join(cacheDir, version, 'chrome-win64', 'chrome.exe'),
    ]
    for (const candidate of candidates) {
      try {
        await access(candidate)
        return candidate
      } catch {
        // try next
      }
    }
  }

  return undefined
}

export async function getBrowser(): Promise<Browser> {
  if (browserInstance) return browserInstance

  const executablePath = await findChromiumExecutable()

  try {
    browserInstance = await puppeteer.launch({
      headless: true,
      executablePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    })
    return browserInstance
  } catch (err) {
    throw new DccError(
      'CHROMIUM_NOT_AVAILABLE',
      'Failed to launch Chromium browser',
      'Run `dcc health` to check Chromium availability, or reinstall puppeteer'
    )
  }
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close()
    browserInstance = null
  }
}
