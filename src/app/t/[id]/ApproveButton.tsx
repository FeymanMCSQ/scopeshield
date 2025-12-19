'use client';

import { useState } from 'react';

type ApproveResponse =
  | { ok: true; status: string; checkoutUrl?: string }
  | { error: string };

export default function ApproveButton({
  ticketId,
  disabled,
}: {
  ticketId: string;
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  async function onApprove() {
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/ticket/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId }),
      });

      const data = (await res.json()) as ApproveResponse;

      if (!res.ok) {
        throw new Error('error' in data ? data.error : 'Approve failed');
      }

      // Redirect to Stripe Checkout
      if ('checkoutUrl' in data && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      // If it returns ok but no URL, just stop
      throw new Error('Missing checkoutUrl');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Approve failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6 flex items-center gap-3">
      <button
        type="button"
        onClick={onApprove}
        disabled={disabled || loading}
        className="rounded-lg bg-[#14a800] px-4 py-2 text-white disabled:opacity-60"
      >
        {loading ? 'Redirecting...' : 'Approve & Pay'}
      </button>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
