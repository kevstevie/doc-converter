// doc-converter CLI entry point
// Implementation coming in Phase 6

import { program } from 'commander'

program
  .name('dcc')
  .description('Document converter CLI: MD→HTML, MD→PDF, HTML→PDF')
  .version('0.1.0')

program.parse()
