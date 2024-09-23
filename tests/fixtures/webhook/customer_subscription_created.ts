export default {
  id: 'foo',
  type: 'customer.subscription.created',
  data: {
    object: {
      id: 'sub_foo',
      customer: 'cus_foo',
      cancel_at_period_end: false,
      quantity: 10,
      items: {
        data: [
          {
            id: 'bar',
            price: {
              id: 'price_foo',
              product: 'prod_bar',
            },
          },
        ],
      },
      status: 'active',
    },
  },
}
