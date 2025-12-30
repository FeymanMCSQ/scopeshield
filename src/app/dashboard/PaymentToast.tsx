'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PaymentToast() {
  const params = useSearchParams();
  const router = useRouter();

  const paid = params.get('paid') === '1';
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!paid) return;

    // remove ?paid=1 so refresh doesn’t re-toast
    const url = new URL(window.location.href);
    url.searchParams.delete('paid');
    router.replace(url.pathname + (url.search ? url.search : ''), {
      scroll: false,
    });

    // auto-dismiss after 3s
    const t = window.setTimeout(() => setDismissed(true), 3000);
    return () => window.clearTimeout(t);
  }, [paid, router]);

  if (!paid || dismissed) return null;

  return (
    <div className="mb-4 rounded-lg border bg-white px-4 py-3 shadow-sm">
      <div className="text-sm font-medium">Payment received ✅</div>
      <div className="text-xs text-gray-600">
        Ticket marked as paid. Your future self thanks you.
      </div>
    </div>
  );
}
