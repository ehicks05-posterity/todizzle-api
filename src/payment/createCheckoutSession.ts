import { stripe } from '../stripe.ts';

const CHECKOUT_RETURN_URL = Deno.env.get('CHECKOUT_RETURN_URL');

export const createCheckoutSession = (
	{ priceId, customerId, userId }: {
		priceId: string;
		customerId: string;
		userId: string;
	},
) => {
	return stripe.checkout.sessions.create({
		line_items: [{ price: priceId, quantity: 1 }],
		mode: 'subscription',
		success_url: CHECKOUT_RETURN_URL,
		cancel_url: CHECKOUT_RETURN_URL,
		subscription_data: { metadata: { userId: userId } },
		customer: customerId,
	});
};
