import { Hono } from 'hono';
import { stripe, STRIPE_WH_SECRET } from './stripe.ts';
import Stripe from 'stripe';
import { db } from './db.ts';
import { id } from '@instantdb/admin';

export const ACTIVE_STATUSES: Stripe.Subscription['status'][] = [
	'active',
	'trialing',
	'past_due',
];

export const handleSubscriptionChange = async (
	eventType: Stripe.Event['type'],
	subscription: Stripe.Subscription,
) => {
	const { id: subscriptionId, customer, status, items, metadata } =
		subscription;
	const { userId } = metadata;
	const { product } = items.data[0].price;
	const productId = typeof product === 'string' ? product : product.id;
	const customerId = typeof customer === 'string' ? customer : customer.id;

	console.log({
		eventType,
		subscriptionId,
		customerId,
		status,
		productId,
		userId,
	});

	const update = {
		customerId,
		activeProductId: ACTIVE_STATUSES.includes(status)
			? productId
			: undefined,
	};

	const users = await db.query({
		$users: { $: { where: { id: userId } }, customer: {} },
	});
	const user = users.$users[0];

	await db.transact(
		db.tx.customers[user.customer?.id || id()].update(update).link({
			owner: userId,
		}),
	);
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
		case 'customer.subscription.created': {
			await handleSubscriptionChange(event.type, event.data.object);
			break;
		}
		case 'customer.subscription.deleted': {
			await handleSubscriptionChange(event.type, event.data.object);
			break;
		}
		case 'customer.subscription.updated': {
			await handleSubscriptionChange(event.type, event.data.object);
			break;
		}
		default:
			console.log(`Unhandled event type ${event.type}.`);
	}

	return c.body('');
});

export { webhooks };
