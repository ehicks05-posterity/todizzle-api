import { init } from '@instantdb/admin';
import schema from '../../instant.schema.ts';

const INSTANT_APP_ID = Deno.env.get('INSTANT_APP_ID');
if (!INSTANT_APP_ID) {
	throw new Error('Missing INSTANT_APP_ID');
}

const INSTANT_APP_ADMIN_TOKEN = Deno.env.get('INSTANT_APP_ADMIN_TOKEN');
if (!INSTANT_APP_ADMIN_TOKEN) {
	throw new Error('Missing INSTANT_APP_ADMIN_TOKEN');
}

export const db = init({
	appId: INSTANT_APP_ID,
	adminToken: INSTANT_APP_ADMIN_TOKEN,
	schema: schema,
});
