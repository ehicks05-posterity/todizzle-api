import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { stripe } from './stripe.ts';
import { z } from 'zod';

const payments = new Hono();

payments.get('/products', async (c) => {
	const products = await stripe.products.list({
		expand: ['data.default_price'],
	});
	return c.json({ products });
});

payments.post(
	'/test',
	zValidator('json', z.object({ priceId: z.string() })),
	(c) => {
		const { priceId } = c.req.valid('json');
		console.log({ priceId });
		return c.json({ checkoutSessionUrl: 'https://www.ehicks.net' });
	},
);

payments.post(
	'/create-checkout-session',
	zValidator('json', z.object({ priceId: z.string() })),
	async (c) => {
		const { priceId } = c.req.valid('json');

		const session = await stripe.checkout.sessions.create({
			line_items: [{ price: priceId, quantity: 1 }],
			mode: 'subscription',
			success_url: '',
			cancel_url: '',
		});

		return c.json({ checkoutSessionUrl: session.url });
	},
);

export { payments };
