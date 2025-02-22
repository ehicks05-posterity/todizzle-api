import { Hono } from 'hono';
import { validator } from 'hono/validator';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '../db.ts';
import { HTTPException } from 'hono/http-exception';
import type { User } from '@instantdb/admin';
import { getOrCreateCustomer } from './getOrCreateCustomer.ts';
import { createCheckoutSession } from './createCheckoutSession.ts';

const payments = new Hono();

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

		const customerId = await getOrCreateCustomer(user);

		const checkoutSession = await createCheckoutSession({
			priceId,
			customerId,
			userId: user.id,
		});

		return c.json({ checkoutSessionUrl: checkoutSession.url });
	},
);

export { payments };
