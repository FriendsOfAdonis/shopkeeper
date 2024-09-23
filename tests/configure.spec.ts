import Configure from '@adonisjs/core/commands/configure'
import { test } from '@japa/runner'
import { fileURLToPath } from 'node:url'
import { IgnitorFactory } from '@adonisjs/core/factories'

const BASE_URL = new URL('./tmp/configure/', import.meta.url)

test.group('Configure', (group) => {
  group.each.setup(({ context }) => {
    context.fs.baseUrl = BASE_URL
    context.fs.basePath = fileURLToPath(BASE_URL)
  })

  test('create migration files', async ({ assert, fs }) => {
    const ignitor = new IgnitorFactory()
      .withCoreProviders()
      .withCoreConfig()
      .create(BASE_URL, {
        importer: (filePath) => {
          if (filePath.startsWith('./') || filePath.startsWith('../')) {
            return import(new URL(filePath, BASE_URL).href)
          }

          return import(filePath)
        },
      })

    const app = ignitor.createApp('web')
    await app.init()
    await app.boot()

    await fs.create('.env', '')
    await fs.createJson('tsconfig.json', {})
    await fs.create('start/env.ts', `export default Env.create(new URL('./'), {})`)
    await fs.create('adonisrc.ts', `export default defineConfig({})`)

    const ace = await app.container.make('ace')
    const command = await ace.create(Configure, ['../../../index.js'])
    await command.exec()

    await assert.fileExists('config/shopkeeper.ts')
    await assert.fileContains('config/shopkeeper.ts', 'defineConfig')

    await assert.fileExists('adonisrc.ts')
    await assert.fileContains('adonisrc.ts', '@foadonis/shopkeeper/commands')
    await assert.fileContains('adonisrc.ts', '@foadonis/shopkeeper/shopkeeper_provider')

    const files = await fs.readDir('database/migrations')

    assert.lengthOf(files, 3)
  })
})
