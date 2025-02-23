import { stripe } from '../lib/stripe';
import { db } from '../lib/db.ts';
import { lookup } from '@instantdb/admin';
import { ACTIVE_STATUSES, INACTIVE_PRODUCT_ID } from './constants.ts';
import { Stripe } from 'stripe';

const extractSubscriptionFields = (subscription: Stripe.Subscription) => {
	const { status, items, metadata } = subscription;
	const { product } = items.data[0].price;
	const productId = typeof product === 'string' ? product : product.id;
	const isActive = ACTIVE_STATUSES.includes(status);

	return {
		userId: metadata.userId,
		productId: isActive ? productId : INACTIVE_PRODUCT_ID,
	};
};

const linkProductToUser = (productId: string, userId: string) =>
	db.transact(
		db.tx.products[lookup('productId', productId)].link({
			subscribers: userId,
		}),
	);

export const syncSubscriptionToDb = async (customerId: string) => {
	const subscriptions = await stripe.subscriptions.list({
		customer: customerId,
		limit: 1,
		status: 'all',
		expand: ['data.default_payment_method'],
	});

	// handle no subscription
	if (subscriptions.data.length === 0) {
		const users = await db.query({
			$users: { customer: { $: { where: { customerId } } } },
		});
		const user = users.$users[0];

		await linkProductToUser(INACTIVE_PRODUCT_ID, user.id);
	}

	const subscription = subscriptions.data[0];

	const { userId, productId } = extractSubscriptionFields(
		subscription,
	);

	// link product to $user
	await linkProductToUser(productId, userId);
};
