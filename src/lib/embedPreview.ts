// src/lib/embedPreview.ts

export type EmbedPreview =
  | { provider: 'figma'; kind: 'iframe'; src: string; title?: string }
  | {
      provider: 'canva';
      kind: 'html';
      html: string;
      title?: string;
      thumbnailUrl?: string;
    }
  | { provider: 'none'; kind: 'none' };

const URL_RE = /(https?:\/\/[^\s]+)/g;

// Figma: match official-ish URL shapes and convert to embed.figma.com
// Figma docs: convert www.figma.com -> embed.figma.com and keep path/query. :contentReference[oaicite:2]{index=2}
export function extractFirstUrl(text: string): string | null {
  const m = text.match(URL_RE);
  return m?.[0] ?? null;
}

export function isFigmaUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname.endsWith('figma.com');
  } catch {
    return false;
  }
}

export function toFigmaEmbedSrc(
  url: string,
  embedHost = 'scopeshield'
): string {
  const u = new URL(url);
  // convert subdomain to embed.* (docs suggest embed.figma.com for Embed Kit 2.0)
  // If hostname is "www.figma.com" -> "embed.figma.com"
  // If hostname is "figma.com" -> "embed.figma.com"
  const host =
    u.hostname === 'figma.com'
      ? 'embed.figma.com'
      : u.hostname.replace(/^www\./, 'embed.');
  u.hostname = host;

  // Ensure required query param for Embed Kit 2.0: embed-host (docs show this) :contentReference[oaicite:3]{index=3}
  const params = u.searchParams;
  if (!params.has('embed-host')) params.set('embed-host', embedHost);

  return u.toString();
}

export function isCanvaUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.hostname.endsWith('canva.com');
  } catch {
    return false;
  }
}

type CanvaOEmbedResponse = {
  type?: string;
  version?: string;
  title?: string;
  html?: string;
  thumbnail_url?: string;
};

async function fetchCanvaOEmbed(url: string): Promise<CanvaOEmbedResponse> {
  // Canva documented migration: old endpoint -> new endpoint. :contentReference[oaicite:4]{index=4}
  const endpoints = [
    'https://api.canva.com/_spi/presentation/_oembed',
    'https://www.canva.com/_oembed',
  ];

  let lastErr: unknown = null;

  for (const endpoint of endpoints) {
    try {
      const api = new URL(endpoint);
      api.searchParams.set('url', url);
      api.searchParams.set('format', 'json');

      const res = await fetch(api.toString(), {
        // this is public metadata; caching is fine
        cache: 'force-cache',
      });

      if (!res.ok) throw new Error(`Canva oEmbed ${res.status}`);
      return (await res.json()) as CanvaOEmbedResponse;
    } catch (e) {
      lastErr = e;
    }
  }

  throw lastErr ?? new Error('Canva oEmbed failed');
}

export async function buildEmbedPreviewFromMessage(
  message: string
): Promise<EmbedPreview> {
  const url = extractFirstUrl(message);
  if (!url) return { provider: 'none', kind: 'none' };

  if (isFigmaUrl(url)) {
    return {
      provider: 'figma',
      kind: 'iframe',
      src: toFigmaEmbedSrc(url),
    };
  }

  if (isCanvaUrl(url)) {
    const data = await fetchCanvaOEmbed(url);
    if (!data.html) return { provider: 'none', kind: 'none' };

    return {
      provider: 'canva',
      kind: 'html',
      html: data.html,
      title: data.title,
      thumbnailUrl: data.thumbnail_url,
    };
  }

  return { provider: 'none', kind: 'none' };
}
