import { defineConfig as defineDatabaseConfig } from '@adonisjs/lucid'
import { defineConfig } from '../src/define_config.js'

export default {
  rcFileContents: {
    providers: [
      () => import('@adonisjs/lucid/database_provider'),
      () => import('../providers/shopkeeper_provider.js'),
    ],
    commands: [() => import('@adonisjs/lucid/commands')],
  },
  config: {
    shopkeeper: defineConfig({
      currency: 'EUR',
      stripe: {
        apiKey: process.env.STRIPE_SECRET as string,
      },
    }),
    database: defineDatabaseConfig({
      connection: 'sqlite',
      connections: {
        sqlite: {
          client: 'sqlite',
          connection: {
            filename: 'tests/tmp/db.sqlite',
          },
          useNullAsDefault: true,
          migrations: {
            paths: ['database/migrations'],
          },
        },
      },
    }),
  },
}
