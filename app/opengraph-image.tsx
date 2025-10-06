import { ImageResponse } from 'next/og'
 
export const size = {
  width: 1200,
  height: 630,
}
 
export const contentType = 'image/png'
 
export default async function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#000',
          backgroundImage: 'radial-gradient(circle at 25px 25px, #333 2%, transparent 0%), radial-gradient(circle at 75px 75px, #333 2%, transparent 0%)',
          backgroundSize: '100px 100px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 40,
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="160"
            height="160"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" />
            <path d="M8 7v7" />
            <path d="M12 7v4" />
            <path d="M16 7v9" />
          </svg>
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 80,
            fontWeight: 700,
            letterSpacing: '-0.025em',
            color: 'white',
            marginBottom: 20,
          }}
        >
          ThreeLanes
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 40,
            color: '#999',
          }}
        >
          Kanban without the clutter
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
