import { HttpContext } from '@adonisjs/core/http'
import emitter from '@adonisjs/core/services/emitter'
import Stripe from 'stripe'

export async function handleWebhook(ctx: HttpContext) {
  const payload = ctx.request.body() as Stripe.Event

  await emitter.emit(`stripe:${payload.type}`, payload)
  await emitter.emit(`stripe:${payload.type}:handled`, payload)
}
