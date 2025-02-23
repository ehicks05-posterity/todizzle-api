import Stripe from 'stripe';

const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY');
if (!STRIPE_SECRET_KEY) {
	throw new Error('Missing STRIPE_SECRET_KEY');
}

const STRIPE_WH_SECRET = Deno.env.get('STRIPE_WH_SECRET');
if (!STRIPE_WH_SECRET) {
	throw new Error('Missing STRIPE_WH_SECRET');
}

const stripe = new Stripe(STRIPE_SECRET_KEY);

export { stripe, STRIPE_WH_SECRET };
