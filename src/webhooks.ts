import { Hono } from 'hono';
import { stripe, STRIPE_WH_SECRET } from './stripe.ts';

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

	switch (event.type) {
		case 'customer.created':
			console.log({ customerId: event.data.object.id });
			break;
		case 'customer.subscription.created':
			break;
		case 'customer.subscription.deleted':
			break;
		case 'customer.subscription.updated':
			break;
		default:
			console.log(`Unhandled event type ${event.type}.`);
	}

	return c.body('');
});

export { webhooks };
