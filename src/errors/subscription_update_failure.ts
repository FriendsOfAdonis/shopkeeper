import { Exception } from '@adonisjs/core/exceptions'
import { Subscription } from '../models/subscription.js'

export class SubscriptionUpdateError extends Exception {
  static incompleteSubscription(subscription: Subscription) {
    return new SubscriptionUpdateError(
      `The subscription '${subscription.stripeId}' cannot be updated because its payment is incomplete.`
    )
  }
}
