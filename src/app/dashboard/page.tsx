// src/app/dashboard/page.tsx
import { cookies } from 'next/headers';
import PaymentToast from '../../components/PaymentToast';
import RevenueTrendChart from './RevenueTrendChart';
import ExtensionPairing from './ExtensionPairing';

type Ticket = {
  id: string;
  createdAt: string;
  message: string;
  priceCents: number;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  client: {
    id: string;
    name: string;
  };
};

type DashboardResponse = {
  tickets: Ticket[];
};

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  // cookies() is async in your setup
  const cookieStore = await cookies();
  const ss_uid = cookieStore.get('ss_uid')?.value;

  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  const res = await fetch('http://localhost:3000/api/dashboard', {
    headers: { Cookie: cookieHeader },
    cache: 'no-store',
  });

  if (!res.ok) {
    return <main className="p-8">Failed to load dashboard</main>;
  }

  const data = (await res.json()) as DashboardResponse;

  return (
    <main className="p-8 max-w-5xl mx-auto">
      <ExtensionPairing ss_uid={ss_uid} />

      <PaymentToast />
      <RevenueTrendChart />

      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>

      {/* Filters (UI shell only) */}
      <div className="mb-6 flex gap-4">
        <select className="border rounded px-3 py-2 text-sm">
          <option>All clients</option>
        </select>

        <select className="border rounded px-3 py-2 text-sm">
          <option>All statuses</option>
          <option>Pending</option>
          <option>Approved</option>
          <option>Paid</option>
        </select>
      </div>

      {/* Tickets list */}
      <div className="space-y-4">
        {data.tickets.map((t) => (
          <div
            key={t.id}
            className="border rounded-lg p-4 flex justify-between items-start"
          >
            <div>
              <p className="text-sm text-gray-500 mb-1">
                {t.client.name} · {new Date(t.createdAt).toLocaleDateString()}
              </p>

              <p className="text-gray-800">{t.message}</p>
            </div>

            <div className="text-right">
              <p className="font-medium">${(t.priceCents / 100).toFixed(2)}</p>
              <p className="text-xs text-gray-500 capitalize">{t.status}</p>
            </div>
          </div>
        ))}

        {data.tickets.length === 0 && (
          <p className="text-gray-500">No requests yet.</p>
        )}
      </div>
    </main>
  );
}
