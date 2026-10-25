/* Scroll-driven photo dissolve into the real Structure section. */
(() => {
  const run = document.getElementById('csRun');
  const section = document.getElementById('structure');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const overlay = document.createElement('div');
  overlay.className = 'cs-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  const photo = new Image();
  photo.src = 'assets/classroom-courses.webp';
  photo.alt = '';
  const canvas = document.createElement('canvas');
  overlay.append(photo, canvas);
  section.prepend(overlay);
  let gl, program, texture, ready = false, frame = 0, last = -1, width = 0, height = 0;
  const clamp = x => Math.max(0, Math.min(1, x));
  const distance = () => Math.max(1, run.offsetHeight - section.offsetHeight);
  const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
  const vertex = `attribute vec2 a; varying vec2 v;
    void main(){v=a*.5+.5;gl_Position=vec4(a,0.,1.);}`;
  const fragment = `precision mediump float;
    varying vec2 v; uniform sampler2D photo; uniform vec2 screen; uniform vec2 imageSize; uniform float progress;
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
      return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}
    float fbm(vec2 p){return .57*noise(p)+.28*noise(p*2.03)+.15*noise(p*4.11);}
    vec3 samplePhoto(vec2 uv){return texture2D(photo,uv).rgb;}
    void main(){
      float aspect=screen.x/screen.y;
      vec2 uv=vec2(v.x,1.-v.y), p=(uv-.5)*vec2(aspect,1.);
      float scale=max(screen.x/imageSize.x,screen.y/imageSize.y);
      vec2 crop=screen/(imageSize*scale);
      vec2 tex=uv*crop+(1.-crop)*vec2(.5,.6);
      tex=(tex-.5)/(1.+.04*smoothstep(0.,.7,progress))+.5;
      vec3 color=samplePhoto(tex);
      float radius=mix(-.14,length(vec2(aspect,1.))*.5+.18,smoothstep(.14,.93,progress));
      float field=length(p)+.11*(fbm(uv*7.)-.5);
      float delta=field-radius;
      float alpha=smoothstep(-.018,.018,delta);
      float band=exp(-abs(delta)*46.);
      vec2 pixel=1./imageSize;
      float edge=length(samplePhoto(tex+vec2(pixel.x*2.,0.))-samplePhoto(tex-vec2(pixel.x*2.,0.)))
                +length(samplePhoto(tex+vec2(0.,pixel.y*2.))-samplePhoto(tex-vec2(0.,pixel.y*2.)));
      vec2 drift=normalize(p+vec2(.0001))*progress*12.;
      vec2 grid=uv*vec2(210.*aspect,210.)-drift;
      float seed=hash(floor(grid));
      float dotShape=1.-smoothstep(.035,.18,length(fract(grid)-.5));
      float spark=dotShape*step(.84,seed)*exp(-abs(delta+.045)*24.);
      float burst=exp(-length(p)*45.)*sin(3.14159*smoothstep(.02,.38,progress));
      vec3 silver=vec3(1.,.975,.91);
      color=mix(color,color*.4+silver*min(2.,edge*4.+.2),band*.8);
      color+=silver*(band*.5+spark*2.+burst*2.);
      alpha=max(alpha,spark*.85+burst*.7);
      float finish=1.-smoothstep(.9,1.,progress);
      gl_FragColor=vec4(color,clamp(alpha*finish,0.,1.));
    }`;
  function init() {
    try {
      gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false, antialias: false, depth: false });
      if (!gl) return;
      const shader = (type, source) => {
        const s = gl.createShader(type); gl.shaderSource(s, source); gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
        return s;
      };
      program = gl.createProgram();
      gl.attachShader(program, shader(gl.VERTEX_SHADER, vertex));
      gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragment));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
      gl.useProgram(program);
      const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
      const a = gl.getAttribLocation(program, 'a'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
      texture = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,photo);
      gl.uniform1i(gl.getUniformLocation(program,'photo'),0);
      gl.uniform2f(gl.getUniformLocation(program,'imageSize'),photo.naturalWidth,photo.naturalHeight);
      ready = true; photo.hidden = true;
    } catch (error) {
      ready = false; canvas.hidden = true; photo.hidden = false;
      console.warn('Photo transition uses the image fallback.', error);
    }
  }
  function draw() {
    frame = 0;
    const r = run.getBoundingClientRect();
    const duration = distance();
    const progress = clamp(-r.top / duration);
    run.classList.toggle('cs-visible', r.top <= .5);
    run.classList.toggle('cs-complete', progress >= 1);
    run.dataset.progress = progress.toFixed(4);
    run.style.setProperty('--cs-copy', smooth(.57,.88,progress).toFixed(4));
    if (progress === last && width === innerWidth && height === innerHeight) return;
    last = progress; width = innerWidth; height = innerHeight;
    if (r.top > innerHeight || r.bottom < 0 || progress >= 1) return;
    if (!ready) { photo.style.opacity = 1 - smooth(.15,.95,progress); return; }
    const dpr = Math.min(devicePixelRatio || 1, innerWidth <= 760 ? 1 : 1.5);
    const w = Math.round(innerWidth*dpr), h = Math.round(overlay.clientHeight*dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width=w; canvas.height=h; gl.viewport(0,0,w,h); }
    gl.useProgram(program);
    gl.uniform2f(gl.getUniformLocation(program,'screen'),innerWidth,overlay.clientHeight);
    gl.uniform1f(gl.getUniformLocation(program,'progress'),progress);
    gl.drawArrays(gl.TRIANGLES,0,6);
  }
  function kick() { if (!frame) frame = requestAnimationFrame(draw); }
  const end = () => run.getBoundingClientRect().top + scrollY + distance();
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); ready=false; canvas.hidden=true; photo.hidden=false; last=-1; kick(); });
  canvas.addEventListener('webglcontextrestored', () => { canvas.hidden=false; init(); last=-1; kick(); });
  photo.decode().catch(() => {}).then(() => {
    if (!photo.naturalWidth) { overlay.remove(); return; }
    init(); run.style.setProperty('--cs-height', section.offsetHeight + 'px'); run.classList.add('cs-enabled'); kick();
    new ResizeObserver(() => { run.style.setProperty('--cs-height', section.offsetHeight + 'px'); last=-1; kick(); }).observe(section);
    if (location.hash === '#structure') requestAnimationFrame(() => { scrollTo({top:end(),behavior:'instant'}); kick(); });
  });
  document.querySelectorAll('a[href="#structure"]').forEach(a => a.addEventListener('click', e => {
    if (!run.classList.contains('cs-enabled')) return;
    e.preventDefault(); scrollTo({top:end(),behavior:'smooth'});
    history.replaceState(null,'','#structure');
  }));
  addEventListener('scroll',kick,{passive:true});
  addEventListener('resize',() => { last=-1; kick(); });
})();
