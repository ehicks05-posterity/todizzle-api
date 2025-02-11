import { Hono } from 'hono';
import { validator } from 'hono/validator';
import { zValidator } from '@hono/zod-validator';
import { stripe } from './stripe.ts';
import { z } from 'zod';
import { db } from './db.ts';
import { HTTPException } from 'hono/http-exception';
import { User } from '@instantdb/admin';

const payments = new Hono();

payments.get('/products', async (c) => {
	const products = await stripe.products.list({
		expand: ['data.default_price'],
	});
	return c.json({ products });
});

payments.post(
	'/test',
	validator('header', async (value) => {
		const refresh_token = value['authorization'];
		const user: User = await db.auth.getUser({ refresh_token });

		if (!user) {
			throw new HTTPException(401, { message: 'user is required' });
		}
		return { user } as { user: User };
	}),
	zValidator('json', z.object({ priceId: z.string() })),
	async (c) => {
		const { user } = c.req.valid('header');
		const { priceId } = c.req.valid('json');
		console.log({ user, priceId });
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
