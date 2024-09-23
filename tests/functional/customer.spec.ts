import { test } from '@japa/runner'
import User from '../fixtures/user.js'
import { createCustomer } from '../utils.js'
import { CustomerBalanceTransaction } from '../../src/customer_balance_transaction.js'
import { DateTime } from 'luxon'

test.group('customer', () => {
  test('customer can be put on a generic trial', async ({ assert }) => {
    const user = new User()

    assert.isFalse(user.onGenericTrial())

    user.trialEndsAt = DateTime.now().plus({ day: 1 })

    assert.isTrue(await user.onTrial())
    assert.isTrue(user.onGenericTrial())

    user.trialEndsAt = DateTime.now().minus({ days: 5 })

    assert.isFalse(user.onGenericTrial())
  })

  test('we can check if a generic trial has expired', async ({ assert }) => {
    const user = new User()

    user.trialEndsAt = DateTime.now().minus({ days: 1 })

    assert.isTrue(await user.hasExpiredTrial())
    assert.isTrue(user.hasExpiredGenericTrial())
  })

  test('stripe customer nethod throws exception when stripe id is not set', async ({ assert }) => {
    const user = new User()

    await assert.rejects(() => user.asStripeCustomer(), '')
  })

  test('stripe customer cannot be created when stripe id is already set', async ({ assert }) => {
    const user = new User()
    user.stripeId = 'foo'

    await assert.rejects(() => user.createAsStripeCustomer(), '')
  })

  test('customers in stripe can be updated', async ({ assert }) => {
    const user = await createCustomer('customers_in_stripe_can_be_updated')
    let customer = await user.createAsStripeCustomer()

    assert.equal(customer.address?.line1, '10 rue de la Paix')
    assert.equal(customer.address?.city, 'Paris')
    assert.equal(customer.address?.postal_code, '75002')

    customer = await user.updateStripeCustomer({ description: 'Random details' })

    assert.equal(customer.description, 'Random details')
  })

  test('customers in stripe can be created or updated', async ({ assert }) => {
    const user = await createCustomer('customers_in_stripe_can_be_created_or_updated')
    let customer = await user.updateOrCreateStripeCustomer({ description: 'It works?' })

    assert.equal(customer.address?.line1, '10 rue de la Paix')
    assert.equal(customer.address?.city, 'Paris')
    assert.equal(customer.address?.postal_code, '75002')
    assert.equal(customer.description, 'It works?')

    customer = await user.updateOrCreateStripeCustomer({ description: 'Random details' })

    assert.equal(customer.description, 'Random details')
  })

  test('customer details can be synced with stripe', async ({ assert }) => {
    const user = await createCustomer('customer_details_can_be_synced_with_stripe')
    let customer = await user.createAsStripeCustomer()

    user.name = 'Nitram Tocuap'
    user.email = 'nitram@tocuap.com'
    user.phone = '+33 6 06 06 06 06'

    customer = await user.syncStripeCustomerDetails()

    assert.equal(user.name, 'Nitram Tocuap')
    assert.equal(user.email, 'nitram@tocuap.com')
    assert.equal(user.phone, '+33 6 06 06 06 06')
    assert.equal(customer.address?.line1, '10 rue de la Paix')
    assert.equal(customer.address?.city, 'Paris')
    assert.equal(customer.address?.postal_code, '75002')
  })

  test('customer details can be synced or created with stripe', async ({ assert }) => {
    const user = await createCustomer('customer_details_can_be_synced_or_created_with_stripe')
    let customer = await user.syncOrCreateStripeCustomer({ description: 'Hello You' })

    assert.equal(customer.address?.line1, '10 rue de la Paix')
    assert.equal(customer.address?.city, 'Paris')
    assert.equal(customer.address?.postal_code, '75002')
    assert.equal(customer.description, 'Hello You')

    user.name = 'Harry Potter'
    user.email = 'harry@popotter.com'
    user.phone = '+32 987 01 01 01'

    customer = await user.syncOrCreateStripeCustomer()

    assert.equal(user.name, 'Harry Potter')
    assert.equal(user.email, 'harry@popotter.com')
    assert.equal(user.phone, '+32 987 01 01 01')
    assert.equal(customer.address?.line1, '10 rue de la Paix')
    assert.equal(customer.address?.city, 'Paris')
    assert.equal(customer.address?.postal_code, '75002')
  })

  test('customer can generate a billing portal url', async ({ assert }) => {
    const user = await createCustomer('customers_can_generate_a_billing_portal_url')
    await user.createAsStripeCustomer()

    const url = await user.billingPortalUrl('https://marting-paucot.fr')

    assert.isTrue(url.startsWith('https://billing.stripe.com/'))
  })

  test('customers can manage tax ids', async ({ assert }) => {
    const user = await createCustomer('customers_can_manage_tax_ids')
    await user.createAsStripeCustomer()

    let taxId = await user.createTaxId('eu_vat', 'BE0123456789')
    assert.equal(taxId.type, 'eu_vat')
    assert.equal(taxId.value, 'BE0123456789')
    assert.equal(taxId.country, 'BE')

    const taxIds = await user.taxIds()
    assert.lengthOf(taxIds, 1)

    const taxId2 = taxIds[0]
    assert.equal(taxId2.type, 'eu_vat')
    assert.equal(taxId2.value, 'BE0123456789')
    assert.equal(taxId2.country, 'BE')

    const taxId3 = await user.findTaxId(taxId2.id)
    assert.equal(taxId3?.type, 'eu_vat')
    assert.equal(taxId3?.value, 'BE0123456789')
    assert.equal(taxId3?.country, 'BE')

    await user.deleteTaxId(taxId3!.id)

    assert.empty(await user.taxIds())
  })

  test('customers can manage their balance', async ({ assert }) => {
    const user = await createCustomer('customers_can_manage_their_balance')
    await user.createAsStripeCustomer()

    assert.equal(0, await user.rawBalance())

    const transaction = await user.applyBalance(6900, 'Nice')
    assert.equal(await user.rawBalance(), 6900)
    assert.equal(transaction.rawAmount(), 6900)

    await user.applyBalance(-2000)

    const [transaction2] = await user.balanceTransaction()

    assert.instanceOf(transaction2, CustomerBalanceTransaction)
    assert.equal(transaction2.rawAmount(), -2000)
    assert.equal(transaction2.rawEndingBalance(), 4900)
    assert.equal(await user.rawBalance(), 4900)
  })
})
