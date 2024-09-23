import Stripe from 'stripe'
import shopkeeper from '../../services/shopkeeper.js'

type Constructor = new (...args: any[]) => {}

export interface WithHandlesTaxes {
  /**
   * The IP address of the customer used to determine the tax location.
   */
  customerIpAddress: string | null

  /**
   * The pre-collected billing address used to estimate tax rates when performing "one-off" charges.
   */
  estimationBillingAddress: unknown[]

  /**
   * Indicates if Tax IDs should be collected during a Stripe Checkout session.
   */
  collectTaxIds: boolean

  /**
   * Set the The IP address of the customer used to determine the tax location.
   */
  withTaxIpAddress(ipAddress: string): void

  /**
   * Set a pre-collected billing address used to estimate tax rates when performing "one-off" charges.
   */
  withTaxAddress(country: string, postalCode?: string, state?: string): void

  /**
   * Get the payload for Stripe automatic tax calculation.
   */
  automaticTaxPayload(): unknown

  /**
   * Determine if automatic tax is enabled.
   */
  isAutomaticTaxEnabled(): boolean

  /**
   * Indicate that Tax IDs should be collected during a Stripe Checkout session.
   */
  withTaxIdsCollect(): void
}

export function HandlesTaxes<Model extends Constructor>(superclass: Model) {
  return class WithHandlesTaxes extends superclass implements WithHandlesTaxes {
    customerIpAddress: string | null = null
    estimationBillingAddress: unknown[] = []
    collectTaxIds = false

    withTaxIpAddress(ipAddress: string): void {
      this.customerIpAddress = ipAddress
    }

    withTaxAddress(country: string, postalCode?: string, state?: string): void {
      this.estimationBillingAddress = {
        country,
        postalCode,
        state,
      }
    }

    automaticTaxPayload(): Stripe.SubscriptionCreateParams.AutomaticTax {
      return {
        // TODO: Check if necessary
        // customer_ip_address: this.customerIpAddress,
        // estimation_billing_address: this.estimationBillingAddress,
        enabled: this.isAutomaticTaxEnabled(),
      }
    }

    isAutomaticTaxEnabled(): boolean {
      return shopkeeper.calculateTaxes
    }

    withTaxIdsCollect(): void {
      this.collectTaxIds = true
    }
  }
}
