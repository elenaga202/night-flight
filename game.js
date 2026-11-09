(() => {
  "use strict";
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("overlay");
  const titleEl = document.getElementById("overlay-title");
  const copyEl = document.getElementById("overlay-copy");
  const startBtn = document.getElementById("start-button");
  const scoreEl = document.getElementById("score");
  const timeEl = document.getElementById("time");
  const bestEl = document.getElementById("best-score");
  const soundBtn = document.getElementById("sound-toggle");
  const toast = document.getElementById("toast");
  const W = canvas.width, H = canvas.height;
  const FLOOR = 475;
  let state = "ready", score = 0, timeLeft = 60, lives = 3, lastTime = 0;
  let owl, obstacles, fireflies, particles, stars, clouds, spawnTimer, flyTimer, invulnerable;
  let soundOn = true, audioCtx = null, best = Number(localStorage.getItem("nightFlightBest") || 0);
  bestEl.textContent = `RÉCORD: ${String(best).padStart(3,"0")}`;

  const rand = (a,b) => Math.random() * (b-a) + a;
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  function audio() {
    if (!soundOn) return null;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") audioCtx.resume();
      return audioCtx;
    } catch (_) { return null; }
  }
  function tone(freq=440, duration=.09, type="sine", volume=.035) {
    const ac = audio(); if (!ac) return;
    const osc = ac.createOscillator(), gain = ac.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, ac.currentTime);
    gain.gain.setValueAtTime(volume, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, ac.currentTime + duration);
    osc.connect(gain); gain.connect(ac.destination); osc.start(); osc.stop(ac.currentTime + duration);
  }
  function reset() {
    score=0; timeLeft=60; lives=3; spawnTimer=.8; flyTimer=0; invulnerable=0;
    owl={x:190,y:250,vy:0,tilt:0,flap:0};
    obstacles=[]; fireflies=[]; particles=[];
    stars=Array.from({length:95},()=>({x:rand(0,W),y:rand(0,390),r:rand(.7,2),a:rand(.25,.9),phase:rand(0,6)}));
    clouds=Array.from({length:6},(_,i)=>({x:i*190+rand(0,100),y:rand(65,300),s:rand(.55,1.25)}));
    updateHud();
  }
  function updateHud() {
    scoreEl.textContent=String(score).padStart(3,"0");
    timeEl.textContent=String(Math.max(0,Math.ceil(timeLeft))).padStart(2,"0");
    for(let i=1;i<=3;i++) document.getElementById(`life-${i}`).classList.toggle("lost",i>lives);
  }
  function startGame() {
    reset(); state="playing"; overlay.classList.add("hidden"); lastTime=performance.now(); audio();
    flap(); requestAnimationFrame(loop);
  }
  function endGame(won) {
    state=won?"won":"over";
    if(score>best){best=score;localStorage.setItem("nightFlightBest",String(best));bestEl.textContent=`RÉCORD: ${String(best).padStart(3,"0")}`;}
    titleEl.textContent=won?"¡Vuelo conseguido!":"Fin del vuelo";
    copyEl.textContent=won?`¡Has cruzado la noche! Has conseguido ${score} puntos.`:`Has conseguido ${score} puntos. ¡El bosque te espera para otro intento!`;
    startBtn.innerHTML='VOLVER A JUGAR <span>→</span>';
    overlay.classList.remove("hidden");
    tone(won?660:180,.28,"triangle",.05);
  }
  function flap() {
    if(state!=="playing") return;
    owl.vy=-390; owl.flap=1; tone(520,.055,"triangle",.025);
    for(let i=0;i<4;i++) particles.push({x:owl.x-17,y:owl.y+9,vx:rand(-100,-25),vy:rand(-35,45),life:.35,max:.35,size:rand(2,4),kind:"feather"});
  }
  function showToast(text) {
    toast.textContent=text; toast.classList.add("show");
    clearTimeout(showToast.timer); showToast.timer=setTimeout(()=>toast.classList.remove("show"),650);
  }
  function hitObstacle() {
    if(invulnerable>0) return;
    lives--; invulnerable=1.35; owl.vy=-180; tone(135,.18,"sawtooth",.045);
    for(let i=0;i<14;i++) particles.push({x:owl.x,y:owl.y,vx:rand(-150,150),vy:rand(-130,130),life:.55,max:.55,size:rand(2,5),kind:"spark"});
    updateHud();
    if(lives<=0) endGame(false);
  }
  function addObstacle() {
    const gap=rand(165,205), center=rand(170,365), x=W+40;
    obstacles.push({x,top:center-gap/2,bottom:center+gap/2,w:74,passed:false,phase:rand(0,6)});
    if(Math.random()<.92) fireflies.push({x:x+rand(100,190),y:center+rand(-gap*.24,gap*.24),phase:rand(0,6),taken:false});
  }
  function update(dt) {
    if(state!=="playing") return;
    timeLeft-=dt; if(timeLeft<=0){timeLeft=0;updateHud();endGame(true);return;}
    flyTimer+=dt; owl.flap=Math.max(0,owl.flap-dt*3.5); invulnerable=Math.max(0,invulnerable-dt);
    owl.vy+=850*dt; owl.y+=owl.vy*dt; owl.tilt=clamp(owl.vy/600,-.55,.7);
    if(owl.y<32){owl.y=32;owl.vy=Math.max(0,owl.vy);}
    if(owl.y>FLOOR-18){owl.y=FLOOR-18;owl.vy=0;hitObstacle();}
    spawnTimer-=dt; if(spawnTimer<=0){addObstacle();spawnTimer=rand(1.45,1.9);}
    for(const o of obstacles){
      o.x-=250*dt;
      const bx=owl.x+20, by=owl.y;
      if(bx>o.x-26&&bx<o.x+o.w+15&&(by-18<o.top||by+18>o.bottom)) hitObstacle();
      if(!o.passed&&o.x+o.w<owl.x){o.passed=true;score+=5;updateHud();}
    }
    obstacles=obstacles.filter(o=>o.x>-100);
    for(const f of fireflies){
      f.x-=250*dt; f.phase+=dt*4;
      if(!f.taken&&Math.hypot(f.x-owl.x,f.y+Math.sin(f.phase)*7-owl.y)<32){
        f.taken=true;score+=10;updateHud();showToast("+10 ✦");tone(880,.1,"sine",.04);
        for(let i=0;i<9;i++)particles.push({x:f.x,y:f.y,vx:rand(-90,90),vy:rand(-90,90),life:.45,max:.45,size:rand(2,4),kind:"gold"});
      }
    }
    fireflies=fireflies.filter(f=>f.x>-30&&!f.taken);
    for(const c of clouds){c.x-=22*c.s*dt;if(c.x<-120){c.x=W+rand(20,100);c.y=rand(60,320);}}
    for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;p.vy+=100*dt;}
    particles=particles.filter(p=>p.life>0);
    updateHud();
  }
  function roundRect(x,y,w,h,r,color) {
    ctx.fillStyle=color;ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fill();
  }
  function drawBackground(t) {
    const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,"#111a3d");g.addColorStop(.62,"#263c68");g.addColorStop(1,"#52617a");
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    // moon halo
    ctx.save();ctx.shadowColor="#ffe7ad";ctx.shadowBlur=35;ctx.fillStyle="#f9e8bc";ctx.beginPath();ctx.arc(760,115,47,0,Math.PI*2);ctx.fill();ctx.restore();
    ctx.fillStyle="#e6d9b8";ctx.beginPath();ctx.arc(778,101,43,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="rgba(255,255,255,.12)";ctx.beginPath();ctx.arc(755,88,8,0,Math.PI*2);ctx.fill();
    for(const s of stars){ctx.globalAlpha=s.a*(.72+.28*Math.sin(t*.0015+s.phase));ctx.fillStyle="#fff7d7";ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();}
    ctx.globalAlpha=1;
    for(const c of clouds) drawCloud(c.x,c.y,c.s);
    // distant hills
    ctx.fillStyle="#1d3153";ctx.beginPath();ctx.moveTo(0,410);for(let x=0;x<=W;x+=80)ctx.lineTo(x,385+Math.sin(x*.012)*22+Math.sin(x*.027)*12);ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.fill();
    ctx.fillStyle="#142846";ctx.beginPath();ctx.moveTo(0,445);for(let x=0;x<=W;x+=65)ctx.lineTo(x,425+Math.sin(x*.018+1)*20);ctx.lineTo(W,H);ctx.lineTo(0,H);ctx.fill();
    // ground
    ctx.fillStyle="#101f39";ctx.fillRect(0,FLOOR,W,H-FLOOR);
    ctx.fillStyle="#263e4d";ctx.fillRect(0,FLOOR,W,5);
    for(let x=0;x<W;x+=28){ctx.fillStyle="#37534f";ctx.fillRect((x-(t*.035)%28),FLOOR+8,12,2);}
  }
  function drawCloud(x,y,s) {
    ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle="rgba(164,184,215,.12)";
    ctx.beginPath();ctx.arc(0,8,20,0,Math.PI*2);ctx.arc(23,0,27,0,Math.PI*2);ctx.arc(49,10,18,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  function drawBranch(o) {
    // top hanging branch and lower rising branch
    ctx.save();
    const bark="#4a382f", edge="#76503a", leaf="#315448";
    roundRect(o.x,o.top-260,o.w,260,12,bark);roundRect(o.x+7,o.top-250,o.w-14,250,8,edge);
    roundRect(o.x-14,o.top-27,102,24,12,bark);
    ctx.fillStyle=leaf;ctx.beginPath();ctx.ellipse(o.x+20,o.top-42,23,9,-.45,0,Math.PI*2);ctx.fill();
    roundRect(o.x,o.bottom,o.w,260,12,bark);roundRect(o.x+7,o.bottom,o.w-14,250,8,edge);
    roundRect(o.x-28,o.bottom+20,100,20,10,bark);
    ctx.fillStyle=leaf;ctx.beginPath();ctx.ellipse(o.x+57,o.bottom+28,20,8,.5,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
  function drawOwl(t) {
    ctx.save();ctx.translate(owl.x,owl.y);ctx.rotate(owl.tilt);
    if(invulnerable>0&&Math.floor(t/90)%2===0)ctx.globalAlpha=.45;
    // wings
    ctx.fillStyle="#a96e48";ctx.save();ctx.rotate(-owl.flap*.7);ctx.beginPath();ctx.ellipse(-4,8,22,9,-.4,0,Math.PI*2);ctx.fill();ctx.restore();
    // body and ears
    ctx.fillStyle="#b87950";ctx.beginPath();ctx.ellipse(0,0,25,29,0,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.moveTo(-20,-17);ctx.lineTo(-24,-39);ctx.lineTo(-4,-24);ctx.fill();
    ctx.beginPath();ctx.moveTo(20,-17);ctx.lineTo(24,-39);ctx.lineTo(4,-24);ctx.fill();
    // belly
    ctx.fillStyle="#f1d5a0";ctx.beginPath();ctx.ellipse(0,12,16,18,0,0,Math.PI*2);ctx.fill();
    // eyes
    for(const ex of [-10,10]){ctx.fillStyle="#f8edcf";ctx.beginPath();ctx.arc(ex,-7,9,0,Math.PI*2);ctx.fill();ctx.fillStyle="#202844";ctx.beginPath();ctx.arc(ex+1,-7,4.2,0,Math.PI*2);ctx.fill();ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(ex+2,-9,1.5,0,Math.PI*2);ctx.fill();}
    // beak and feet
    ctx.fillStyle="#f5b95f";ctx.beginPath();ctx.moveTo(-4,2);ctx.lineTo(4,2);ctx.lineTo(0,9);ctx.fill();
    ctx.strokeStyle="#e9a64f";ctx.lineWidth=3;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(-8,26);ctx.lineTo(-11,31);ctx.moveTo(8,26);ctx.lineTo(11,31);ctx.stroke();
    ctx.restore();
  }
  function drawFirefly(f,t) {
    const y=f.y+Math.sin(f.phase)*7;
    ctx.save();ctx.shadowColor="#ffe88a";ctx.shadowBlur=22;ctx.fillStyle="#fff0a0";ctx.beginPath();ctx.arc(f.x,y,5,0,Math.PI*2);ctx.fill();
    ctx.restore();ctx.fillStyle="#ffeaa0";ctx.globalAlpha=.45;ctx.beginPath();ctx.arc(f.x,y,11+Math.sin(t*.01+f.phase)*3,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
  }
  function render(t) {
    drawBackground(t);
    for(const o of obstacles)drawBranch(o);
    for(const f of fireflies)drawFirefly(f,t);
    for(const p of particles){
      ctx.globalAlpha=clamp(p.life/p.max,0,1);ctx.fillStyle=p.kind==="gold"?"#ffe88a":p.kind==="spark"?"#ffbd83":"#d8e2f2";
      ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=1;
    if(owl)drawOwl(t);
    // subtle vignette
    const v=ctx.createRadialGradient(W/2,H/2,150,W/2,H/2,600);v.addColorStop(0,"rgba(0,0,0,0)");v.addColorStop(1,"rgba(5,10,27,.3)");ctx.fillStyle=v;ctx.fillRect(0,0,W,H);
  }
  function loop(now) {
    if(state!=="playing")return;
    const dt=Math.min((now-lastTime)/1000,.035);lastTime=now;
    update(dt);render(now);
    if(state==="playing")requestAnimationFrame(loop);
  }
  function action() { if(state==="playing")flap(); }
  canvas.addEventListener("pointerdown",e=>{e.preventDefault();action();});
  window.addEventListener("keydown",e=>{
    if(["Space","ArrowUp","KeyW"].includes(e.code)){e.preventDefault();if(state==="playing")action();else if(state==="ready"||state==="over"||state==="won")startGame();}
  });
  startBtn.addEventListener("click",startGame);
  soundBtn.addEventListener("click",()=>{
    soundOn=!soundOn;soundBtn.setAttribute("aria-pressed",String(soundOn));soundBtn.textContent=soundOn?"♫":"♪";
    if(soundOn)tone(600,.08);
  });
  // Initial attract screen scene
  reset();render(0);
  // gentle idle animation behind title
  function idle(now){if(state!=="playing"){if(owl){owl.y=250+Math.sin(now*.002)*9;owl.flap=.15+.12*Math.sin(now*.006);}render(now);}requestAnimationFrame(idle);}
  requestAnimationFrame(idle);
})();
