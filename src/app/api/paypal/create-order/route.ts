import { NextResponse } from 'next/server';
import { getPayPalAccessToken, getPayPalBaseUrl } from '@/lib/paypal';

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let amount = 0;
    let currency = 'USD';
    if (contentType.includes('application/json')) {
      const body = await req.json();
      amount = Number(body.amount ?? 0);
      currency = String(body.currency || 'USD').toUpperCase();
    } else {
      const fd = await req.formData();
      amount = Number(fd.get('amount') ?? 0);
      currency = String(fd.get('currency') || 'USD').toUpperCase();
    }

    if (!(amount > 0)) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const token = await getPayPalAccessToken();
    const base = getPayPalBaseUrl();

    const res = await fetch(`${base}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: (amount / 100).toFixed(2),
            },
          },
        ],
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: 'PayPal create order failed', details: data }, { status: 500 });
    }

    return NextResponse.json({ id: data.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'PayPal error' }, { status: 500 });
  }
}

