import { stripe } from '../lib/stripe.ts';
import { db } from '../lib/db.ts';
import { id, type User } from '@instantdb/admin';

export const getOrCreateCustomer = async (user: User) => {
	const { customers } = await db.asUser({ email: user.email }).query({
		customers: {},
	});
	const customerId = customers[0]?.customerId;

	if (customerId) return customerId;

	const customer = await stripe.customers.create({
		email: user.email,
		metadata: { userId: user.id },
	});

	// create customer entity and link customer to $user entity
	await db.transact(
		db.tx.customers[id()].update({
			customerId: customer.id,
		}).link({ owner: user.id }),
	);

	return customer.id;
};
