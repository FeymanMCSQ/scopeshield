import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { put } from '@vercel/blob';
import { prisma } from '../../../../../lib/prisma';

export const runtime = 'nodejs';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // ✅ important
) {
  const { id } = await params; // ✅ important

  const cookieStore = await cookies();
  const ssUid = cookieStore.get('ss_uid')?.value;
  if (!ssUid) {
    return NextResponse.json({ error: 'Missing session' }, { status: 401 });
  }

  const ticket = await prisma.changeRequest.findUnique({
    where: { id }, // now id is real
    select: { id: true, userId: true },
  });

  if (!ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
  }

  if (ticket.userId !== ssUid) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get('file');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: 'Unsupported file type' },
      { status: 415 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large' }, { status: 413 });
  }

  const blob = await put(`tickets/${ticket.id}/asset`, file, {
    access: 'public',
    contentType: file.type,
    addRandomSuffix: false,
  });

  await prisma.changeRequest.update({
    where: { id: ticket.id },
    data: { assetUrl: blob.url },
  });

  return NextResponse.json({ assetUrl: blob.url });
}
