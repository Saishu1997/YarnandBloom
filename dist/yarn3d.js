// One WebGL canvas draws the yarn ball (procedural strands in the fragment shader: no textures,
// no libraries). The inline SVG stays as first paint and as the fallback if WebGL is unavailable.
(()=>{
const scene=document.getElementById('yarn-scene'),svg=scene&&scene.querySelector('.yarn-illustration');
if(!scene||!svg)return;
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
function boot(){
  const cv=document.createElement('canvas');
  const gl=cv.getContext('webgl',{alpha:true,antialias:false,depth:false,stencil:false,powerPreference:'low-power'});
  if(!gl)return;
  const sh=(t,s)=>{const o=gl.createShader(t);gl.shaderSource(o,s);gl.compileShader(o);return gl.getShaderParameter(o,gl.COMPILE_STATUS)?o:null};
  const vs=sh(gl.VERTEX_SHADER,'attribute vec2 a;varying vec2 v;void main(){v=a;gl_Position=vec4(a,0.,1.);}');
  const fs=sh(gl.FRAGMENT_SHADER,`
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 v;uniform mat3 uM;uniform vec3 cL,cM,cD,cT;uniform float uPx,uK;
float strand(float d,float f,float aa){float t=abs(fract(d*f)-.5);return 1.-smoothstep(.17,.17+aa,t);}
void main(){
  vec2 p=v*uK;float r2=dot(p,p),r=sqrt(r2),a=clamp((1.-r)*uPx,0.,1.);
  if(a<=0.){gl_FragColor=vec4(0.);return;}
  vec3 n=vec3(p,sqrt(max(0.,1.-r2)));vec3 o=uM*n;
  vec3 L=normalize(vec3(-.45,.55,.7));
  float df=dot(n,L)*.5+.5;
  vec3 col=mix(cD,cM,smoothstep(0.,.55,df));col=mix(col,cL,smoothstep(.5,1.,df)*.9);
  float aa=1.4/uPx/max(n.z,.3);
  float d1=dot(o,vec3(.30,.90,.30))+.012*sin(dot(o,vec3(.9,-.2,.4))*7.);
  float d2=dot(o,vec3(.90,-.20,.40))+.012*sin(dot(o,vec3(-.4,.3,.85))*6.);
  float d3=dot(o,vec3(-.40,.30,.85))+.012*sin(dot(o,vec3(.3,.9,.3))*8.);
  float s1=strand(d1,6.,aa*6.),s2=strand(d2,5.,aa*5.),s3=strand(d3,7.,aa*7.);
  float s=max(s1,max(s2,s3));
  float ridge=sin(fract(d1*6.+.5)*3.14159)*s1+sin(fract(d2*5.+.5)*3.14159)*s2+sin(fract(d3*7.+.5)*3.14159)*s3;
  col=mix(col,cT*(.78+.3*df),s*.75);col*=.86+.14*clamp(ridge,0.,1.);
  float sp=pow(max(dot(reflect(-L,n),vec3(0.,0.,1.)),0.),22.);
  col+=sp*.22;col*=mix(.8,1.,n.z);
  gl_FragColor=vec4(col*a,a);
}`);
  if(!vs||!fs)return;
  const pr=gl.createProgram();gl.attachShader(pr,vs);gl.attachShader(pr,fs);gl.linkProgram(pr);
  if(!gl.getProgramParameter(pr,gl.LINK_STATUS))return;
  gl.useProgram(pr);
  const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  const al=gl.getAttribLocation(pr,'a');gl.enableVertexAttribArray(al);gl.vertexAttribPointer(al,2,gl.FLOAT,false,0,0);
  const U=n=>gl.getUniformLocation(pr,n);
  const uM=U('uM'),uPx=U('uPx'),uK=U('uK'),cols=['cL','cM','cD','cT'].map(U);
  // SVG ball: centre (185,174) r112 in a 460x380 viewBox; canvas covers r116 around it.
  const CX=185,CY=174,R=112,H=116;
  cv.className='yarn-gl';cv.setAttribute('role','img');
  cv.setAttribute('aria-label','Ball of yarn in 3D. Drag to spin it.');
  cv.style.cssText='position:absolute;pointer-events:auto;touch-action:pan-y;cursor:grab';
  let yaw=-.45,pitch=-.33,vel=0,drag=null,visible=true,raf=0,last=0,dirty=true,pxSize=0;
  function layout(){
    const w=scene.clientWidth,h=scene.clientHeight;if(!w||!h)return;
    const s=Math.min(w/460,h/380),ox=(w-460*s)/2,oy=(h-380*s)/2,size=2*H*s;
    cv.style.left=(ox+(CX-H)*s)+'px';cv.style.top=(oy+(CY-H)*s)+'px';cv.style.width=cv.style.height=size+'px';
    const px=Math.max(1,Math.round(size*Math.min(devicePixelRatio||1,2)));
    if(px!==pxSize){pxSize=px;cv.width=cv.height=px;gl.viewport(0,0,px,px)}
    gl.uniform1f(uPx,px/2*R/H);gl.uniform1f(uK,H/R);dirty=true;
  }
  function colours(){
    const cs=getComputedStyle(document.documentElement);
    ['--yarn-light','--yarn-mid','--yarn-dark','--yarn-thread'].forEach((k,i)=>{
      const h=cs.getPropertyValue(k).trim().replace('#','');if(h.length!==6)return;
      gl.uniform3f(cols[i],parseInt(h.slice(0,2),16)/255,parseInt(h.slice(2,4),16)/255,parseInt(h.slice(4,6),16)/255)});
    dirty=true;
  }
  function draw(){
    const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);
    // o = Ry^T * Rx^T * n, uploaded column-major
    const m=[cy,0,sy, sy*sp,cp,-cy*sp, -sy*cp,sp,cy*cp];
    gl.uniformMatrix3fv(uM,false,m);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);dirty=false;
  }
  function frame(t){
    raf=0;const dt=Math.min(.05,(t-last)/1000||0);last=t;
    if(!drag){
      if(!reduce.matches){yaw+=(vel+.18)*dt;vel*=Math.pow(.04,dt);dirty=true}
      else vel=0;
    }
    if(dirty)draw();
    if(visible&&!document.hidden&&((!reduce.matches)||drag||dirty))schedule();
  }
  function schedule(){if(!raf){last=performance.now();raf=requestAnimationFrame(frame)}}
  cv.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;
    drag={id:e.pointerId,x:e.clientX,y:e.clientY};vel=0;cv.setPointerCapture(e.pointerId);cv.style.cursor='grabbing'});
  cv.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;
    const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.x=e.clientX;drag.y=e.clientY;
    yaw+=dx*.011;pitch=Math.max(-1.2,Math.min(1.2,pitch+dy*.008));vel=dx*.011*40;dirty=true;schedule()});
  const end=e=>{if(drag&&drag.id===e.pointerId){drag=null;cv.style.cursor='grab';schedule()}};
  cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);
  cv.addEventListener('webglcontextlost',e=>{e.preventDefault();scene.classList.remove('gl');svg.removeAttribute('aria-hidden');cv.remove();cancelAnimationFrame(raf);raf=0});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});
  document.querySelectorAll('[data-yarn]').forEach(b=>b.addEventListener('click',()=>{colours();schedule()}));
  new IntersectionObserver(es=>{visible=es.some(x=>x.isIntersecting);if(visible)schedule()}).observe(scene);
  new ResizeObserver(()=>{layout();schedule()}).observe(scene);
  reduce.addEventListener&&reduce.addEventListener('change',()=>{dirty=true;schedule()});
  scene.append(cv);colours();layout();draw();
  svg.setAttribute('aria-hidden','true');scene.classList.add('gl');schedule();
}
function start(){try{boot()}catch(e){}}
const go=()=>('requestIdleCallback' in window)?requestIdleCallback(start,{timeout:1500}):setTimeout(start,200);
document.readyState==='complete'?go():addEventListener('load',go,{once:true});
})();
