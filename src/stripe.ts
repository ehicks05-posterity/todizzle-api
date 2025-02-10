import Stripe from 'stripe'

const SECRET_API_KEY = Deno.env.get('STRIPE_SECRET_KEY')
if (!SECRET_API_KEY) {
  throw new Error('Missing key')
}

const stripe = new Stripe(SECRET_API_KEY)

export {stripe}