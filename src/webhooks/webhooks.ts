import { Hono } from 'hono';
import { stripe, STRIPE_WH_SECRET } from '../lib/stripe.ts';
import { EVENT_TYPES } from './constants.ts';
import { syncSubscriptionToDb } from './syncSubscriptionToDb.ts';

const webhooks = new Hono();

webhooks.post('/stripe', async (c) => {
	const sig = c.req.header('stripe-signature');
	if (!sig) {
		return c.text('', 401);
	}

	const event = await stripe.webhooks.constructEventAsync(
		await c.req.text(),
		sig,
		STRIPE_WH_SECRET!,
	);

	if (!EVENT_TYPES.includes) {
		console.log(`Unhandled event type ${event.type}.`);
		return;
	}

	const { customer: customerId } = event?.data?.object as {
		customer: string;
	};

	if (typeof customerId !== 'string') {
		throw new Error(`Missing customer id in event: ${event.type}`);
	}

	await syncSubscriptionToDb(customerId);

	return c.body('');
});

export { webhooks };
