import Stripe from 'stripe';

export const runtime = 'nodejs'; // ensure Node runtime for webhooks/crypto

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const contentType = req.headers.get('content-type') || '';
  let amount: number | undefined;
  let currency = 'usd';

  if (contentType.includes('application/json')) {
    const body = await req.json();
    amount = Number(body.amount);
    if (body.currency) currency = String(body.currency);
  } else if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
    const form = await req.formData();
    amount = Number(form.get('amount'));
    const c = form.get('currency');
    if (c) currency = String(c);
  } else {
    // Try JSON as a default fallback
    try {
      const body = await req.json();
      amount = Number(body.amount);
      if (body.currency) currency = String(body.currency);
    } catch {
      return new Response('Unsupported content type', { status: 415 });
    }
  }

  if (!Number.isFinite(amount) || (amount as number) <= 0) {
    return new Response('Invalid amount', { status: 400 });
  }
  const pi = await stripe.paymentIntents.create({
    amount: amount!,
    currency,
    automatic_payment_methods: { enabled: true },
  });
  return Response.json({ clientSecret: pi.client_secret, id: pi.id });
}
