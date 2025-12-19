import { NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { cookies } from 'next/headers';

type DashboardTicket = {
  id: string;
  createdAt: string;
  message: string;
  priceCents: number;
  status: string;
  client: { id: string; name: string };
};

export async function GET() {
  // middleware sets ss_uid
  const store = await cookies();
  const ssUid = store.get('ss_uid')?.value;

  if (!ssUid) {
    return NextResponse.json({ error: 'missing session' }, { status: 401 });
  }

  const tickets = await prisma.changeRequest.findMany({
    where: { userId: ssUid },
    orderBy: { createdAt: 'desc' },
    include: { client: { select: { id: true, name: true } } },
  });

  // "recaptured revenue": money you've successfully converted into paid work
  const recapturedRevenueCents = tickets
    .filter((t) => t.status === 'paid')
    .reduce((sum, t) => sum + t.price, 0);

  const items: DashboardTicket[] = tickets.map((t) => ({
    id: t.id,
    createdAt: t.createdAt.toISOString(),
    message: t.message,
    priceCents: t.price,
    status: t.status,
    client: { id: t.client.id, name: t.client.name },
  }));

  return NextResponse.json({
    userId: ssUid,
    counts: {
      total: tickets.length,
      pending: tickets.filter((t) => t.status === 'pending').length,
      approved: tickets.filter((t) => t.status === 'approved').length,
      paid: tickets.filter((t) => t.status === 'paid').length,
    },
    recapturedRevenueCents,
    recapturedRevenueDollars: Number((recapturedRevenueCents / 100).toFixed(2)),
    tickets: items,
  });
}
