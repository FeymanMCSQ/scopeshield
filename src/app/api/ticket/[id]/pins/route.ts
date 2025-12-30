// src/app/api/ticket/[id]/pins/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';

export const runtime = 'nodejs';

function isFiniteNumber(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n);
}

function clamp01(n: number): boolean {
  return n >= 0 && n <= 1;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Optional: ensure ticket exists (prevents leaking "pins exist" for random ids)
  // If you prefer speed, you can skip this and just return [] when none.
  const ticket = await prisma.changeRequest.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
  }

  const pins = await prisma.ticketPin.findMany({
    where: { ticketId: id },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      x: true,
      y: true,
      note: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ pins });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Ensure ticket exists
  const ticket = await prisma.changeRequest.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (typeof body !== 'object' || body === null) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  const { x, y, note } = body as Record<string, unknown>;

  if (!isFiniteNumber(x) || !isFiniteNumber(y)) {
    return NextResponse.json(
      { error: 'x and y must be numbers' },
      { status: 400 }
    );
  }

  if (!clamp01(x) || !clamp01(y)) {
    return NextResponse.json(
      { error: 'x and y must be within [0, 1]' },
      { status: 400 }
    );
  }

  if (note !== undefined && typeof note !== 'string') {
    return NextResponse.json(
      { error: 'note must be a string if provided' },
      { status: 400 }
    );
  }

  // Keep notes sane (prevents someone pasting a novel)
  const cleanNote = typeof note === 'string' ? note.trim().slice(0, 500) : null;

  const pin = await prisma.ticketPin.create({
    data: {
      ticketId: id,
      x,
      y,
      note: cleanNote && cleanNote.length > 0 ? cleanNote : null,
    },
    select: {
      id: true,
      x: true,
      y: true,
      note: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ pin }, { status: 201 });
}
