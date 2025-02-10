import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { payments } from './payments.ts';
import { webhooks } from './webhooks.ts';

const app = new Hono();

app.use(cors());

app.get('/', (c) => {
	return c.text('Hello Hono!');
});

app.route('/payments', payments);
app.route('/webhooks', webhooks);

Deno.serve(app.fetch);
