import { Context, Hono } from 'hono'
import { stripe } from './stripe.ts';

const app = new Hono()

app.get('/', (c: Context) => {
  return c.text('Hello Hono!')
})

app.get('/payment', async (c: Context) => {
  const events = await stripe.events.list()
  const result = { result: 'Hello from /payment!', events };
  return c.json(result)
})

Deno.serve(app.fetch)
