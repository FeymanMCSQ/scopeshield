'use client';

import { useState } from 'react';

type UploadResponse = { assetUrl: string } | { error: string };

export default function TicketAssetUpload({
  ticketId,
  initialUrl,
}: {
  ticketId: string;
  initialUrl?: string | null;
}) {
  const [assetUrl, setAssetUrl] = useState<string | null>(initialUrl ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError('');
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const form = new FormData();
      form.append('file', file);

      const res = await fetch(`/api/ticket/${ticketId}/asset`, {
        method: 'POST',
        body: form,
        cache: 'no-store',
      });

      const data = (await res.json()) as UploadResponse;

      if (!res.ok) {
        throw new Error('error' in data ? data.error : 'Upload failed');
      }

      if (!('assetUrl' in data)) {
        throw new Error('Missing assetUrl');
      }

      setAssetUrl(data.assetUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
      e.currentTarget.value = '';
    }
  }

  return (
    <section className="mt-6">
      {assetUrl ? (
        <div className="mb-3">
          <img
            src={assetUrl}
            alt="Ticket attachment"
            className="max-w-full max-w-2xl rounded-lg border"
          />
        </div>
      ) : (
        <p className="text-sm text-gray-600 mb-3">No image attached yet.</p>
      )}

      <label className="inline-flex items-center gap-3">
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={onFileChange}
          disabled={loading}
          className="block text-sm"
        />
        {loading ? (
          <span className="text-sm text-gray-600">Uploading…</span>
        ) : null}
      </label>

      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </section>
  );
}
