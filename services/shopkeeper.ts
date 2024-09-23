import app from '@adonisjs/core/services/app'
import { Shopkeeper } from '../src/shopkeeper.js'

let shopkeeper: Shopkeeper

await app.booted(async () => {
  shopkeeper = await app.container.make(Shopkeeper)
})

export { shopkeeper as default }
