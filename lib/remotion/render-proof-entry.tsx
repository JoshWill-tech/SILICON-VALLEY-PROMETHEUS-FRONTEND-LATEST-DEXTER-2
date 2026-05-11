import { registerRoot, Composition } from 'remotion'
import { RenderProofComposition } from './render-proof-composition'

registerRoot(() => {
  return (
    <>
      <Composition
        id="render-proof"
        component={RenderProofComposition as any}
        durationInFrames={300} // 10 seconds default
        fps={30}
        width={1280}
        height={720}
        defaultProps={{
          sourceUrl: '',
          projectTitle: 'Prometheus Proof',
        }}
      />
    </>
  )
})
