import Stripe from 'stripe';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';

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

  // Handle payment success by marking the related order as PAID
  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent;
    const id = typeof pi.id === 'string' ? pi.id : undefined;
    if (id) {
      try {
        await prisma.order.update({ where: { stripePaymentIntent: id }, data: { status: 'PAID' } });
      } catch {}
    }
  }
  return Response.json({ received: true });
}
