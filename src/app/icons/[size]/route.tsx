import { ImageResponse } from 'next/og';

// Generates the app icon as a PNG at /icons/180, /icons/192, /icons/512.
// No image files needed in /public.
export const runtime = 'edge';

const ALLOWED = new Set([180, 192, 512]);

export function GET(_req: Request, { params }: { params: { size: string } }) {
  const size = ALLOWED.has(Number(params.size)) ? Number(params.size) : 192;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#059669',
          color: 'white',
          fontSize: size * 0.42,
          fontWeight: 800,
          letterSpacing: -size * 0.01,
        }}
      >
        Rs
      </div>
    ),
    {
      width: size,
      height: size,
      headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
    },
  );
}
