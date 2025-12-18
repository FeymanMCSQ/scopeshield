import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const store = await cookies();
  return NextResponse.json({ ss_uid: store.get('ss_uid')?.value ?? null });
}
