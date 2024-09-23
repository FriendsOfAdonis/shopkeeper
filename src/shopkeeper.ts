import Stripe from 'stripe'
import { ShopkeeperConfig } from './types.js'
import { WithBillable } from './mixins/billable.js'
import { Exception } from '@adonisjs/core/exceptions'

export class Shopkeeper {
  readonly #config: ShopkeeperConfig
  readonly #stripe: Stripe
  #customerModel?: WithBillable

  constructor(config: ShopkeeperConfig) {
    this.#config = config

    const {
      stripe: { apiKey, ...stripe },
    } = config

    this.#stripe = new Stripe(apiKey, stripe)
  }

  public get stripe(): Stripe {
    return this.#stripe
  }

  public get config(): ShopkeeperConfig {
    return this.#config
  }

  /**
   * Format the given amount into a displayable currency.
   */
  public formatAmount(amount: number, currency?: string): string {
    return amount.toString()
  }

  /**
   * Get the customer instance by its Stripe ID.
   */
  public async findBillable(
    customer: Stripe.Customer | Stripe.DeletedCustomer | string
  ): Promise<WithBillable['prototype'] | null> {
    const stripeId = typeof customer === 'string' ? customer : customer.id

    const billable = await this.customerModel.findBy({
      stripeId,
    })

    return billable
  }

  public set customerModel(model: WithBillable) {
    this.#customerModel = model
  }

  public get customerModel(): WithBillable {
    if (!this.#customerModel) {
      throw new Exception('No customer model') // TODO: Error
    }
    return this.#customerModel
  }

  public get calculateTaxes(): boolean {
    return this.config.calculateTaxes
  }

  public get currency(): string {
    return this.#config.currency
  }
}
