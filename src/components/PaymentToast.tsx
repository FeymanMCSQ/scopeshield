'use client';

import { useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PaymentToast() {
  const params = useSearchParams();
  const router = useRouter();

  const shouldShow = useMemo(() => params.get('paid') === '1', [params]);

  useEffect(() => {
    if (!shouldShow) return;

    // Only start the "auto-dismiss" countdown when the page is actually visible
    let started = false;
    let timeoutId: number | null = null;

    const dismiss = () => {
      const url = new URL(window.location.href);
      url.searchParams.delete('paid');
      router.replace(url.pathname + url.search, { scroll: false });
    };

    const startCountdown = () => {
      if (started) return;
      started = true;

      // Keep toast visible long enough to be noticed
      timeoutId = window.setTimeout(dismiss, 7000);
    };

    if (document.visibilityState === 'visible') startCountdown();

    const onVis = () => {
      if (document.visibilityState === 'visible') startCountdown();
    };

    document.addEventListener('visibilitychange', onVis);

    return () => {
      document.removeEventListener('visibilitychange', onVis);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [shouldShow, router]);

  if (!shouldShow) return null;

  return (
    <div className="mb-4 rounded-lg border bg-white px-4 py-3 shadow-sm">
      <div className="text-sm font-medium">Payment received ✅</div>
      <div className="text-xs text-gray-600">
        Ticket marked as paid. Your future self thanks you.
      </div>
    </div>
  );
}
