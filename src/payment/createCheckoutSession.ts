import { stripe } from '../lib/stripe.ts';

const CHECKOUT_RETURN_URL = Deno.env.get('CHECKOUT_RETURN_URL');

interface Params {
	priceId: string;
	customerId: string;
}

export const createCheckoutSession = ({ priceId, customerId }: Params) =>
	stripe.checkout.sessions.create({
		mode: 'subscription',
		customer: customerId,
		line_items: [{ price: priceId, quantity: 1 }],
		success_url: CHECKOUT_RETURN_URL,
		cancel_url: CHECKOUT_RETURN_URL,
	});
