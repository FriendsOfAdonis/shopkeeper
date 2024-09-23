import Configure from '@adonisjs/core/commands/configure'
import { test } from '@japa/runner'
import { fileURLToPath } from 'node:url'
import { ignitorFactory } from '../bin/test.js'

const BASE_URL = new URL('./tmp/', import.meta.url)

test.group('Configure', (group) => {
  group.each.setup(({ context }) => {
    context.fs.baseUrl = BASE_URL
    context.fs.basePath = fileURLToPath(BASE_URL)
  })

  test('create migration files', async ({ assert, fs }) => {
    const app = ignitorFactory.createApp('web')
    await app.init()
    await app.boot()

    const ace = await app.container.make('ace')
    const command = await ace.create(Configure, ['../../index.js'])
    await command.exec()

    const files = await fs.readDir('database/migrations')

    assert.lengthOf(files, 3)
  })
})
