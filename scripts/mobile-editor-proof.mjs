import { build } from 'esbuild'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

// Actual mobile route component, player, Motion canvas, delivery studio, and review
// controls. Chat/music services and the timeline/history backend are isolated.
const dir = resolve('.tmp/mobile-editor-proof')
mkdirSync(dir, {recursive:true})
const editor = readFileSync('app/editor/[id]/page.tsx', 'utf8')
const mobile = editor.slice(editor.indexOf('function MobileEditorView('), editor.indexOf('\nfunction OriginalEditorPage()'))
await build({
  stdin: { contents: `
    import React from 'react';
    import {createRoot} from 'react-dom/client';
    import {ArrowLeft,CheckCircle2,Upload,AlertCircle,Loader2} from 'lucide-react';
    import {cn} from './lib/utils';
    import {MobileVideoPlayer} from './app/editor/components/mobile-video-player';
    import {MotionPropertyCanvas} from './components/editor/motion-property-canvas';
    import {EditorialDeliveryStudio} from './components/editor/editorial-delivery-studio';
    import mobileWorkspaceStyles from './components/editor/mobile-editor-workspace.module.css';
    const ContinueBanner=()=>null;
    const InlineLoadingAnimation=()=>null;
    const getActiveJobStep=()=>null;
    const MusicTabPanel=()=> <div style={{padding:24}}>Music service isolated for this layout proof.</div>;
    const ChatWorkspacePanel=()=> <div style={{padding:20,height:'100%',display:'flex',flexDirection:'column',gap:16}}><h2 style={{fontSize:24}}>Editorial</h2><p>Chat services are isolated in this verification fixture.</p><textarea aria-label="Editorial instruction" placeholder="Describe your edit" style={{marginTop:'auto',padding:16,border:'1px solid #555',borderRadius:12,background:'#111',color:'white',fontSize:16}}/></div>;
    ${mobile}
    const noop=()=>{};
    const delivery={projectId:'mobile-editor-proof',sourceAssetId:'proof-source',sourceUrl:'/sample.mp4',projectTitle:'Mobile editorial review',currentTimeSec:0,durationSec:30};
    function Fixture(){
      const [playing,setPlaying]=React.useState(false);
      const [time,setTime]=React.useState(0);
      const videoRef=React.useRef(null);
      const mode=location.pathname;
      if(mode==='/studio')return <EditorialDeliveryStudio {...delivery}/>;
      if(mode==='/comparison')return <main style={{padding:24}}><h1>Comparison review</h1><EditorialDeliveryStudio {...delivery} presentation="preview"/></main>;
      return <MobileEditorView project={{title:delivery.projectTitle,sourceAssetId:delivery.sourceAssetId}} projectId={delivery.projectId} projectTitle={delivery.projectTitle}
        sourceUploadStatus="ready" workspaceTab="Editor" deliveryOpenToken={0} previewKind="video" previewUrl="/sample.mp4" hasPreviewMedia={true} sourceLabel="Original footage"
        statusLabel="Ready" saveStatus="saved" job={null} progressPercent={0} sourceMetrics={null} objectFit="contain"
        currentTimeLabel="00:00" durationLabel="00:30" currentTimeSec={time} durationSec={30} previewPlaying={playing} previewMuted={false}
        motionVideoRef={videoRef} musicTracks={[]} initialPrompt="" initialSources={[]} videoContext={{}} onBack={noop} onOpenUploadNewProject={noop}
        onTogglePlayback={()=>{if(videoRef.current){if(playing)videoRef.current.pause();else void videoRef.current.play();}setPlaying(!playing)}}
        onSeekPreview={value=>{if(videoRef.current)videoRef.current.currentTime=value;setTime(value)}} onVideoLoadedMetadata={noop}
        onVideoLoadedData={noop} onVideoCanPlay={noop} onVideoTimeUpdate={event=>setTime(event.currentTarget.currentTime)} onVideoEnded={()=>setPlaying(false)}
        onVideoPlay={()=>setPlaying(true)} onVideoPause={()=>setPlaying(false)} onVideoError={noop} onImageLoaded={noop} onApplyMotionPrompt={noop}/>
    }
    createRoot(document.getElementById('root')).render(<Fixture/>);
  `, resolveDir: process.cwd(), loader:'tsx' },
  outfile:resolve(dir,'bundle.js'), bundle:true, platform:'browser', format:'iife', jsx:'automatic',
  tsconfig:resolve('tsconfig.json'), define:{'process.env.NODE_ENV':'"production"'},
  plugins:[{name:'isolate-editorial-service',setup(bundler){
    bundler.onResolve({filter:/^@\/hooks\/use-editorial-timeline$/}, args=>({path:args.path,namespace:'mobile-fixture'}))
    bundler.onLoad({filter:/.*/,namespace:'mobile-fixture'},()=>({contents:'export const useEditorialTimeline=()=>({timeline:null,status:"idle"});',loader:'js'}))
  }}],
})
const cssPath=value=>resolve(value).replaceAll('\\','/')
const sources=['app/editor/[id]/page.tsx','app/editor/components/mobile-video-player.tsx','components/editor/motion-property-canvas.tsx','components/editor/editorial-delivery-studio.tsx','components/editor/video-review-annotations.tsx']
writeFileSync(resolve(dir,'input.css'),`@import '${cssPath('node_modules/tailwindcss/index.css')}' source(none);\n${sources.map(file=>`@source '${cssPath(file)}';`).join('\n')}`)
const css=spawnSync(process.execPath,[resolve('node_modules/@tailwindcss/cli/dist/index.mjs'),'-i',resolve(dir,'input.css'),'-o',resolve(dir,'style.css')],{encoding:'utf8',timeout:120000})
if(css.status!==0)throw new Error(css.stderr||'Fixture CSS failed')
if(process.argv.includes('--build-only')){console.log('Mobile editor fixture built');process.exit(0)}
const media=readFileSync('public/library/scrollbar.mp4')
const server=createServer((request,response)=>{
  const path=request.url.split('?')[0]
  if(['/bundle.js','/bundle.css','/style.css'].includes(path)){
    response.setHeader('Content-Type',path.endsWith('.js')?'text/javascript':'text/css')
    response.end(readFileSync(resolve(dir,path.slice(1))));return
  }
  if(path==='/sample.mp4'||path==='/api/exports/mobile-proof-render/preview'){
    response.setHeader('Content-Type','video/mp4');response.setHeader('Accept-Ranges','bytes')
    const range=request.headers.range?.match(/^bytes=(\d+)-(\d*)$/)
    if(range){const start=Number(range[1]),end=range[2]?Number(range[2]):media.length-1;response.writeHead(206,{'Content-Range':`bytes ${start}-${end}/${media.length}`,'Content-Length':end-start+1});response.end(media.subarray(start,end+1))}
    else{response.setHeader('Content-Length',media.length);response.end(media)}return
  }
  if(path.includes('/exports/history')){
    response.setHeader('Content-Type','application/json')
    response.end(JSON.stringify({exports:[{id:'mobile-proof-render',projectId:'mobile-editor-proof',status:'completed',storagePath:'sample.mp4',mimeType:'video/mp4',createdAt:'2026-10-17T00:00:00Z',metadata:{sourceAssetId:'proof-source'}}]}));return
  }
  response.setHeader('Content-Type','text/html')
  response.end('<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/bundle.css"><title>Mobile editor verification</title></head><body style="margin:0;background:#070709;color:white;font-family:Arial"><div id="root"></div><script src="/bundle.js"></script></body></html>')
})
server.listen(4183,'127.0.0.1',()=>console.log('Mobile editor proof ready at http://127.0.0.1:4183'))
