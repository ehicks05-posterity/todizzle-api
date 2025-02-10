import { Context, Hono } from 'hono';
import { checkout } from './checkout.ts';

const app = new Hono();

app.get('/', (c: Context) => {
	return c.text('Hello Hono!');
});

app.route('/checkout', checkout);

Deno.serve(app.fetch);
