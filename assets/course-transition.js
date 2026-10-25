/* Classroom photo: the lit room opens from the centre of the held course grid (index.html cgLift drives
   window.cgReveal.draw(progress)). A noisy edge spreads outward; inside it the photo, outside it transparent so the cards
   still show, and the edge glows with the photo's outlines and a few sparks. Without WebGL (or with reduced motion) the photo
   fades in instead. */
(() => {
  const pin = document.querySelector('#cgPhoto .cg-pin'), img = pin && pin.querySelector('img');
  if (!img || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  let gl, ready = false, last = -1, w = 0, h = 0, uScreen, uProgress;
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
      vec2 tex=uv*crop+(1.-crop)*vec2(.5,.6); // object-fit: cover; object-position: center 60%
      vec3 lit=samplePhoto(tex);
      float radius=mix(-.14,length(vec2(aspect,1.))*.5+.18,smoothstep(.12,.95,progress));
      float field=length(p)+.11*(fbm(uv*7.)-.5);
      float delta=field-radius;
      float inside=1.-smoothstep(-.018,.018,delta);
      float band=exp(-abs(delta)*46.);
      vec2 pixel=1./imageSize;
      float edge=length(samplePhoto(tex+vec2(pixel.x*2.,0.))-samplePhoto(tex-vec2(pixel.x*2.,0.)))
                +length(samplePhoto(tex+vec2(0.,pixel.y*2.))-samplePhoto(tex-vec2(0.,pixel.y*2.)));
      vec2 drift=normalize(p+vec2(.0001))*progress*12.;
      vec2 grid=uv*vec2(210.*aspect,210.)-drift;
      float seed=hash(floor(grid));
      float dotShape=1.-smoothstep(.035,.18,length(fract(grid)-.5));
      float spark=dotShape*step(.84,seed)*exp(-abs(delta-.045)*24.);
      float burst=exp(-length(p)*45.)*sin(3.14159*smoothstep(.0,.3,progress));
      float glow=smoothstep(0.,.03,progress)*(1.-smoothstep(.85,1.,progress));
      vec3 silver=vec3(1.,.975,.91);
      // premultiplied: the photo inside, light (the outlined band, sparks and the first burst) over the cards outside
      vec3 color=lit*inside;
      color=mix(color,lit*.4+silver*min(2.,edge*4.+.2),band*.8*glow);
      color+=silver*(band*.5+spark*2.+burst*2.)*glow;
      color=min(color,1.);
      gl_FragColor=vec4(color,max(inside,max(color.r,max(color.g,color.b))));
    }`;
  function init() {
    try {
      gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false });
      if (!gl) return;
      const shader = (type, source) => {
        const s = gl.createShader(type); gl.shaderSource(s, source); gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
        return s;
      };
      const program = gl.createProgram();
      gl.attachShader(program, shader(gl.VERTEX_SHADER, vertex));
      gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragment));
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
      const a = gl.getAttribLocation(program, 'a'); gl.enableVertexAttribArray(a); gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);
      gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,img);
      gl.uniform1i(gl.getUniformLocation(program,'photo'),0);
      gl.uniform2f(gl.getUniformLocation(program,'imageSize'),img.naturalWidth,img.naturalHeight);
      uScreen = gl.getUniformLocation(program,'screen'); uProgress = gl.getUniformLocation(program,'progress');
      ready = true; canvas.hidden = false;
    } catch (error) {
      ready = false; canvas.hidden = true;
      console.warn('Classroom light-up falls back to the veil.', error);
    }
  }
  function draw(progress) {
    if (!ready) return;
    const r = pin.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    const dpr = Math.min(devicePixelRatio || 1, innerWidth <= 760 ? 1 : 1.5);
    const cw = Math.round(pin.clientWidth*dpr), ch = Math.round(pin.clientHeight*dpr);
    if (progress === last && cw === w && ch === h) return;
    last = progress;
    if (cw !== w || ch !== h) { w = canvas.width = cw; h = canvas.height = ch; gl.viewport(0,0,w,h); }
    gl.uniform2f(uScreen,pin.clientWidth,pin.clientHeight);
    gl.uniform1f(uProgress,progress);
    gl.drawArrays(gl.TRIANGLES,0,6);
  }
  canvas.hidden = true;
  img.after(canvas); // under the veil
  window.cgReveal = { canvas, draw, get ready() { return ready; } };
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); ready = false; canvas.hidden = true; window.cgLiftKick(); });
  canvas.addEventListener('webglcontextrestored', () => { init(); last = -1; window.cgLiftKick(); });
  img.decode().catch(() => {}).then(() => { if (img.naturalWidth) { init(); last = -1; window.cgLiftKick(); } });
})();
