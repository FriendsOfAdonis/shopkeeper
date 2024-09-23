import { BaseCommand, flags } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'
import shopkeeper from '../services/shopkeeper.js'
import Stripe from 'stripe'
import { STRIPE_VERSION, WEBHOOK_EVENTS } from '../src/constants.js'

export default class WebhookCommand extends BaseCommand {
  static commandName = 'shopkeeper:webhook'
  static description = 'Create the Stripe webhook to interact with Shopkeeper.'

  static options: CommandOptions = {
    startApp: true,
  }

  @flags.boolean({ description: 'Immediately disable the webhook after creation' })
  declare disabled: boolean

  @flags.string({ description: 'The URL endpoint for the webhook' })
  declare url?: string

  @flags.string({ description: 'The Stripe API version the webhook should use' })
  declare apiVersion: Stripe.WebhookEndpointCreateParams.ApiVersion

  async run() {
    let url = this.url
    if (!url) {
      const appUrl = this.app.config.get<string | undefined>('app.appUrl')
      if (!appUrl) {
        this.logger.error(
          'Cannot create Webhook URL as `app.appUrl` is not defined. Either configure it or use the `--url` argument.'
        )
        this.exitCode = 1
        return
      }

      url = new URL('/stripe/webhook', appUrl).href
    }

    const endpoint = await shopkeeper.stripe.webhookEndpoints.create({
      enabled_events: shopkeeper.config.webhook.events ?? WEBHOOK_EVENTS,
      url,
      api_version: this.apiVersion ?? STRIPE_VERSION,
      description: 'Shopkeeper',
    })

    this.logger.info(
      'The Stripe webhook was created successfully. Retrieve the webhook secret in your Stripe dashboard and define it as an environment variable.'
    )

    if (this.disabled) {
      await shopkeeper.stripe.webhookEndpoints.update(endpoint.id, { disabled: true })

      this.logger.info(
        'The Stripe webhook was disabled as requested. You may enable the webhook via the Stripe dashboard when needed.'
      )
    }
  }
}
