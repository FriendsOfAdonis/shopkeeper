import { ApplicationService } from '@adonisjs/core/types'
import { Shopkeeper } from '../src/shopkeeper.js'
import { ShopkeeperConfig } from '../src/types.js'
import emitter from '@adonisjs/core/services/emitter'
import { handleCustomerSubscriptionCreated } from '../src/handlers/handle_customer_subscription_created.js'
import { handleCustomerSubscriptionUpdated } from '../src/handlers/handle_customer_subscription_updated.js'
import { handleCustomerSubscriptionDeleted } from '../src/handlers/handle_customer_subscription_deleted.js'

export default class ShopkeeperProvider {
  constructor(protected app: ApplicationService) {}

  register() {
    this.app.container.singleton(Shopkeeper, async () => {
      const config = this.app.config.get<ShopkeeperConfig>('shopkeeper')
      return new Shopkeeper(config)
    })
  }

  start() {
    this.registerWebhookListeners()
  }

  registerWebhookListeners() {
    emitter.on('stripe:customer.subscription.created', handleCustomerSubscriptionCreated)
    emitter.on('stripe:customer.subscription.updated', handleCustomerSubscriptionUpdated)
    emitter.on('stripe:customer.subscription.deleted', handleCustomerSubscriptionDeleted)
  }
}
