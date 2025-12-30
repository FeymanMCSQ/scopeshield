'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

type Pin = {
  id: string;
  x: number; // normalized 0..1
  y: number; // normalized 0..1
  note: string | null;
  createdAt: string;
};

type Props = {
  ticketId: string;
  imageUrl: string;
  initialPins?: Pin[];
};

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

export default function TicketPinsOverlay({
  ticketId,
  imageUrl,
  initialPins,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [pins, setPins] = useState<Pin[]>(initialPins ?? []);
  const [loading, setLoading] = useState<boolean>(!initialPins);
  const [error, setError] = useState<string | null>(null);

  // when true, clicking places pins
  const [pinMode, setPinMode] = useState(true);

  // hover tooltip
  const [hoverPinId, setHoverPinId] = useState<string | null>(null);

  // note editor
  const [editingPinId, setEditingPinId] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState<string>('');

  async function fetchPins() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ticket/${ticketId}/pins`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`GET pins failed: ${res.status}`);
      const data: { pins: Pin[] } = await res.json();
      setPins(data.pins);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load pins');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!initialPins) void fetchPins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  async function saveNote(pinId: string) {
    setError(null);

    const noteToSave = draftNote;

    // optimistic local update
    setPins((prev) =>
      prev.map((p) =>
        p.id === pinId
          ? { ...p, note: noteToSave.trim() ? noteToSave.trim() : null }
          : p
      )
    );

    try {
      const res = await fetch(`/api/ticket/${ticketId}/pin/${pinId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: noteToSave }),
      });

      if (!res.ok) throw new Error(`PATCH note failed: ${res.status}`);

      const data: { pin: Pin } = await res.json();
      setPins((prev) => prev.map((p) => (p.id === pinId ? data.pin : p)));

      setEditingPinId(null);
      setDraftNote('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save note');
    }
  }

  async function createPin(x: number, y: number) {
    setError(null);

    // close any open editor
    setEditingPinId(null);
    setDraftNote('');

    // optimistic pin (temporary id)
    const tempId = `temp-${crypto.randomUUID()}`;
    const optimistic: Pin = {
      id: tempId,
      x,
      y,
      note: null,
      createdAt: new Date().toISOString(),
    };

    setPins((prev) => [...prev, optimistic]);

    try {
      const res = await fetch(`/api/ticket/${ticketId}/pins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x, y }),
      });

      if (!res.ok) throw new Error(`POST pin failed: ${res.status}`);

      const data: { pin: Pin } = await res.json();

      // replace temp pin with real one
      setPins((prev) => prev.map((p) => (p.id === tempId ? data.pin : p)));

      // immediately open note editor for the newly created pin
      setEditingPinId(data.pin.id);
      setDraftNote(data.pin.note ?? '');
    } catch (e) {
      // rollback optimistic
      setPins((prev) => prev.filter((p) => p.id !== tempId));
      setError(e instanceof Error ? e.message : 'Failed to create pin');
    }
  }

  function handleClick(e: React.MouseEvent) {
    if (!pinMode) return;
    if (!containerRef.current) return;

    // Don’t place a pin if user clicks on a pin element / tooltip / editor
    const target = e.target as HTMLElement;
    if (target?.dataset?.pin === 'true') return;

    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const x = clamp01(clickX / rect.width);
    const y = clamp01(clickY / rect.height);

    void createPin(x, y);
  }

  const pinCountLabel = useMemo(() => {
    if (loading) return 'Pins: loading…';
    return `Pins: ${pins.length}`;
  }, [loading, pins.length]);

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-gray-600">{pinCountLabel}</div>

        <button
          type="button"
          className="text-sm border rounded-md px-2 py-1 hover:bg-gray-50"
          onClick={() => {
            setPinMode((v) => !v);
            setEditingPinId(null);
            setDraftNote('');
          }}
        >
          {pinMode ? 'Pin mode: ON' : 'Pin mode: OFF'}
        </button>
      </div>

      {error ? <div className="mb-2 text-sm text-red-600">{error}</div> : null}

      <div
        ref={containerRef}
        onClick={handleClick}
        className="relative w-full overflow-hidden rounded-lg border bg-white select-none"
        style={{ cursor: pinMode ? 'crosshair' : 'default' }}
      >
        <img
          src={imageUrl}
          alt="Ticket attachment"
          className="block w-full h-auto"
          draggable={false}
        />

        {/* pins layer */}
        {pins.map((p) => {
          const leftPct = `${p.x * 100}%`;
          const topPct = `${p.y * 100}%`;

          const isEditing = editingPinId === p.id;

          return (
            <div
              key={p.id}
              className="absolute"
              style={{
                left: leftPct,
                top: topPct,
                transform: 'translate(-50%, -100%)',
              }}
              onMouseEnter={() => setHoverPinId(p.id)}
              onMouseLeave={() =>
                setHoverPinId((curr) => (curr === p.id ? null : curr))
              }
            >
              {/* marker */}
              <button
                data-pin="true"
                type="button"
                className="h-3 w-3 rounded-full border border-white bg-black shadow cursor-pointer"
                title={p.note ?? 'Pin'}
                onClick={(ev) => {
                  ev.stopPropagation();
                  setEditingPinId(p.id);
                  setDraftNote(p.note ?? '');
                }}
              />

              {/* note editor (shown for selected pin) */}
              {isEditing ? (
                <div
                  data-pin="true"
                  className="mt-2 w-[240px] rounded-md border bg-white p-2 shadow"
                  onClick={(ev) => ev.stopPropagation()}
                >
                  <div className="text-xs font-medium mb-1">Add a note</div>
                  <textarea
                    data-pin="true"
                    className="w-full text-xs border rounded p-1"
                    rows={3}
                    value={draftNote}
                    onChange={(e) => setDraftNote(e.target.value)}
                    placeholder="e.g., move logo up 12px"
                  />
                  <div className="mt-2 flex gap-2 justify-end">
                    <button
                      data-pin="true"
                      type="button"
                      className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
                      onClick={() => {
                        setEditingPinId(null);
                        setDraftNote('');
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      data-pin="true"
                      type="button"
                      className="text-xs px-2 py-1 border rounded bg-black text-white"
                      onClick={() => void saveNote(p.id)}
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : null}

              {/* hover tooltip (only when NOT editing this pin) */}
              {hoverPinId === p.id && !isEditing ? (
                <div
                  data-pin="true"
                  className="mt-2 max-w-[220px] rounded-md border bg-white px-2 py-1 text-xs shadow"
                  onClick={(ev) => ev.stopPropagation()}
                >
                  <div className="font-medium">Pin</div>
                  <div className="text-gray-600">
                    {p.note ? p.note : 'No note yet'}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <p className="mt-2 text-xs text-gray-500">
        {pinMode
          ? 'Click the image to drop a pin. Click a pin to add/edit a note.'
          : 'Pin mode is off. Toggle it to place pins.'}
      </p>
    </section>
  );
}
