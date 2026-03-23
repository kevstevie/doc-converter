import { program } from 'commander'
import { registerConvertCommand } from './cli/commands/convert.js'
import { registerFormatsCommand } from './cli/commands/formats.js'
import { registerHealthCommand } from './cli/commands/health.js'

program
  .name('dcc')
  .description('Document converter CLI: MD→HTML, MD→PDF, HTML→PDF')
  .version('0.1.0')

registerConvertCommand(program)
registerFormatsCommand(program)
registerHealthCommand(program)

program.parse()
