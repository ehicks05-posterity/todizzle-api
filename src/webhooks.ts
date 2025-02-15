import { Hono } from 'hono';
import { stripe, STRIPE_WH_SECRET } from './stripe.ts';
import Stripe from 'stripe';
import { db } from './db.ts';
import { id, lookup } from '@instantdb/admin';

export const ACTIVE_STATUSES: Stripe.Subscription['status'][] = [
	'active',
	'trialing',
	'past_due',
];

const INACTIVE_PRODUCT_ID = 'free';

const extractSubscriptionFields = (subscription: Stripe.Subscription) => {
	const { customer, status, items, metadata } = subscription;
	const { product } = items.data[0].price;
	const productId = typeof product === 'string' ? product : product.id;
	const customerId = typeof customer === 'string' ? customer : customer.id;
	const isActive = ACTIVE_STATUSES.includes(status);

	return {
		userId: metadata.userId,
		stripeCustomerId: customerId,
		productId: isActive ? productId : INACTIVE_PRODUCT_ID,
	};
};

export const handleSubscriptionChange = async (
	subscription: Stripe.Subscription,
) => {
	const { userId, stripeCustomerId, productId } = extractSubscriptionFields(
		subscription,
	);

	// look for existing customer entity by userId
	const customers = await db.query({
		customers: { $: { where: { 'owner.id': userId } } },
	});
	const customerId = customers.customers[0]?.id;

	// upsert customer entity and link customer to $user entity
	await db.transact(
		db.tx.customers[customerId || id()].update({
			customerId: stripeCustomerId,
		}).link({ owner: userId }),
	);

	// link product to $user
	await db.transact(
		db.tx.products[lookup('productId', productId)].link({
			subscribers: userId,
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
	console.log(`incoming ${event.type}`);

	switch (event.type) {
		case 'customer.subscription.created': {
			await handleSubscriptionChange(event.data.object);
			break;
		}
		case 'customer.subscription.deleted': {
			await handleSubscriptionChange(event.data.object);
			break;
		}
		case 'customer.subscription.updated': {
			await handleSubscriptionChange(event.data.object);
			break;
		}
		default:
			console.log(`Unhandled event type ${event.type}.`);
	}

	return c.body('');
});

export { webhooks };
