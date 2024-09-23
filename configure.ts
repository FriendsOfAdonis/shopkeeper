/*
|--------------------------------------------------------------------------
| Configure hook
|--------------------------------------------------------------------------
|
| The configure hook is called when someone runs "node ace configure <package>"
| command. You are free to perform any operations inside this function to
| configure the package.
|
| To make things easier, you have access to the underlying "ConfigureCommand"
| instance and you can use codemods to modify the source files.
|
*/

import ConfigureCommand from '@adonisjs/core/commands/configure'
import { stubsRoot } from './stubs/main.js'
import { Codemods } from '@adonisjs/core/ace/codemods'

export async function configure(command: ConfigureCommand) {
  const codemods = await command.createCodemods()

  await codemods.updateRcFile((transformer) => {
    transformer.addCommand('edgewire/commands')
    transformer.addPreloadFile('#start/components')
    transformer.addProvider('edgewire/providers/edgewire_provider')
  })

  await generateMigration(command, codemods, 'create_customer_stripe_columns')
  await generateMigration(command, codemods, 'create_subscriptions_table')
  await generateMigration(command, codemods, 'create_subscription_items_table')
}

async function generateMigration(command: ConfigureCommand, codemods: Codemods, name: string) {
  const stubPath = `database/migrations/${name}.stub`
  const prefix = new Date().getTime()
  await codemods.makeUsingStub(stubsRoot, stubPath, {
    filePath: command.app.migrationsPath(`${prefix}_${name}.ts`),
  })
}
