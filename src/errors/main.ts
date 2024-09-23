import { CustomerAlreadyCreatedError } from './customer_already_created.js'
import { IncompletePaymentError } from './incomplete_payment.js'
import { InvalidArgumentError } from './invalid_argument.js'
import { InvalidCustomerError } from './invalid_customer.js'
import { InvalidInvoiceError } from './invalid_invoice.js'
import { InvalidPaymentError } from './invalid_payment.js'
import { SubscriptionUpdateFailureError } from './subscription_update_failure.js'

export const E_CUSTOMER_ALREADY_CREATED = CustomerAlreadyCreatedError
export const E_INCOMPLETE_PAYMENT = IncompletePaymentError
export const E_INVALID_ARGUMENT = InvalidArgumentError
export const E_INVALID_CUSTOMER = InvalidCustomerError
export const E_INVALID_INVOICE = InvalidInvoiceError
export const E_INVALID_PAYMENT = InvalidPaymentError
export const E_SUBSCRIPTION_UPDATE_FAILURE = SubscriptionUpdateFailureError
