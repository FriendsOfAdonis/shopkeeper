import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.integer('id').primary()

      table.string('email').notNullable()
      table.string('name').notNullable()
      table.string('phone').nullable()

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.table(this.tableName, (table) => {
      table.dropColumns('stripe_id', 'pm_type', 'pm_last_four', 'trial_ends_at')
    })
  }
}
