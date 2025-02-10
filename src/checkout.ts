import { Context, Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { stripe } from '../src/stripe.ts';
import { z } from 'zod';

const checkout = new Hono();

checkout.get('/', (c: Context) => {
	return c.text('Hello from /checkout/!');
});

checkout.post(
	'/create-checkout-session',
	zValidator(
		'json',
		z.object({
			lineItems: z.array(z.object({
				price: z.string(),
				quantity: z.number(),
			})).min(1),
		}),
	),
	async (c) => {
		const validatedData = c.req.valid('json');

		const session = await stripe.checkout.sessions.create({
			line_items: validatedData.lineItems,
			mode: 'subscription',
			success_url: '',
			cancel_url: '',
		});

		return c.json({ checkoutSessionUrl: session.url });
	},
);

export { checkout };
