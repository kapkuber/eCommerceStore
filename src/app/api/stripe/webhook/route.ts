import Stripe from 'stripe';
import { headers } from 'next/headers';

export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const sig = (await headers()).get('stripe-signature')!;
  const body = Buffer.from(await req.arrayBuffer());

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch {
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // handle events...
  return Response.json({ received: true });
}
