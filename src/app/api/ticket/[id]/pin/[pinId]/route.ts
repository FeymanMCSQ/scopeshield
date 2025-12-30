import { NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export const runtime = 'nodejs';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ pinId: string }> }
) {
  const { pinId } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const { note } = body as Record<string, unknown>;

  if (note !== null && note !== undefined && typeof note !== 'string') {
    return NextResponse.json(
      { error: 'note must be a string (or null)' },
      { status: 400 }
    );
  }

  const cleanNote = typeof note === 'string' ? note.trim().slice(0, 500) : null;

  const updated = await prisma.ticketPin.update({
    where: { id: pinId },
    data: { note: cleanNote && cleanNote.length > 0 ? cleanNote : null },
    select: { id: true, x: true, y: true, note: true, createdAt: true },
  });

  return NextResponse.json({ pin: updated });
}
