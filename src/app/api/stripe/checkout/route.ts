import { NextResponse } from 'next/server';
import { stripe } from '../../../../lib/stripe';

export async function POST() {
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Test ScopeShield Change Request',
          },
          unit_amount: 5000, // $50
        },
        quantity: 1,
      },
    ],
    success_url: 'http://localhost:3000/success',
    cancel_url: 'http://localhost:3000/cancel',
  });

  return NextResponse.json({ url: session.url });
}
