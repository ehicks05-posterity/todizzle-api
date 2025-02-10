import Stripe from 'stripe';

const SECRET_API_KEY = Deno.env.get('STRIPE_SECRET_KEY');
if (!SECRET_API_KEY) {
	throw new Error('Missing key');
}

const STRIPE_WH_SECRET = Deno.env.get('STRIPE_WH_SECRET');
if (!STRIPE_WH_SECRET) {
	throw new Error('Missing webhook secret');
}

const stripe = new Stripe(SECRET_API_KEY);

export { stripe, STRIPE_WH_SECRET };
