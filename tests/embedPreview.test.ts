import {
  extractFirstUrl,
  isFigmaUrl,
  toFigmaEmbedSrc,
  buildEmbedPreviewFromMessage,
} from '@/src/lib/embedPreview';

describe('embed preview', () => {
  test('extractFirstUrl finds first URL', () => {
    expect(extractFirstUrl('hello https://a.com x https://b.com')).toBe(
      'https://a.com'
    );
  });

  test('figma: converts www.figma.com to embed.figma.com and adds embed-host', () => {
    const src = toFigmaEmbedSrc(
      'https://www.figma.com/design/ABCDEF/some-file?node-id=1-2'
    );
    expect(src).toContain('https://embed.figma.com/design/ABCDEF/');
    expect(src).toContain('embed-host=');
    expect(isFigmaUrl('https://www.figma.com/design/ABCDEF/x')).toBe(true);
  });

  test('figma: buildEmbedPreviewFromMessage returns iframe preview', async () => {
    const message = 'See this: https://www.figma.com/design/ABCDEF/FileName';
    const preview = await buildEmbedPreviewFromMessage(message);
    expect(preview.kind).toBe('iframe');
    if (preview.kind === 'iframe') {
      expect(preview.src).toContain('embed.figma.com');
    }
  });

  test('canva: uses oEmbed and returns html preview', async () => {
    const message = 'here https://www.canva.com/design/DAAAAA/view';

    const payload = {
      title: 'My Canva Design',
      html: '<iframe src="https://www.canva.com/design/DAAAAA/view?embed" />',
      thumbnail_url: 'https://cdn.canva.com/thumb.jpg',
    };

    const res = new Response(JSON.stringify(payload), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

    // ✅ match fetch signature: (input, init?) => Promise<Response>
    const fetchMock: jest.MockedFunction<typeof fetch> = jest.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) => res
    );

    global.fetch = fetchMock;

    const preview = await buildEmbedPreviewFromMessage(message);

    expect(preview.kind).toBe('html');
    if (preview.kind === 'html') {
      expect(preview.html).toContain('<iframe');
    }

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = String(fetchMock.mock.calls[0]?.[0]);
    expect(calledUrl).toMatch(
      /canva\.com\/_oembed|api\.canva\.com\/_spi\/presentation\/_oembed/
    );
  });
});
