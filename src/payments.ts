import { Hono } from 'hono';
import { validator } from 'hono/validator';
import { zValidator } from '@hono/zod-validator';
import { stripe } from './stripe.ts';
import { z } from 'zod';
import { db } from './db.ts';
import { HTTPException } from 'hono/http-exception';
import type { User } from '@instantdb/admin';

const CHECKOUT_RETURN_URL = Deno.env.get('CHECKOUT_RETURN_URL');

const payments = new Hono();

payments.get('/products', async (c) => {
	const products = await stripe.products.list({
		expand: ['data.default_price'],
	});
	return c.json({ products });
});

payments.post(
	'/create-checkout-session',
	validator('header', async (value) => {
		const refresh_token = value['authorization'];

		const user = await db.auth.verifyToken(refresh_token);
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

		const customers = await db.asUser({ email: user.email }).query({
			customers: {},
		});
		const customerId = customers.customers?.[0]?.customerId;

		const session = await stripe.checkout.sessions.create({
			line_items: [{ price: priceId, quantity: 1 }],
			mode: 'subscription',
			success_url: CHECKOUT_RETURN_URL,
			cancel_url: CHECKOUT_RETURN_URL,
			subscription_data: { metadata: { userId: user.id } },
			customer: customerId,
		});

		return c.json({ checkoutSessionUrl: session.url });
	},
);

export { payments };
