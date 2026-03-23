const { join } = require('path')
const { homedir } = require('os')

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  cacheDirectory: join(homedir(), '.cache', 'puppeteer'),
}
