// src/app/t/[id]/TicketEmbedPreview.tsx
import { buildEmbedPreviewFromMessage } from '@/src/lib/embedPreview';

export async function TicketEmbedPreview({ message }: { message: string }) {
  const preview = await buildEmbedPreviewFromMessage(message);

  if (preview.kind === 'none') return null;

  if (preview.provider === 'figma' && preview.kind === 'iframe') {
    return (
      <div className="mt-4 rounded-xl border overflow-hidden">
        <div className="px-3 py-2 text-sm opacity-70">Figma preview</div>
        <iframe
          src={preview.src}
          className="w-full"
          style={{ height: 520 }}
          loading="lazy"
          // keep it safe-ish
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          allow="fullscreen; clipboard-write"
        />
      </div>
    );
  }

  if (preview.provider === 'canva' && preview.kind === 'html') {
    // Canva returns HTML for embedding; we *only* allow this for canva.com URLs
    // (The allowlist enforcement happens in buildEmbedPreviewFromMessage)
    return (
      <div className="mt-4 rounded-xl border overflow-hidden">
        <div className="px-3 py-2 text-sm opacity-70">Canva preview</div>
        <div
          className="p-3"
          dangerouslySetInnerHTML={{ __html: preview.html }}
        />
      </div>
    );
  }

  return null;
}
