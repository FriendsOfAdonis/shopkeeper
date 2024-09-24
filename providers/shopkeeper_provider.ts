import { ApplicationService } from '@adonisjs/core/types'
import { Shopkeeper } from '../src/shopkeeper.js'
import { ShopkeeperConfig } from '../src/types.js'
import emitter from '@adonisjs/core/services/emitter'
import { handleCustomerSubscriptionCreated } from '../src/handlers/handle_customer_subscription_created.js'
import { handleCustomerSubscriptionUpdated } from '../src/handlers/handle_customer_subscription_updated.js'
import { handleCustomerSubscriptionDeleted } from '../src/handlers/handle_customer_subscription_deleted.js'
import { handleWebhook } from '../src/handlers/handle_webhooks.js'
import { InvalidConfigurationError } from '../src/errors/invalid_configuration.js'

export default class ShopkeeperProvider {
  #config: Required<ShopkeeperConfig>

  constructor(protected app: ApplicationService) {
    this.#config = this.app.config.get<Required<ShopkeeperConfig>>('shopkeeper')
  }

  register() {
    this.app.container.singleton(Shopkeeper, async () => {
      const [customerModel, subscriptionModel, subscriptionItemModel] = await Promise.all([
        this.#config.models.customerModel().then((i) => i.default),
        this.#config.models.subscriptionModel().then((i) => i.default),
        this.#config.models.subscriptionItemModel().then((i) => i.default),
      ])

      return new Shopkeeper(this.#config, customerModel, subscriptionModel, subscriptionItemModel)
    })
  }

  async boot() {
    await this.registerRoutes()
  }

  async start() {
    this.registerWebhookListeners()
  }

  async registerRoutes() {
    if (this.#config.registerRoutes) {
      const router = await this.app.container.make('router')

      const route = router
        .post('/stripe/webhook', (ctx) => handleWebhook(ctx))
        .as('shopkeeper.webhook')

      if (this.#config.webhook.secret) {
        const middleware = router.named({
          stripeWebhook: () => import('../src/middlewares/stripe_webhook_middleware.js'),
        })

        route.middleware(middleware.stripeWebhook())
      } else if (this.app.inProduction) {
        throw InvalidConfigurationError.webhookSecretInProduction()
      }
    }
  }

  registerWebhookListeners() {
    emitter.on('stripe:customer.subscription.created', handleCustomerSubscriptionCreated)
    emitter.on('stripe:customer.subscription.updated', handleCustomerSubscriptionUpdated)
    emitter.on('stripe:customer.subscription.deleted', handleCustomerSubscriptionDeleted)
  }
}
