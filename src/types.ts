// Used as based class for mixins.

import Stripe from 'stripe'

// I'm sure there is a better way but i'll figure out later
export class Empty {}

export type ShopkeeperConfig = {
  stripe: {
    apiKey: string
  }
  customerModel: any
  calculateTaxes: boolean
  currency: string
  deactiveIncomplete: boolean
  deactivatePastDue: boolean
}

type StripeEventTypes = Stripe.Event['type']
type StripeEventName<T extends string> = T extends `stripe:${infer U}`
  ? Stripe.Event & { type: U }
  : never

// TODO: IT works but it is slow asf
type StrictStripeEventList = {
  [key in `stripe:${StripeEventTypes}`]: StripeEventName<key>
}

type RelaxedStripeEventList = {
  [key in `stripe:${StripeEventTypes}`]: any
}

declare module '@adonisjs/core/types' {
  interface EventsList extends RelaxedStripeEventList {}
}
