import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { Subscription } from './subscription.js'
import { compose } from '@adonisjs/core/helpers'
import { HandlesPaymentFailures } from '../mixins/handles_payment_failures.js'
import { InteractWithPaymentBehavior } from '../mixins/interacts_with_payment_behavior.js'
import { Prorates } from '../mixins/prorates.js'
import Stripe from 'stripe'
import { ManagesStripe } from '../mixins/manages_stripe.js'
import { DateTime } from 'luxon'

export class SubscriptionItem extends compose(
  BaseModel,
  ManagesStripe(false),
  HandlesPaymentFailures,
  InteractWithPaymentBehavior,
  Prorates
) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare subscriptionId: number

  @belongsTo(() => Subscription)
  declare subscription: BelongsTo<typeof Subscription>

  @column()
  declare stripeProduct: string

  @column()
  declare stripePrice: string

  @column()
  declare quantity: number | null

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  /**
   * Increment the quantity of the subscription item.
   */
  incrementQuantity(count = 1): Promise<this> {
    return this.updateQuantity((this.quantity ?? 0) + count)
  }

  /**
   *  Increment the quantity of the subscription item, and invoice immediately.
   */
  incrementAndInvoice(count = 1): Promise<this> {
    this.alwaysInvoice()
    return this.incrementQuantity(count)
  }

  /**
   * Decrement the quantity of the subscription item.
   */
  decrementQuantity(count = 1): Promise<this> {
    // TODO: Handle error -1
    return this.updateQuantity((this.quantity ?? 0) - count)
  }

  /**
   *  Decrement the quantity of the subscription item, and invoice immediately.
   */
  decrementAndInvoice(count = 1): Promise<this> {
    this.alwaysInvoice()
    return this.decrementQuantity(count)
  }

  /**
   * Update the quantity of the subscription item.
   */
  async updateQuantity(quantity: number): Promise<this> {
    this.subscription.guardAgainstIncomplete()

    const stripeSubscriptionItem = await this.updateStripeSubscriptionItem({
      payment_behavior: this.paymentBehavior(),
      proration_behavior: this.prorateBehavior(),
      quantity,
    })

    this.quantity = stripeSubscriptionItem.quantity ?? null

    const stripeSubscription = await this.subscription.asStripeSubscription()

    if (this.subscription.hasStripeId()) {
      this.subscription.quantity = stripeSubscriptionItem.quantity ?? null
    }

    this.subscription.stripeStatus = stripeSubscription.status

    await this.handlePaymentFailure(this.subscription)

    return this
  }

  /**
   * Swap the subscription item to a new Stripe price.
   */
  async swap(price: string, params: Stripe.SubscriptionItemUpdateParams = {}): Promise<this> {
    this.subscription.guardAgainstIncomplete()

    const stripeSubscriptionItem = await this.updateStripeSubscriptionItem({
      price,
      quantity: this.quantity ?? undefined,
      payment_behavior: this.paymentBehavior(),
      proration_behavior: this.prorateBehavior(),
      tax_rates: await this.subscription.getPriceTaxRatesForPayload(price),
      ...params,
    })

    this.stripeProduct = stripeSubscriptionItem.price.product as string
    this.stripePrice = stripeSubscriptionItem.price.id
    this.quantity = stripeSubscriptionItem.quantity ?? null

    await this.save()

    const stripeSubscription = await this.subscription.asStripeSubscription()

    if (this.subscription.hasSinglePrice()) {
      this.subscription.stripePrice = price
      this.subscription.quantity = stripeSubscriptionItem.quantity ?? null
    }

    this.subscription.stripeStatus = stripeSubscription.status

    await this.subscription.save()

    await this.handlePaymentFailure(this.subscription)

    return this
  }

  /**
   * Swap the subscription item to a new Stripe price, and invoice immediately.
   */
  swapAndInvoice(price: string, params: Stripe.SubscriptionItemUpdateParams = {}): Promise<this> {
    this.alwaysInvoice()
    return this.swap(price, params)
  }

  /**
   * Report usage for a metered product.
   */
  reportUsage(quantity = 1, date?: DateTime | number): Promise<Stripe.UsageRecord> {
    const timestamp = date instanceof DateTime ? date.toUnixInteger() : date
    return this.stripe.subscriptionItems.createUsageRecord(this.stripeId, {
      quantity,
      action: date ? 'set' : 'increment',
      timestamp: timestamp ?? DateTime.now().toUnixInteger(),
    })
  }

  /**
   * Get the usage records for a metered product.
   */
  usageRecords(
    params: Stripe.SubscriptionItemListUsageRecordSummariesParams = {}
  ): Stripe.ApiListPromise<Stripe.UsageRecordSummary> {
    return this.stripe.subscriptionItems.listUsageRecordSummaries(this.stripeId, params)
  }

  /**
   * Update the underlying Stripe subscription item information for the model.
   */
  updateStripeSubscriptionItem(
    params: Stripe.SubscriptionItemUpdateParams = {}
  ): Promise<Stripe.SubscriptionItem> {
    return this.stripe.subscriptionItems.update(this.stripeId, params)
  }

  /**
   * Get the subscription as a Stripe subscription item object.
   */
  asStripeSubscriptionItem(expand: string[] = []): Promise<Stripe.SubscriptionItem> {
    return this.stripe.subscriptionItems.retrieve(this.stripeId, { expand })
  }
}
