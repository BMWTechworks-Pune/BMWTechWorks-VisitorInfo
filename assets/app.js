
let DATA = null;
const FALLBACK = {"paths": {"EXIT1": {"color": "#22c55e", "width": 6, "points": [[220, 220], [220, 380], [360, 520], [640, 520], [900, 500], [1180, 420], [1560, 180]]}, "EXIT2": {"color": "#22c55e", "width": 6, "points": [[620, 260], [620, 420], [760, 560], [980, 560], [1200, 500], [1560, 180]]}, "EXIT3": {"color": "#22c55e", "width": 6, "points": [[980, 400], [980, 520], [1100, 640], [1300, 640], [1480, 600], [1560, 180]]}, "EXIT4": {"color": "#22c55e", "width": 6, "points": [[1340, 660], [1200, 640], [1040, 620], [860, 600], [700, 560], [520, 520], [360, 480], [220, 380], [220, 220]]}, "EXIT5": {"color": "#22c55e", "width": 8, "points": [[800, 140], [1000, 140], [1200, 160], [1400, 160], [1560, 180]]}}, "phrases": {"EN": {"EXIT1": "Exit 1: Walk straight, turn right at the corridor, then follow the green route to the main exit.", "EXIT2": "Exit 2: Proceed straight, keep left at the junction, and continue along the green route to the main exit.", "EXIT3": "Exit 3: Head towards the corridor, keep right, and follow the green markers to the exit door.", "EXIT4": "Exit 4: Return through the corridor, keep right, and continue to the main exit.", "EXIT5": "Main EXIT: Follow this highlighted path to reach the exit door safely."}, "DE": {"EXIT1": "Ausgang 1: Gehen Sie geradeaus, biegen Sie rechts im Flur ab und folgen Sie der gr\u00fcnen Route zum Haupteingang.", "EXIT2": "Ausgang 2: Gehen Sie geradeaus, halten Sie sich an der Kreuzung links und folgen Sie der gr\u00fcnen Route zum Haupteingang.", "EXIT3": "Ausgang 3: Gehen Sie zum Flur, halten Sie sich rechts und folgen Sie den gr\u00fcnen Markierungen zur T\u00fcr.", "EXIT4": "Ausgang 4: Gehen Sie durch den Flur zur\u00fcck, halten Sie sich rechts und weiter zum Haupteingang.", "EXIT5": "Hauptausgang: Folgen Sie diesem hervorgehobenen Weg, um sicher zur Ausgangst\u00fcr zu gelangen."}}};
const state = { lang:'en', scale:1, tx:0, ty:0, active:'EXIT5', tts:true };
const floorImg = new Image(); floorImg.src = 'assets/r1.png';
const $ = id => document.getElementById(id);

async function loadData(){
  try { const res = await fetch('assets/paths.json'); DATA = await res.json(); }
  catch(e){ DATA = FALLBACK; }
}

function setupCanvas(){
  $('floor').src = floorImg.src; $('floor').width = floorImg.naturalWidth; $('floor').height = floorImg.naturalHeight;
  const svg = $('overlay'); svg.setAttribute('width', floorImg.naturalWidth); svg.setAttribute('height', floorImg.naturalHeight);
  svg.setAttribute('viewBox', `0 0 ${floorImg.naturalWidth} ${floorImg.naturalHeight}`);
}

function draw(){
  const svg = $('overlay'); svg.innerHTML = '';
  Object.entries(DATA.paths).forEach(([name,conf])=>{
    const points = conf.points.map(p=>p.join(',')).join(' ');
    const pl = document.createElementNS('http://www.w3.org/2000/svg','polyline');
    pl.setAttribute('points', points); pl.setAttribute('fill','none'); pl.setAttribute('stroke', conf.color);
    pl.setAttribute('stroke-width', name===state.active? conf.width+2: conf.width);
    pl.setAttribute('stroke-linecap','round'); pl.setAttribute('stroke-linejoin','round');
    if(name===state.active){ pl.classList.add('route-active'); pl.setAttribute('stroke-dasharray','10 6'); pl.setAttribute('stroke-dashoffset','0'); }
    pl.style.cursor='pointer'; pl.addEventListener('click', ()=>{ setActive(name); playGuidance(); });
    svg.appendChild(pl);
  });
}

function setActive(name){ state.active = name; $('exitSelect').value = name; updatePhrase(); draw(); }
function updatePhrase(){ const phrases = DATA.phrases[state.lang.toUpperCase()]||{}; $('phrase').textContent = phrases[state.active]||''; }
function applyTransform(){ $('canvasWrap').style.transform = `translate(${state.tx}px, ${state.ty}px) scale(${state.scale})`; }
function zoom(d){ state.scale = Math.min(5, Math.max(0.5, state.scale + d)); applyTransform(); }
function pan(dx,dy){ state.tx+=dx; state.ty+=dy; applyTransform(); }

let dragging=false,lastX=0,lastY=0;
$('canvasWrap').addEventListener('mousedown', e=>{ dragging=true; lastX=e.clientX; lastY=e.clientY; });
window.addEventListener('mouseup', ()=> dragging=false);
window.addEventListener('mousemove', e=>{ if(!dragging) return; const dx=e.clientX-lastX, dy=e.clientY-lastY; lastX=e.clientX; lastY=e.clientY; pan(dx,dy); });
$('canvasWrap').addEventListener('touchstart', e=>{ dragging=true; const t=e.touches[0]; lastX=t.clientX; lastY=t.clientY; });
$('canvasWrap').addEventListener('touchmove', e=>{ if(!dragging) return; const t=e.touches[0]; const dx=t.clientX-lastX, dy=t.clientY-lastY; lastX=t.clientX; lastY=t.clientY; pan(dx,dy); });
$('canvasWrap').addEventListener('touchend', ()=> dragging=false);

// Audio with MP3 preference, TTS fallback
const audioEl = new Audio(); audioEl.preload='auto';
audioEl.addEventListener('error', ()=>{ if(state.tts) speakTTS(); });
audioEl.addEventListener('canplay', ()=> audioEl.play());
function audioSrc(){ const lang = state.lang==='de'?'de':'en'; return `assets/audio/${state.active}/voice_${lang}.mp3`; }
function playGuidance(){ audioEl.pause(); audioEl.src = audioSrc(); audioEl.load(); }
function speakTTS(){ const u = new SpeechSynthesisUtterance(DATA.phrases[state.lang.toUpperCase()][state.active]||''); u.lang = state.lang==='de'?'de-DE':'en-US'; speechSynthesis.cancel(); speechSynthesis.speak(u); }

function initControls(){
  $('zoomIn').addEventListener('click', ()=> zoom(+0.2)); $('zoomOut').addEventListener('click', ()=> zoom(-0.2));
  $('resetView').addEventListener('click', ()=>{ state.scale=1; state.tx=0; state.ty=0; applyTransform(); });
  $('play').addEventListener('click', playGuidance);
  $('replay').addEventListener('click', ()=>{ audioEl.currentTime=0; audioEl.play(); });
  $('mute').addEventListener('click', ()=>{ audioEl.muted = !audioEl.muted; $('mute').innerText = audioEl.muted? 'Unmute' : 'Mute'; });
  $('vol').addEventListener('input', e=> audioEl.volume = e.target.value);
  $('toggleTTS').addEventListener('click', ()=>{ state.tts = !state.tts; $('toggleTTS').innerText = state.tts? 'TTS: On' : 'TTS: Off'; });
  $('exitSelect').addEventListener('change', e=> setActive(e.target.value));
  $('langSelect').addEventListener('change', e=>{ state.lang = e.target.value; updatePhrase(); });
  $('copyLink').addEventListener('click', ()=>{
    const url = new URL(window.location.href);
    url.searchParams.set('exit', state.active.replace('EXIT',''));
    url.searchParams.set('lang', state.lang);
    navigator.clipboard.writeText(url.toString()).then(()=>{ $('copyLink').innerText='Link copied!'; setTimeout(()=> $('copyLink').innerText='Copy Deep Link',1200); });
  });
}

function parseDeepLink(){ const url = new URL(window.location.href); const ex = url.searchParams.get('exit'); const lg = url.searchParams.get('lang');
  if(ex && DATA.paths[`EXIT${ex}`]) state.active = `EXIT${ex}`; if(lg && (lg==='en'||lg==='de')) state.lang = lg;
}

window.addEventListener('DOMContentLoaded', async ()=>{ await loadData();
  $('exitSelect').innerHTML = Object.keys(DATA.paths).map(k=>`<option value="${k}">${k}</option>`).join('');
  parseDeepLink(); floorImg.onload = ()=>{ setupCanvas(); draw(); applyTransform(); updatePhrase(); }; initControls();
});
