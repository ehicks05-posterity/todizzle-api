import { Hono } from 'hono';
import { stripe, STRIPE_WH_SECRET } from './stripe.ts';
import Stripe from 'stripe';
import { db } from './db.ts';

export const handleSubscriptionChange = async (
	eventType: Stripe.Event['type'],
	subscription: Stripe.Subscription,
) => {
	const { id, customer, status, items } = subscription;
	const productId = items.data[0].price.product;
	console.log({ eventType, id, customer, status, productId });

	const update = { activeProductId: status === 'active' ? productId : null };
	console.log('update payload:');
	console.log(update);
	// await db.transact(db.tx.customers[customer.toString()].update(update));
};

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
		case 'customer.created': {
			const customer = event.data.object;
			const { id, subscriptions } = customer;
			console.log({ id, subscriptions });
			break;
		}
		case 'customer.subscription.created': {
			const subscription = event.data.object;
			await handleSubscriptionChange(event.type, subscription);
			break;
		}
		case 'customer.subscription.deleted': {
			const subscription = event.data.object;
			await handleSubscriptionChange(event.type, subscription);
			break;
		}
		case 'customer.subscription.updated': {
			const subscription = event.data.object;
			await handleSubscriptionChange(event.type, subscription);
			break;
		}
		default:
			console.log(`Unhandled event type ${event.type}.`);
	}

	return c.body('');
});

export { webhooks };
