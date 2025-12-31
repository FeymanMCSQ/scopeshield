//src/app/api/create-ticket/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type Body = {
  clientName?: string;
  clientId?: string;
  message: string;
  priceDollars: number;
};

export async function POST(req: Request) {
  const body = (await req.json()) as Partial<Body>;

  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) {
    return NextResponse.json({ error: 'message required' }, { status: 400 });
  }

  const priceDollars = body.priceDollars;
  if (typeof priceDollars !== 'number' || Number.isNaN(priceDollars)) {
    return NextResponse.json(
      { error: 'priceDollars must be a number' },
      { status: 400 }
    );
  }

  const store = await cookies();
  const cookieUid = store.get('ss_uid')?.value;

  // Extension support: allow header-based identity if cookie is missing
  const headerUid = req.headers.get('x-ss-uid')?.trim();

  const ssUid = cookieUid || headerUid;

  if (!ssUid) {
    return NextResponse.json({ error: 'missing session' }, { status: 401 });
  }

  if (ssUid.length > 200) {
    return NextResponse.json({ error: 'invalid session' }, { status: 401 });
  }

  // Ensure a DB User exists for this session id
  const user = await prisma.user.upsert({
    where: { id: ssUid },
    update: {},
    create: { id: ssUid },
    select: { id: true },
  });

  // Resolve client
  const providedClientId =
    typeof body.clientId === 'string' && body.clientId.trim()
      ? body.clientId.trim()
      : undefined;

  let clientId: string;

  if (providedClientId) {
    clientId = providedClientId;
  } else {
    const name =
      typeof body.clientName === 'string' && body.clientName.trim()
        ? body.clientName.trim()
        : 'Default Client';

    // Reuse existing client (same userId + name) if it exists
    const existing = await prisma.client.findFirst({
      where: { userId: user.id, name },
      select: { id: true },
    });

    if (existing) {
      clientId = existing.id;
    } else {
      const created = await prisma.client.create({
        data: { name, userId: user.id },
        select: { id: true },
      });
      clientId = created.id;
    }
  }

  const priceCents = Math.max(0, Math.round(priceDollars * 100));

  const cr = await prisma.changeRequest.create({
    data: {
      message,
      price: priceCents,
      status: 'pending',
      userId: user.id,
      clientId,
    },
    select: { id: true },
  });

  const origin =
    process.env.NEXT_PUBLIC_APP_URL ??
    'http://localhost:3000';

  const url = `${origin}/t/${cr.id}`;

  return NextResponse.json(
    { ticketId: cr.id, url },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
