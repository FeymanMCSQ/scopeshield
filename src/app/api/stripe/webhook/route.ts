// src/app/api/stripe/webhook/route.ts
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '../../../../lib/stripe';

export async function POST(req: Request) {
  const body = await req.text();

  const h = await headers(); // <-- important in your Next version
  const signature = h.get('stripe-signature');

  if (!signature) {
    return new NextResponse('Missing Stripe signature', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed.', err);
    return new NextResponse('Invalid signature', { status: 400 });
  }

  console.log('✅ Stripe event received:', event.type);

  return NextResponse.json({ received: true });
}
