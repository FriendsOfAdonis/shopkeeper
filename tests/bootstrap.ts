import 'reflect-metadata'
import { Config } from '@japa/runner/types'
import { assert } from '@japa/assert'
import { apiClient } from '@japa/api-client'
import { fileSystem } from '@japa/file-system'
import ace from '@adonisjs/core/services/ace'
import Configure from '@adonisjs/core/commands/configure'
import app from '@adonisjs/core/services/app'
import { copyFile, mkdir, rmdir } from 'node:fs/promises'
import testUtils from '@adonisjs/core/services/test_utils'
import { expect } from '@japa/expect'

export const plugins: Config['plugins'] = [
  assert(),
  apiClient({ baseURL: 'http://localhost:3332' }),
  fileSystem({ basePath: new URL('./tmp/', import.meta.url), autoClean: false }),
  expect(),
]

export const runnerHooks: Required<Pick<Config, 'setup' | 'teardown'>> = {
  setup: [],
  teardown: [],
}

export const timeout = 30000

export const configureSuite: Config['configureSuite'] = (suite) => {
  if (['functional'].includes(suite.name)) {
    return suite
      .setup(async () => {
        const router = await app.container.make('router')

        router.use([() => import('@adonisjs/core/bodyparser_middleware')])

        await mkdir(app.migrationsPath(), { recursive: true })
        await copyFile(
          new URL('./fixtures/migrations/00000_create_users_table.ts', import.meta.url).pathname,
          app.migrationsPath('00000_create_users_table.ts')
        )

        const command = await ace.create(Configure, ['../../index.js'])
        await command.exec()

        await testUtils.db().migrate()
        return testUtils.httpServer().start()
      })
      .teardown(async () => {
        await rmdir(app.appRoot, { recursive: true })
      })
  }
}
