import { readFile, writeFile, access } from 'node:fs/promises'
import { extname, basename } from 'node:path'
import { marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'
import type { ConversionResult } from '../types.js'
import { DccError } from '../errors.js'

export interface MdToHtmlOptions {
  input: string
  output?: string
}

marked.use(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext'
      return hljs.highlight(code, { language }).value
    },
  })
)

function deriveOutputPath(input: string): string {
  const ext = extname(input)
  if (ext.toLowerCase() === '.md') {
    return input.slice(0, -ext.length) + '.html'
  }
  return input + '.html'
}

function extractTitle(markdown: string, fallback: string): string {
  const match = markdown.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : fallback
}

function wrapInDocument(body: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.10.0/styles/github.min.css">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 860px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; color: #24292e; }
    pre { background: #f6f8fa; border-radius: 6px; padding: 1rem; overflow-x: auto; }
    code:not(.hljs) { background: #f6f8fa; padding: 0.2em 0.4em; border-radius: 3px; font-size: 85%; }
    h1, h2, h3 { border-bottom: 1px solid #eaecef; padding-bottom: 0.3em; }
    blockquote { border-left: 4px solid #dfe2e5; margin: 0; padding: 0 1em; color: #6a737d; }
  </style>
</head>
<body>
${body}
</body>
</html>`
}

export async function convertMdToHtml(options: MdToHtmlOptions): Promise<ConversionResult> {
  const { input } = options
  const output = options.output ?? deriveOutputPath(input)

  const start = Date.now()

  try {
    await access(input)
  } catch {
    throw new DccError(
      'INPUT_NOT_FOUND',
      `Input file not found: ${input}`,
      'Check that the file path is correct and the file exists'
    )
  }

  let markdown: string
  try {
    markdown = await readFile(input, 'utf-8')
  } catch (err) {
    throw new DccError(
      'INPUT_UNREADABLE',
      `Cannot read input file: ${input}`,
      'Check file permissions'
    )
  }

  const title = extractTitle(markdown, basename(input, extname(input)))
  const body = await marked.parse(markdown)
  const html = wrapInDocument(body, title)

  const encoded = Buffer.from(html, 'utf-8')

  try {
    await writeFile(output, encoded)
  } catch (err) {
    throw new DccError(
      'OUTPUT_WRITE_FAILED',
      `Cannot write output file: ${output}`,
      'Check that the output directory exists and you have write permission'
    )
  }

  return {
    outputFile: output,
    bytesWritten: encoded.byteLength,
    conversionTimeMs: Date.now() - start,
  }
}
