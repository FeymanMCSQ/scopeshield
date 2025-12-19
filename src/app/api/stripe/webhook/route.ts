import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '../../../../lib/stripe';
import { prisma } from '../../../../lib/prisma';
import { headers } from 'next/headers';

export async function POST(req: Request) {
  const body = await req.text();
  const h = await headers();
  const signature = h.get('stripe-signature');

  if (!signature) {
    return new NextResponse('Missing signature', { status: 400 });
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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const ticketId = session.metadata?.ticketId;

    if (ticketId) {
      await prisma.changeRequest.update({
        where: { id: ticketId },
        data: { status: 'paid' },
      });
    }
  }

  return NextResponse.json({ received: true });
}
