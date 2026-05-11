import { AbsoluteFill, Html5Video, useCurrentFrame, useVideoConfig } from 'remotion'

export interface RenderProofCompositionProps {
  sourceUrl: string
  projectTitle: string
}

export const RenderProofComposition: React.FC<RenderProofCompositionProps> = ({
  sourceUrl,
  projectTitle,
}) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const opacity = Math.min(1, frame / (fps * 2)) // Simple fade in over 2 seconds

  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      <Html5Video
        src={sourceUrl}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: 50,
          left: 50,
          right: 50,
          padding: '24px 32px',
          background: 'rgba(0, 0, 0, 0.72)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          color: 'white',
          fontSize: '42px',
          fontWeight: 700,
          fontFamily: 'sans-serif',
          opacity,
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div style={{
          width: '12px',
          height: '42px',
          background: '#8b5cf6',
          borderRadius: '6px'
        }} />
        <span style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
          {projectTitle || 'Untitled Project'}
        </span>
      </div>
      
      {/* Proof Label */}
      <div style={{
        position: 'absolute',
        top: 30,
        right: 30,
        background: 'rgba(139, 92, 246, 0.9)',
        color: 'white',
        padding: '6px 12px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.1em'
      }}>
        Prometheus Render Proof
      </div>
    </AbsoluteFill>
  )
}
