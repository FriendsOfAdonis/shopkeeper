import { Exception } from '@adonisjs/core/exceptions'
import Stripe from 'stripe'
import { WithManagesPaymentMethods } from '../mixins/manages_payment_methods.js'

export class InvalidPaymentError extends Exception {
  static invalidOwner(
    paymentMethod: Stripe.PaymentMethod,
    owner: WithManagesPaymentMethods['prototype']
  ) {
    return new InvalidPaymentError(
      `The payment method '${paymentMethod.id}''s customer '${paymentMethod.customer}' does not belong to this customer ${owner.stripeId}`
    )
  }
}
