import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/prisma';
import { stripe } from '../../../../lib/stripe';

type Body = { ticketId: string };

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<Body>;
  const ticketId = body.ticketId;

  if (!ticketId || typeof ticketId !== 'string') {
    return NextResponse.json({ error: 'ticketId required' }, { status: 400 });
  }

  const ticket = await prisma.changeRequest.findUnique({
    where: { id: ticketId },
    include: { client: true },
  });

  if (!ticket) {
    return NextResponse.json({ error: 'ticket not found' }, { status: 404 });
  }

  // If already paid, don't create another session
  if (ticket.status === 'paid') {
    return NextResponse.json({ ok: true, status: 'paid' });
  }

  // Move to approved if pending
  if (ticket.status === 'pending') {
    await prisma.changeRequest.update({
      where: { id: ticketId },
      data: { status: 'approved' },
      select: { id: true },
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  // Create Stripe Checkout Session
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    success_url: `${appUrl}/t/${ticketId}?paid=1`,
    cancel_url: `${appUrl}/t/${ticketId}?canceled=1`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: ticket.price, // cents
          product_data: {
            name: 'ScopeShield change request',
            description: ticket.message.slice(0, 120),
          },
        },
      },
    ],
    metadata: {
      ticketId,
    },
  });

  if (!session.url) {
    return NextResponse.json(
      { error: 'stripe session missing url' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    status: 'approved',
    checkoutUrl: session.url,
  });
}
