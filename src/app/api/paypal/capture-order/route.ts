import { NextResponse } from 'next/server';
import { getPayPalAccessToken, getPayPalBaseUrl } from '@/lib/paypal';

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let orderId = '';
    if (contentType.includes('application/json')) {
      const body = await req.json();
      orderId = String(body.orderId || '');
    } else {
      const fd = await req.formData();
      orderId = String(fd.get('orderId') || '');
    }
    if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });

    const token = await getPayPalAccessToken();
    const base = getPayPalBaseUrl();
    const res = await fetch(`${base}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: 'PayPal capture failed', details: data }, { status: 500 });
    }

    return NextResponse.json({ status: 'ok', capture: data });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'PayPal error' }, { status: 500 });
  }
}

