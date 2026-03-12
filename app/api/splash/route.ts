import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const width = parseInt(searchParams.get('w') || '1170');
  const height = parseInt(searchParams.get('h') || '2532');

  const iconUrl = `${origin}/icon-512.png`;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffffff',
          gap: '32px',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={iconUrl}
          width={160}
          height={160}
          alt="Manabi"
          style={{ borderRadius: '50%' }}
        />
        <div
          style={{
            fontSize: 48,
            fontWeight: 600,
            color: '#000000',
            letterSpacing: '-0.025em',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
        >
          Manabi Learning
        </div>
      </div>
    ),
    { width, height }
  );
}
