# doc-converter

CLI tool for converting documents between formats.

| From | To | Method |
|------|----|--------|
| Markdown | HTML | marked + highlight.js |
| Markdown | PDF | MD→HTML→PDF (via Puppeteer) |
| HTML | PDF | Puppeteer (headless Chrome) |

---

## Requirements

- Node.js 20+
- pnpm

---

## Installation

```bash
git clone <repo-url>
cd doc-converter
pnpm install
pnpm build
```

### Global install (optional)

```bash
npm link
# or
pnpm link --global
```

> **Note:** PDF conversion requires Chromium (~170MB). It is bundled with puppeteer and downloaded automatically on `pnpm install`. Run `dcc health` to verify it is available.

---

## Usage

### Convert

```bash
dcc convert --from <format> --to <format> --input <path> [--output <path>]
```

`--output` is optional — defaults to the input path with the target extension.

#### Examples

```bash
# Markdown → HTML
dcc convert --from md --to html --input report.md
# → report.html

# Markdown → HTML (explicit output path)
dcc convert --from md --to html --input report.md --output dist/report.html

# Markdown → PDF
dcc convert --from md --to pdf --input report.md --output report.pdf

# HTML → PDF
dcc convert --from html --to pdf --input page.html --output page.pdf
```

### List supported formats

```bash
dcc formats
```

```json
{
  "success": true,
  "data": {
    "conversions": [
      { "from": "md",   "to": "html", "description": "Markdown to HTML" },
      { "from": "md",   "to": "pdf",  "description": "Markdown to PDF (via HTML)" },
      { "from": "html", "to": "pdf",  "description": "HTML to PDF" }
    ]
  }
}
```

### Check Chromium health

```bash
dcc health
```

```json
{
  "success": true,
  "data": {
    "chromium": "available",
    "executablePath": "/Users/you/.cache/puppeteer/chrome/.../Google Chrome for Testing"
  }
}
```

---

## Output format

All commands output JSON to **stdout** on success and **stderr** on error.

**Success**
```json
{
  "success": true,
  "data": {
    "outputFile": "report.pdf",
    "bytesWritten": 45230,
    "conversionTimeMs": 1234
  }
}
```

**Error**
```json
{
  "success": false,
  "error": {
    "code": "INPUT_NOT_FOUND",
    "message": "Input file not found: report.md",
    "suggestion": "Check that the file path is correct and the file exists"
  }
}
```

### Error codes

| Code | Cause |
|------|-------|
| `INPUT_NOT_FOUND` | Input file does not exist |
| `INPUT_UNREADABLE` | Input file cannot be read (permissions) |
| `UNSUPPORTED_CONVERSION` | Format pair not supported |
| `INVALID_FORMAT` | Unknown format value passed to `--from` or `--to` |
| `INVALID_OPTIONS` | Required option missing or malformed |
| `RENDER_FAILED` | Puppeteer failed to render the page |
| `OUTPUT_WRITE_FAILED` | Cannot write output file (bad path or permissions) |
| `CHROMIUM_NOT_AVAILABLE` | Chromium could not be launched |

---

## LLM usage

`dcc` is designed to be invoked by LLMs via shell commands. All output is machine-readable JSON — no interactive prompts, no progress spinners.

```bash
# An LLM can discover capabilities
dcc formats

# Convert and parse the result
dcc convert --from md --to pdf --input spec.md --output spec.pdf
```

Exit code `0` = success, `1` = error.

---

## Development

```bash
pnpm test             # run all tests
pnpm test:coverage    # run with coverage report
pnpm build            # compile to dist/
pnpm dev              # watch mode
```

### Project structure

```
src/
  index.ts                    # CLI entry point
  cli/
    commands/
      convert.ts              # dcc convert
      formats.ts              # dcc formats
      health.ts               # dcc health
    options.ts                # Zod validation
    output.ts                 # JSON formatter
  core/
    converter.ts              # orchestrator
    converters/
      md-to-html.ts           # Markdown → HTML
      html-to-pdf.ts          # HTML → PDF
      browser.ts              # Puppeteer singleton
    types.ts
    errors.ts
tests/
  unit/                       # unit tests
  integration/cli.test.ts     # black-box CLI tests
  fixtures/                   # sample.md, sample.html
```

### Troubleshooting Chromium

If `dcc health` fails:

```bash
# Re-download the bundled Chrome
npx puppeteer browsers install chrome

# Or point to an existing Chrome/Chromium installation
# (browser.ts auto-scans ~/.cache/puppeteer for any available version)
```
