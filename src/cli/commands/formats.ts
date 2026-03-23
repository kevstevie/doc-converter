import type { Command } from 'commander'

const CONVERSIONS = [
  { from: 'md', to: 'html', description: 'Markdown to HTML' },
  { from: 'md', to: 'pdf', description: 'Markdown to PDF (via HTML)' },
  { from: 'html', to: 'pdf', description: 'HTML to PDF' },
]

export function registerFormatsCommand(program: Command): void {
  program
    .command('formats')
    .description('List supported conversion formats')
    .action(() => {
      process.stdout.write(
        JSON.stringify({ success: true, data: { conversions: CONVERSIONS } }, null, 2) + '\n'
      )
    })
}
