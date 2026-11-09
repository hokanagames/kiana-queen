'use strict';
/* ============================================================
   Kiana Queen — game core: state, play, rendering, screens, flow
   ============================================================ */
const $=s=>document.querySelector(s);
const cv=$('#game'),ctx=cv.getContext('2d');
const hud=$('#hud'),screenEl=$('#screen'),toastEl=$('#toast'),layer=$('#sceneLayer');
const fa=n=>String(n).replace(/\d/g,d=>'۰۱۲۳۴۵۶۷۸۹'[d]);
const fmtTime=t=>{t=Math.max(0,Math.ceil(t));return fa(Math.floor(t/60))+':'+fa(String(t%60).padStart(2,'0'));};
const rnd=a=>a[Math.floor(Math.random()*a.length)];
const FONT_T="'Baloo Bhaijaan 2','Vazirmatn',sans-serif";
let vw=0,vh=0,dpr=1,mode='title',G=null,clock=0;

const SV=(p,extra)=>'<svg viewBox="0 0 24 24"'+(extra||'')+'>'+p+'</svg>';
const IC={
  coin:SV('<circle cx="12" cy="12" r="9" fill="#FFC531" stroke="#22303C" stroke-width="2.2"/><circle cx="12" cy="12" r="4.4" fill="none" stroke="#D99100" stroke-width="2"/>'),
  doc:SV('<path d="M3 6.5h7l2 2.2h9V20H3z" fill="#F5B841" stroke="#22303C" stroke-width="2.2" stroke-linejoin="round"/>'),
  cup:SV('<path d="M8 2.5c-1 1.5 1 2.2 0 4M12 2.5c-1 1.5 1 2.2 0 4" fill="none" stroke="#22303C" stroke-width="1.7" stroke-linecap="round"/><path d="M3.5 9h14v5.5a5.5 5.5 0 0 1-5.5 5.5H9a5.5 5.5 0 0 1-5.5-5.5z" fill="currentColor" stroke="#22303C" stroke-width="2.2" stroke-linejoin="round"/><path d="M17.5 11h1.3a2.6 2.6 0 0 1 0 5.2h-1.6" fill="none" stroke="#22303C" stroke-width="2.2"/>'),
  donut:SV('<circle cx="12" cy="12" r="9.5" fill="#E8A35C" stroke="#22303C" stroke-width="2.2"/><path d="M4.6 10.5a7.6 7.6 0 0 1 14.8 0c.3 2-1.2 1.2-2 2.4s-1.6-.4-3 .6-2.4 0-3.6-.6-2.2.8-3.4-.2-3 .3-2.8-2.2z" fill="#FF7FA8"/><circle cx="12" cy="12" r="3" fill="#fff" stroke="#22303C" stroke-width="2.2"/>'),
  phone:SV('<rect x="7" y="2.5" width="10" height="19" rx="2.5" fill="#2D3748" stroke="#22303C" stroke-width="2"/><rect x="8.6" y="5" width="6.8" height="12" fill="#7FD1F0"/><path d="M3 8c-1 2-1 6 0 8M21 8c1 2 1 6 0 8" stroke="#E5484D" stroke-width="2" fill="none" stroke-linecap="round"/>'),
  box:SV('<path d="M3 8l9-4 9 4v10l-9 4-9-4z" fill="#C98B5A" stroke="#22303C" stroke-width="2" stroke-linejoin="round"/><path d="M3 8l9 4 9-4M12 12v10" fill="none" stroke="#22303C" stroke-width="2"/><circle cx="9" cy="14" r="1.2" fill="#22303C"/><circle cx="14.5" cy="14" r="1.2" fill="#22303C"/>'),
  restart:SV('<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4v4.6h-4.6" fill="none" stroke="#22303C" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>'),
  home:SV('<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4z" fill="#fff" stroke="#22303C" stroke-width="2.2" stroke-linejoin="round"/>'),
  pause:SV('<rect x="6" y="5" width="4" height="14" rx="1.5" fill="#22303C"/><rect x="14" y="5" width="4" height="14" rx="1.5" fill="#22303C"/>'),
  play:SV('<path d="M7 4.5v15l12-7.5z" fill="#fff" stroke="#22303C" stroke-width="2" stroke-linejoin="round"/>'),
  gear:SV('<path d="M12 2.8l1.6 2.3 2.7-.7.5 2.8 2.6 1-1.1 2.6 1.6 2.3-2.4 1.5.2 2.8-2.8.1-1 2.6-2.4-1.5-2.4 1.5-1-2.6-2.8-.1.2-2.8-2.4-1.5L5 11.4 3.9 8.8l2.6-1 .5-2.8 2.7.7z" fill="#B9C2C9" stroke="#22303C" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="12" r="3.2" fill="#fff" stroke="#22303C" stroke-width="1.8"/>'),
  shirt:SV('<path d="M8 3l-5 3 2 5 2-1v11h10V10l2 1 2-5-5-3c-.5 1.6-2 2.5-4 2.5S8.5 4.6 8 3z" fill="#FF5A8C" stroke="#22303C" stroke-width="2" stroke-linejoin="round"/>'),
  board:SV('<rect x="2.5" y="4" width="19" height="15" rx="2" fill="#D9A86A" stroke="#22303C" stroke-width="2"/><rect x="5" y="6.5" width="5" height="4" fill="#FFF6DA" stroke="#22303C" stroke-width="1.2"/><rect x="13.5" y="11" width="5" height="4" fill="#FFF6DA" stroke="#22303C" stroke-width="1.2"/><path d="M7.5 8.5l8.5 4.5" stroke="#D7263D" stroke-width="1.5"/>'),
  map:SV('<path d="M3 6l6-2.5 6 2.5 6-2.5v14.5l-6 2.5-6-2.5-6 2.5z" fill="#8BD3B7" stroke="#22303C" stroke-width="2" stroke-linejoin="round"/><path d="M9 3.5v14.5M15 6v14.5" stroke="#22303C" stroke-width="1.6"/>'),
  clock:SV('<circle cx="12" cy="13" r="8.5" fill="#fff" stroke="#22303C" stroke-width="2.2"/><path d="M12 8v5l3 2M10 2.5h4" fill="none" stroke="#22303C" stroke-width="2.2" stroke-linecap="round"/>'),
  snow:SV('<path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7M9 4l3 2 3-2M9 20l3-2 3 2" fill="none" stroke="#2E7FD8" stroke-width="2.2" stroke-linecap="round"/>'),
  moon:SV('<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z" fill="#FFE58A" stroke="#22303C" stroke-width="2"/>'),
  bean:SV('<ellipse cx="12" cy="12" rx="6.5" ry="9" transform="rotate(25 12 12)" fill="#F5B700" stroke="#22303C" stroke-width="2"/><path d="M9.5 5.5c3 3 1 9 4.5 13" fill="none" stroke="#9A6A00" stroke-width="2" stroke-linecap="round"/>'),
  lock:SV('<rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="#B9C2C9" stroke="#22303C" stroke-width="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" fill="none" stroke="#22303C" stroke-width="2.2"/>'),
  bag:SV('<path d="M4.5 8h15l-1.2 12.5H5.7z" fill="#FF5A8C" stroke="#22303C" stroke-width="2" stroke-linejoin="round"/><path d="M8.5 10V7a3.5 3.5 0 0 1 7 0v3" fill="none" stroke="#22303C" stroke-width="2"/>'),
  starOn:SV('<path d="M12 2.3l2.9 6 6.6.8-4.9 4.5 1.3 6.6L12 17l-5.9 3.2 1.3-6.6L2.5 9.1l6.6-.8z" fill="#FFC531" stroke="#22303C" stroke-width="1.8" stroke-linejoin="round"/>'),
  starOff:SV('<path d="M12 2.3l2.9 6 6.6.8-4.9 4.5 1.3 6.6L12 17l-5.9 3.2 1.3-6.6L2.5 9.1l6.6-.8z" fill="#4A6074" stroke="#22303C" stroke-width="1.8" stroke-linejoin="round"/>'),
  tap:SV('<path d="M9 11V5a2 2 0 0 1 4 0v5l4.5.8a2.5 2.5 0 0 1 2 2.9L18.6 20H9.5l-4-5.2a1.8 1.8 0 0 1 2.7-2.3z" fill="#FCDCC8" stroke="#22303C" stroke-width="1.9" stroke-linejoin="round"/>'),
  desk:SV('<rect x="3" y="5" width="18" height="14" rx="4" fill="#FFB3CB" stroke="#22303C" stroke-width="2"/><path d="M12 8.5l1.2 2.4 2.6.3-1.9 1.8.5 2.6-2.4-1.3-2.4 1.3.5-2.6-1.9-1.8 2.6-.3z" fill="#FF4F86"/>'),
  closet:SV('<rect x="4" y="2.5" width="16" height="19" rx="2" fill="#B07A3B" stroke="#22303C" stroke-width="2"/><path d="M12 2.5v19" stroke="#22303C" stroke-width="2"/><circle cx="10" cy="12" r="1.1" fill="#FFC531"/><circle cx="14" cy="12" r="1.1" fill="#FFC531"/><path d="M7 6h3M14 6h3" stroke="#22303C" stroke-width="1.5"/>'),
  noise:SV('<rect x="3" y="12" width="18" height="8" rx="2" fill="#AEE3F5" stroke="#22303C" stroke-width="2"/><path d="M7 9c1-2 2-2 3 0s2 2 3 0 2-2 3 0" fill="none" stroke="#E5484D" stroke-width="2" stroke-linecap="round"/><path d="M6 4l1.5 2.5M12 3v3M18 4l-1.5 2.5" stroke="#E5484D" stroke-width="2" stroke-linecap="round"/>'),
  door:SV('<rect x="5" y="2.5" width="14" height="19" rx="1.5" fill="#FF8FB5" stroke="#22303C" stroke-width="2"/><rect x="13.5" y="10" width="3" height="4" rx="1" fill="#fff" stroke="#22303C" stroke-width="1.4"/>'),
  key:SV('<rect x="3" y="7" width="18" height="11" rx="2" fill="#FF8FB5" stroke="#22303C" stroke-width="2"/><rect x="5.5" y="10" width="6" height="3.5" fill="#FFE58A" stroke="#22303C" stroke-width="1.2"/>'),
  ear:SV('<path d="M7 9a5 5 0 0 1 10 0c0 3-3 4-3 7a3 3 0 0 1-6 0" fill="#F1C8A8" stroke="#22303C" stroke-width="2" stroke-linecap="round"/><path d="M10 9a2 2 0 0 1 4 0" fill="none" stroke="#22303C" stroke-width="1.8"/><path d="M19.5 6c1 1.5 1 4 0 5.5M21.5 4.5c1.6 2.4 1.6 6 0 8.5" fill="none" stroke="#E5484D" stroke-width="1.8" stroke-linecap="round"/>'),
  cam:SV('<rect x="3" y="7" width="13" height="9" rx="2" fill="#E9EEF2" stroke="#22303C" stroke-width="2"/><path d="M16 10l5-2.5v8L16 13" fill="#B9C2C9" stroke="#22303C" stroke-width="2" stroke-linejoin="round"/><circle cx="6.5" cy="10" r="1.3" fill="#E5484D"/>'),
  zzz:SV('<path d="M4 6h6l-6 7h6M13 4h5l-5 6h5M14 14h4l-4 5h4" fill="none" stroke="#5F7383" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'),
  laser:SV('<rect x="1.5" y="9" width="4" height="6" rx="1" fill="#555" stroke="#22303C" stroke-width="1.6"/><rect x="18.5" y="9" width="4" height="6" rx="1" fill="#555" stroke="#22303C" stroke-width="1.6"/><path d="M5.5 12h13" stroke="#FF2D55" stroke-width="2.6"/>'),
  steam:SV('<circle cx="12" cy="13" r="3" fill="#36A985" stroke="#22303C" stroke-width="1.8"/><circle cx="12" cy="13" r="6.5" fill="none" stroke="#36A985" stroke-width="1.8" stroke-dasharray="3 2"/><circle cx="12" cy="13" r="9.5" fill="none" stroke="#9FD8C4" stroke-width="1.6" stroke-dasharray="3 3"/>'),
  skull:SV('<path d="M12 3a8 8 0 0 0-5 14.2V20h10v-2.8A8 8 0 0 0 12 3z" fill="#fff" stroke="#22303C" stroke-width="2"/><circle cx="9" cy="11.5" r="2" fill="#E5484D"/><circle cx="15" cy="11.5" r="2" fill="#E5484D"/><path d="M10 20v-2M14 20v-2" stroke="#22303C" stroke-width="1.6"/>'),
  secret:SV('<path d="M12 2l2.2 6.3L21 9l-5.2 4.3L17.5 20 12 16.3 6.5 20l1.7-6.7L3 9l6.8-.7z" fill="#C9A0E8" stroke="#22303C" stroke-width="1.8" stroke-linejoin="round"/><text x="12" y="15" font-size="8" text-anchor="middle" fill="#22303C" font-weight="800">?</text>'),
  music:SV('<path d="M9 17V5l11-2v12" fill="none" stroke="#22303C" stroke-width="2.2"/><circle cx="6.5" cy="17.5" r="3" fill="#FF5A8C" stroke="#22303C" stroke-width="2"/><circle cx="17.5" cy="15.5" r="3" fill="#FF5A8C" stroke="#22303C" stroke-width="2"/>'),
  speaker:SV('<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="#22303C"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" fill="none" stroke="#22303C" stroke-width="2.2" stroke-linecap="round"/>'),
  talk:SV('<path d="M4 5h16v10H10l-4 4v-4H4z" fill="#fff" stroke="#22303C" stroke-width="2" stroke-linejoin="round"/><circle cx="9" cy="10" r="1.2" fill="#22303C"/><circle cx="12" cy="10" r="1.2" fill="#22303C"/><circle cx="15" cy="10" r="1.2" fill="#22303C"/>'),
  bolt:SV('<path d="M13 2L5 13h6l-1 9 8-11h-6z" fill="#FFE14D" stroke="#22303C" stroke-width="1.8" stroke-linejoin="round"/>'),
  hourglass:SV('<path d="M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9" fill="none" stroke="#22303C" stroke-width="2" stroke-linecap="round"/><path d="M9 19c1-2 5-2 6 0z" fill="#F5B841"/>'),
  vent:SV('<rect x="3" y="5" width="18" height="14" rx="2" fill="#B9C2C9" stroke="#22303C" stroke-width="2"/><path d="M6 9h12M6 12h12M6 15h12" stroke="#22303C" stroke-width="1.8" stroke-linecap="round"/><circle cx="5" cy="7" r=".9" fill="#22303C"/><circle cx="19" cy="17" r=".9" fill="#22303C"/>'),
  printer:SV('<rect x="6" y="3" width="12" height="6" fill="#fff" stroke="#22303C" stroke-width="1.8"/><rect x="3" y="8" width="18" height="9" rx="2" fill="#9AA6B2" stroke="#22303C" stroke-width="2"/><rect x="6.5" y="14" width="11" height="7" fill="#fff" stroke="#22303C" stroke-width="1.8"/><circle cx="17.5" cy="11" r="1.2" fill="#62C784"/>'),
  car:SV('<path d="M3 15.5V12l2.5-4.5h9L18 11l3 1v3.5z" fill="#8FE0C2" stroke="#22303C" stroke-width="2" stroke-linejoin="round"/><path d="M7 8.3l-1.5 3h5.3V8.3zM12.3 8.3v3H16l-2-3z" fill="#D7F3FF" stroke="#22303C" stroke-width="1.4"/><circle cx="7.5" cy="16" r="2.4" fill="#22303C"/><circle cx="16.5" cy="16" r="2.4" fill="#22303C"/><rect x="12" y="11.6" width="3.2" height="3" fill="#FF8FB5"/>'),
  moto:SV('<circle cx="5.5" cy="16" r="3.5" fill="none" stroke="#22303C" stroke-width="2.4"/><circle cx="18.5" cy="16" r="3.5" fill="none" stroke="#22303C" stroke-width="2.4"/><path d="M5.5 16l4-6h5l4 6M9.5 10l-1-3h-3M14.5 10l2-3h2.5" fill="none" stroke="#E5484D" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 10.5h6l-1.5 3h-3z" fill="#E5484D" stroke="#22303C" stroke-width="1.4"/>'),
  back:SV('<path d="M9 5l7 7-7 7" fill="none" stroke="#22303C" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>')
};
const MECH_IC={vent:IC.vent,printer:IC.printer,car:IC.car,moto:IC.moto,cup:IC.cup,tap:IC.tap,desk:IC.desk,closet:IC.closet,noise:IC.noise,door:IC.door,ear:IC.ear,cam:IC.cam,snow:IC.snow,clock:IC.clock,zzz:IC.zzz,moon:IC.moon,laser:IC.laser,steam:IC.steam,skull:IC.skull,secret:IC.secret};

/* ================= Save ================= */
const SAVE_KEY='kianaQueen.v4';
const FRESH=()=>({coins:PAY.startCoins,stars:[],best:{},beans:{},secrets:{},clues:{},coinBest:{},gadgets:{donut:0,phone:0,box:0},seen:{},gifts:{},cfSeen:{},mech:{},owned:{},
  look:{kiana:{},hiroman:{}},set:{sfx:true,music:true,voice:true},started:false});
let save=FRESH();
/* fill missing fields of a loaded (or restored-from-code) save; returns null if it isn't a save */
function normSave(s){if(!s||typeof s!=='object'||!s.gadgets)return null;const f=FRESH(),v=Object.assign(f,s);v.set=Object.assign(f.set,s.set||{});v.look=Object.assign(f.look,s.look||{});v.gadgets=Object.assign(f.gadgets,s.gadgets||{});for(const k in v.gadgets)v.gadgets[k]=Math.max(0,v.gadgets[k]|0);if(!Array.isArray(v.stars))v.stars=[];v.coins=Math.max(0,+v.coins||0);return v;}
try{save=normSave(JSON.parse(localStorage.getItem(SAVE_KEY)))||FRESH();}catch(e){save=FRESH();}
/* Ask the browser to never auto-delete our data (Chrome/Android/Safari 17+; no-op elsewhere). Asked once, after real progress. */
let askedKeep=false;
function keepStorage(){if(askedKeep||!save.started)return;askedKeep=true;try{const S=navigator.storage;if(S&&S.persist)S.persisted().then(p=>p||S.persist()).catch(()=>{});}catch(e){}}
function persist(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(save));}catch(e){}keepStorage();}
/* Backup code: the whole save as text (with a checksum), so a player can restore it after clearing data, on a new phone or a new web address */
function hashStr(j){let h=0;for(let i=0;i<j.length;i++)h=(h*31+j.charCodeAt(i))|0;return (h>>>0).toString(36);}
function saveCode(){const j=JSON.stringify(save);return 'KQ1-'+btoa(unescape(encodeURIComponent(j)))+'-'+hashStr(j);}
function readCode(c){const m=String(c||'').replace(/\s+/g,'').match(/^KQ1-([A-Za-z0-9+/=]+)-([0-9a-z]+)$/);if(!m)return null;
  try{const j=decodeURIComponent(escape(atob(m[1])));if(hashStr(j)!==m[2])return null;return normSave(JSON.parse(j));}catch(e){return null;}}
function applySettings(){Object.assign(AUDIO.settings,save.set);LOOK_CHOICE={kiana:Object.assign({},save.look.kiana),hiroman:Object.assign({},save.look.hiroman)};}
applySettings();
const beanCount=()=>Object.keys(save.beans).length;
const secretCount=()=>Object.keys(save.secrets).length;
const secretTotal=()=>LEVELS.filter(l=>l.secret).length;
const starTotal=()=>save.stars.reduce((a,b)=>a+(b||0),0);
const unlocked=i=>i===0||!!save.set.test||(save.stars[i-1]||0)>0;
const maxReached=()=>{let m=0;for(let i=0;i<LEVELS.length;i++)if(unlocked(i))m=i;return m;};
const gadgetOpen=k=>maxReached()>=GADGETS[k].from;
const coffeeOpen=k=>{const c=COFFEES[k];return c.beans?beanCount()>=c.beans:maxReached()>=c.from;};
function sfx(type,arg){AUDIO.sfx(type,arg);}
for(const ev of['pointerdown','pointerup','touchend','click','keydown'])addEventListener(ev,()=>AUDIO.unlock(),true);
/* pause + silence when the app goes to the background */
document.addEventListener('visibilitychange',()=>{if(document.hidden){persist();if(mode==='play'&&G&&G.state==='play')pauseMenu();if(AUDIO.suspend)AUDIO.suspend();}else AUDIO.unlock();});
addEventListener('pagehide',persist);
/* shuffle-bag picker: a line never repeats until the whole pool was used */
const BAGS={};
function pick(key,arr){let b=BAGS[key];if(!b||!b.length||b.n!==arr.length){b=arr.map((_,i)=>i).sort(()=>Math.random()-.5);b.n=arr.length;BAGS[key]=b;}return arr[b.pop()];}

/* ================= Modes & screens ================= */
function setMode(m){mode=m;layer.hidden=m!=='scene';hud.hidden=m!=='play';if(m!=='scene')hideTalk();}
function show(html,cls){screenEl.className=cls||'';if(cls&&/over|brief|catch/.test(cls))hud.hidden=true;screenEl.innerHTML='<div class="wrap">'+html+'</div>';screenEl.hidden=false;screenEl.scrollTop=0;}
function hideScreen(){screenEl.hidden=true;screenEl.innerHTML='';if(mode==='play'){hud.hidden=false;layout();}}
let toastT=0;
function toast(txt,small){toastEl.textContent=txt;toastEl.classList.toggle('small',!!small);toastEl.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>toastEl.classList.remove('on'),small?2300:1500);}
const on=(id,fn)=>{const e=$(id);if(e)e.onclick=ev=>{sfx('click');fn(ev);};};
function musicForLevel(def){return def.chase?'chase':def.boss?'boss':def.night?'night':def.mode==='timed'?'tense':'sneak';}

/* ================= Level runtime ================= */
function levelTheme(def){return def.theme||CHAPTERS[def.ch].theme;}
function startLevel(idx,coffeeKey){
  if(G&&G.chase&&CHASE)CHASE.stop();
  const def=LEVELS[idx],cf=COFFEES[coffeeKey]||COFFEES.drip;
  if(def.chase)return startChase(idx,coffeeKey);
  hud.classList.remove('chase');
  const tk=levelTheme(def);
  G=makeWorld(def);
  Object.assign(G,{idx,def,tk,th:THEMES[tk]||THEMES.lobby,coffeeKey,cf,ab:cf.ab,t:0,wt:0,state:'brief',susp:0,suspPeak:0,alertCD:0,shake:0,phones:[],noises:[],placing:null,parts:[],says:[],
    marker:null,endT:0,bonusTime:0,bonusCoins:0,boxT:0,frozen:false,shown:false,caught:0,used:{donut:0,phone:0,box:0},thought:null,flags:{},secretGot:false,glint:0,diff:CH_DIFF[def.ch]||1});
  G.items=G.L.items.map(i=>Object.assign({got:false,ph:Math.random()*6},i));
  G.docsTotal=G.items.filter(i=>i.kind==='doc').length;G.coinsTotal=G.items.filter(i=>i.kind==='coin').length;G.docsGot=0;G.coinsGot=0;G.beanGot=false;
  G.friends=(def.friends||[]).map(f=>Object.assign({},f,{x:f.x+.5,y:f.y+.5,said:false,t:0}));
  G.printers=G.L.printers.map(p=>({x:p.x,y:p.y,on:0,cd:0}));
  G.K={x:G.L.start.x+.5,y:G.L.start.y+.5,path:[],dir:-P/2,energy:cf.energy,max:cf.energy,walking:false,yawnT:3.5,t:0,tile:-1,warned:false,crawl:null,useP:null};
  setMode('play');hideScreen();
  hudCache={};
  const bb=$('#bossBar');bb.hidden=!def.boss;
  if(def.boss){$('#bossName').textContent=def.boss.title;$('#bossWho').textContent=PEOPLE[def.boss.who].name;const pc=$('#bossPic');pc.dataset.who=def.boss.who;pc.dataset.mood='evil';}
  const mc=$('#modeChip');mc.hidden=def.boss||!(def.mode==='freeze'||def.night||def.mode==='timed');
  mc.innerHTML=def.mode==='freeze'?IC.snow+'<span>نوبتی</span>':def.mode==='timed'?IC.clock+'<span>ثانیه‌شمار</span>':IC.moon+'<span>شب</span>';
  for(const k of['donut','phone','box'])$('#g_'+k).hidden=!gadgetOpen(k);
  $('#hHint').classList.add('off');G.placing=null;
  layout();updateHud();AUDIO.music(musicForLevel(def));
  showBrief();
}
function startChase(idx,coffeeKey){
  const def=LEVELS[idx],cf=COFFEES[coffeeKey]||COFFEES.drip;
  G={idx,def,chase:true,started:false,cf,coffeeKey,state:'brief',t:0,used:{donut:0,phone:0,box:0},caught:0,hits:0,coinsGot:0,coinsTotal:def.chase.coins||0,bonusCoins:0,
    docsGot:0,docsTotal:0,flags:{},endT:0,shown:false,parts:[],says:[]};
  setMode('play');hideScreen();hud.classList.add('chase');hudCache={};
  $('#bossBar').hidden=true;$('#modeChip').hidden=true;
  AUDIO.music('chase');
  showBrief();
}
function chaseEnd(res){
  if(!G||!G.chase||G.state==='won'||G.state==='lost')return;
  G.res=res||{win:false,reason:'lost',t:0,hits:0,coins:0,coinsTotal:0};
  G.t=G.res.t||0;G.hits=G.res.hits||0;G.coinsGot=G.res.coins||0;G.coinsTotal=G.res.coinsTotal||G.coinsTotal;
  G.state=G.res.win?'won':'lost';sfx(G.res.win?'win':'timeout');
  setTimeout(()=>{if(!G||!G.chase)return;if(CHASE)CHASE.stop();if(G.state==='won')showWin();else showFail();},400);
}
function goalText(g,def){const x=GOALS[g];return typeof x.t==='function'?x.t(fa(def.par)):x.t;}
function goalsHtml(def,res){
  const first=def.chase?(def.chase.endless?'تا جای ممکن دور برو!':def.chase.mode==='escape'?'سالم فرار کن':'بهشون برس و نگهشون دار'):'پرونده‌ها رو بردار و برگرد سر میزت';
  const rows=[['finish',first]].concat(def.goals.map(g=>[g,goalText(g,def)]));
  return '<div class="goals">'+rows.map((r,n)=>{const ok=res?res[n]:null;return `<div class="goal ${ok===true?'ok':ok===false?'no':''}"><span class="gs">${IC.starOn}<b>${fa(n+1)}</b></span><span>${r[1]}</span>${ok===true?'<i>✓</i>':ok===false?'<i>✗</i>':''}</div>`;}).join('')+'</div>';
}
function mechCard(m){const M=MECH[m];if(!M)return'';const nw=!save.mech[m];
  return `<div class="mech ${nw?'new':''}">${MECH_IC[M.icon]||IC.secret}<div class="mt"><b>${M.name}${nw?'<em>جدید!</em>':''}</b><span>${M.desc}</span></div></div>`;}
function showBrief(){
  const def=G.def,ch=CHAPTERS[def.ch],best=save.stars[G.idx]||0,cf=G.cf;
  const mechs=(def.intro||[]).map(mechCard).join('');
  const sec=(!def.chase&&G.idx>=2&&def.secret&&!save.secrets[G.idx])?`<div class="mech">${IC.secret}<div class="mt"><b>${MECH.secret.name}</b><span>${MECH.secret.desc}</span></div></div>`:'';
  const vIc=def.chase?(def.chase.vehicle==='moto'?IC.moto:IC.car):'';
  const nitro=def.chase?Math.max(1,1+Math.round((cf.speed-1)*5)):0;
  show(`<div class="brief-card">
    <div class="bc-top"><span class="floor-chip" style="--fc:${ch.color}">${ch.title}</span><span class="lvl">مرحله‌ی ${fa(G.idx+1)}</span>${best?'<span class="best">'+[0,1,2].map(n=>n<best?IC.starOn:IC.starOff).join('')+'</span>':''}</div>
    <h2>${def.boss?'غول: ':def.chase?'مرحله‌ی ویژه: ':''}${def.name}</h2>
    ${def.mode==='timed'?`<div class="tagline">${IC.clock}<span>فقط ${fa(def.limit)} ثانیه وقت داری!</span></div>`:''}
    ${def.chase?`<div class="tagline chaseT">${vIc}<span>${def.chase.mode==='escape'?'فرار کن و سالم برس!':'برس بهشون و نذار در برن! سکه‌ها رو قبل از رسیدن جمع کن.'}</span></div>`:''}
    <div class="sec-t">ستاره‌ها</div>${goalsHtml(def)}
    ${mechs?`<div class="sec-t">این مرحله</div><div class="mechs">${mechs}</div>`:''}
    <div class="coffee-line"><span style="color:${cf.color}">${IC.cup}</span><span>${cf.name}${cf.ab&&!def.chase?' · <b>'+ABILITY[cf.ab]+'</b>':''}</span><span class="muted">${def.chase?fa(nitro)+' نیترو':fa(cf.energy)+' ثانیه انرژی'}</span></div>
    ${sec}
    <button class="btn big" id="bGo">${IC.play} شروع!</button></div>`,'brief');
  on('#bGo',()=>{for(const m of def.intro||[])save.mech[m]=1;persist();hideScreen();G.state='play';sfx('levelStart');
    if(def.chase){G.started=true;if(CHASE)CHASE.start(def,{coffee:cf,onEnd:chaseEnd,skin:typeof vehOf==='function'?vehOf(def.chase.vehicle):null});else chaseEnd({win:true,reason:'caught',t:30,hits:0,coins:0,coinsTotal:0});return;}
    const g=G;setTimeout(()=>{if(G===g&&G.state==='play'&&def.think)think(def.think,5);},500);
    if(G.idx<2&&def.think){const h=$('#hHint');h.textContent='💭 '+def.think;h.classList.remove('off');setTimeout(()=>{if(G===g&&!G.placing)h.classList.add('off');},7000);}});
}
function layout(){
  if(!G||mode!=='play'||G.chase||hud.hidden)return;
  const top=$('.hud-top').getBoundingClientRect().bottom+(G.def.boss?50:(G.def.mode||G.def.night?30:14));
  const bot=$('.hud-bottom').getBoundingClientRect().top-8;
  const aw=vw-10,ah=Math.max(100,bot-top);
  const s=Math.max(10,Math.floor(Math.min(aw/G.L.W,ah/G.L.H)));
  G.s=s;G.ox=Math.round((vw-s*G.L.W)/2);G.oy=Math.round(top+(ah-s*G.L.H)/2);
}
function resize(){
  dpr=Math.min(2,window.devicePixelRatio||1);vw=innerWidth;vh=innerHeight;
  cv.width=Math.round(vw*dpr);cv.height=Math.round(vh*dpr);cv.style.width=vw+'px';cv.style.height=vh+'px';
  dk.width=cv.width;dk.height=cv.height;layout();
}
const dk=document.createElement('canvas'),dctx=dk.getContext('2d');
addEventListener('resize',resize);

/* ================= Thoughts & bubbles ================= */
function think(text,dur){if(!G)return;G.thought={text,t:0,dur:dur||3.6};let n=0;for(const ch of text){if(n++%3===0&&n<40)setTimeout(()=>AUDIO.voice('kiana',ch,{think:true}),n*22);}}
function sayAt(w,text,dur){G.says=G.says.filter(s=>s.w!==w);G.says.push({w,text,t:0,dur:dur||2.6});const v=w.who||'kiana';let n=0;for(const ch of text){if(n++%3===0&&n<30)setTimeout(()=>AUDIO.voice(v,ch,{}),n*24);}}
function once(flag,fn){if(!G.flags[flag]){G.flags[flag]=1;fn();}}

/* ================= Input ================= */
let pDown=false;
function tileAt(cx,cy){return{x:Math.floor((cx-G.ox)/G.s),y:Math.floor((cy-G.oy)/G.s)};}
function nearestWalk(tx,ty){if(walk(G,tx,ty))return{x:tx,y:ty};for(const[dx,dy]of SIM_DIRS)if(walk(G,tx+dx,ty+dy))return{x:tx+dx,y:ty+dy};return null;}
function printerAt(tx,ty){return G.printers&&G.printers.find(p=>p.x===tx&&p.y===ty);}
function tapAt(cx,cy,isDown){
  if(mode!=='play'||!G||G.chase||G.state!=='play')return;
  const t=tileAt(cx,cy),K=G.K;
  if(G.placing){if(isDown)placeGadget(G.placing,t.x,t.y);return;}
  if(K.crawl)return;
  if(isDown&&t.x>=0&&t.y>=0&&t.x<G.L.W&&t.y<G.L.H){const dc=doorAt(G,t.x,t.y);if(dc&&!G.keys[dc]){sfx('denied');think(dc==='1'?'قفله! کارت‌کلید صورتی لازم دارم.':'قفله! کارت‌کلید آبی لازم دارم.',2.4);return;}
    const pr=printerAt(t.x,t.y);if(pr){goPrinter(pr);return;}}
  const n=nearestWalk(t.x,t.y);if(!n)return;
  if(!isDown&&G.marker&&G.marker.x===n.x&&G.marker.y===n.y)return;
  const r=findPath(G,Math.floor(K.x),Math.floor(K.y),n.x,n.y,true);if(!r)return;
  K.useP=null;K.path=r.path.slice(1);if(!K.path.length)K.path=[{x:n.x+.5,y:n.y+.5}];
  G.marker={x:n.x,y:n.y,t:0};if(isDown)sfx('tap');
}
function goPrinter(pr){
  const K=G.K,kx=Math.floor(K.x),ky=Math.floor(K.y);
  if(Math.max(Math.abs(kx-pr.x),Math.abs(ky-pr.y))<=1){K.path=[];K.useP=null;usePrinter(pr);return;}
  let best=null;for(const[dx,dy]of SIM_DIRS){const x=pr.x+dx,y=pr.y+dy;if(!walk(G,x,y))continue;const r=findPath(G,kx,ky,x,y,true);if(r&&(!best||r.dist<best.dist))best=r;}
  if(!best){think('از این‌جا نمی‌تونم به دستگاه کپی برسم.',2.2);return;}
  K.path=best.path.slice(1);K.useP=pr;const e=best.path[best.path.length-1];G.marker={x:Math.floor(e.x),y:Math.floor(e.y),t:0};sfx('tap');
}
function usePrinter(pr){
  if(pr.cd>0){think(pick('prBusy',['هنوز داغه... یه‌کم صبر کنم.','دستگاه داره نفس می‌گیره!','یه لحظه، هنوز کاغذ قبلی بیرون نیومده.']),2);return;}
  pr.on=4.5;pr.cd=11;sfx('printer');G.noises.push({x:pr.x+.5,y:pr.y+.5,t:0,r:3});addPart(pr.x+.5,pr.y,'خرررت!','#2E7FD8');
  let best=null;
  for(const w of G.workers){if((w.state!=='routine'&&w.state!=='returning')||w.asleep)continue;
    for(const[dx,dy]of SIM_DIRS){const x=pr.x+dx,y=pr.y+dy;if(!walk(G,x,y))continue;const r=findPath(G,Math.floor(w.x),Math.floor(w.y),x,y);if(r&&r.dist<=11&&(!best||r.dist<best.r.dist))best={w,r,x,y};}}
  if(!best){think(pick('prNone',['هیچ‌کس اون نزدیکی نبود که بیاد سراغش.','کسی صداشو نشنید... باید نزدیک‌تر به یکی روشنش کنم.']),2.4);return;}
  const w=best.w,d={x:best.x+.5,y:best.y+.5,t:0,printer:pr};G.donuts.push(d);
  if(w.state==='routine')w.saved={x:w.type==='turn'?w.x0:w.x,y:w.type==='turn'?w.y0:w.y,dir:w.dir};
  w.state='toDonut';w.donut=d;w.lookT=0;w.path=best.r.path.slice(1);if(!w.path.length){w.state='eating';w.eatT=5;}
  sayAt(w,pick('prSay',['کی دستگاه کپی رو روشن کرد؟','باز کاغذ گیر کرد؟!','این دستگاه جن داره!','خرت‌خرت... برم ببینم چشه.','کی صد تا کپی از صورتش گرفته؟!']),2.4);
  once('printerTip',()=>think('عالیه! تا سرش به کاغذهاست، من رد می‌شم.',2.6));
}
cv.addEventListener('pointerdown',e=>{pDown=true;if(G&&G.chase){if(G.state==='play'&&G.started&&CHASE)CHASE.pointer('down',e.clientX,e.clientY);return;}tapAt(e.clientX,e.clientY,true);});
cv.addEventListener('pointermove',e=>{if(G&&G.chase){if(G.state==='play'&&G.started&&CHASE)CHASE.pointer('move',e.clientX,e.clientY);return;}if(pDown)tapAt(e.clientX,e.clientY,false);});
addEventListener('pointerup',e=>{pDown=false;if(G&&G.chase&&G.state==='play'&&G.started&&CHASE)CHASE.pointer('up',e.clientX,e.clientY);});
addEventListener('pointercancel',()=>pDown=false);
layer.addEventListener('pointerdown',e=>{e.preventDefault();sceneTap();});
{const sb=$('#skipB');sb.addEventListener('pointerdown',e=>e.stopPropagation());sb.onclick=e=>{e.stopPropagation();sfx('click');skipScene();};}
addEventListener('keydown',e=>{if(mode==='scene'&&(e.key===' '||e.key==='Enter'))sceneTap();
  if(mode==='play'&&G&&G.state==='play'){if(e.key==='Escape')pauseMenu();else if(G.chase&&G.started&&CHASE&&['ArrowLeft','ArrowRight','ArrowUp',' '].includes(e.key)){e.preventDefault();CHASE.key(e.key);}}});

$('#bPause').innerHTML=IC.pause;
$('#bPause').onclick=()=>{if(G&&G.state==='play'){sfx('open');pauseMenu();}};
/* Phone "back" button (Android app via Capacitor). Returns false only on the title screen, where it closes the app. */
function backAction(){
  if(mode==='scene'){const sk=$('#skipB');if(sk&&!sk.hidden)sk.click();return true;}
  if(!screenEl.hidden){
    if(screenEl.className==='title')return false;
    if(screenEl.className==='brief'&&G){G=null;goTower();return true;}
    for(const q of['#rNo','#pRes','#qBack','#sBack','#wBack','#bBack','#eBack','#tHome','#wTower','#bTower','#eMenu','#eTower','#cPin:not(.hide)']){const b=screenEl.querySelector(q);if(b&&!b.disabled){b.click();return true;}}
    return true;
  }
  if(mode==='play'&&G&&G.state==='play'){sfx('open');pauseMenu();}
  return true;
}
{const CapApp=window.Capacitor&&window.Capacitor.Plugins&&window.Capacitor.Plugins.App;
 if(CapApp)CapApp.addListener('backButton',()=>{try{if(!backAction())CapApp.exitApp();}catch(e){console.error(e);}});}
for(const k of['donut','phone','box'])$('#g_'+k).onclick=()=>useGadget(k);
function useGadget(k){
  if(!G||G.chase||G.state!=='play')return;
  if(save.gadgets[k]<=0){sfx('open');quickShop(k);return;}
  sfx('tap');
  if(k==='box'){if(G.boxT>0)return;save.gadgets.box--;G.used.box++;persist();G.boxT=8;sfx('box');addPart(G.K.x,G.K.y-.7,'رفتم تو کارتن!','#8B5A2B');updateHud();return;}
  G.placing=G.placing===k?null:k;
  $('#hHint').textContent=G.placing?('یه جا روی زمین بزن تا '+GADGETS[k].name+' رو بذاری.'):'';
  $('#hHint').classList.toggle('off',!G.placing);updateHud();
}
function placeGadget(k,tx,ty){
  const n=nearestWalk(tx,ty);if(!n)return;
  if(k==='donut'){
    let best=null;
    for(const w of G.workers){if(w.state!=='routine'&&w.state!=='returning'||w.asleep)continue;
      const r=findPath(G,Math.floor(w.x),Math.floor(w.y),n.x,n.y);if(r&&r.dist<=9&&(!best||r.dist<best.r.dist))best={w,r};}
    if(!best){toast('هیچ همکاری اون نزدیکی نیست. جای نزدیک‌تری بذار.',true);return;}
    save.gadgets.donut--;G.used.donut++;persist();
    const d={x:n.x+.5,y:n.y+.5,t:0};G.donuts.push(d);const w=best.w;
    if(w.state==='routine')w.saved={x:w.type==='turn'?w.x0:w.x,y:w.type==='turn'?w.y0:w.y,dir:w.dir};
    w.state='toDonut';w.donut=d;w.lookT=0;w.path=best.r.path.slice(1);if(!w.path.length){w.state='eating';w.eatT=5;}
    sfx('donut');addPart(n.x+.5,n.y+.2,'دونات!','#FF4F86');sayAt(w,pick('donutSay',['اِ! دونات!','بوی دونات میاد!','دونات مفت؟ جووون!','رژیمم از فردا!','کی این‌جا دونات جا گذاشته؟']));
  }else if(k==='phone'){
    save.gadgets.phone--;G.used.phone++;persist();const ph={x:n.x+.5,y:n.y+.5,t:0};G.phones.push(ph);sfx('phone');addPart(ph.x,ph.y-.3,'دیرینگ!','#E5484D');
    for(const w of G.workers){if(w.state==='eating'||w.state==='toDonut'||w.asleep)continue;if(Math.hypot(w.x-ph.x,w.y-ph.y)<6.5){w.lookT=3.4;w.lookDir=Math.atan2(ph.y-w.y,ph.x-w.x);}}
  }
  G.placing=null;$('#hHint').classList.add('off');updateHud();
}
function refundUsed(){let n=0;if(!G||!G.used)return 0;for(const k in G.used){save.gadgets[k]+=G.used[k];n+=G.used[k];G.used[k]=0;}persist();return n;}

/* ================= Update ================= */
const LINES={
  hear:['هوم؟ صدای چی بود؟','کی اون‌جاست؟','جیرجیر؟!','موش داریم؟','یکی اون‌جا راه رفت؟','صدای پا شنیدم!'],
  yawn:['خمیااازه!','هااااام!','خوااابم میاد...'],
  low:['اثر قهوه داره می‌پره... باید عجله کنم.','چشمام داره سنگین می‌شه... زودتر!','باتریم داره قرمز می‌شه!','یه‌کم دیگه قهوه داشتم چی می‌شد...'],
  out:['قهوه‌ام تموم شد... کند شدم و خمیازه‌هام صدا می‌ده!','تموم شد! حالا مثل لاک‌پشت خواب‌آلودم.','قهوه... تموم... شد... خمیازه‌ها لوم می‌دن!'],
  doc1:['یکی گرفتم! با پرونده دستم دیگه نباید دیده بشم...','اولی تو جیبم! از الان باید روح باشم.','گرفتمش! حالا هر نگاهی یعنی باخت.'],
  docN:['اینم از این!','یکی دیگه!','پرونده‌ی بعدی هم مال من!','آخ جون، این‌یکی هم!'],
  docAll:['همه رو دارم! حالا فقط سالم برگردم سر میزم.','تمومه! حالا برمی‌گردم، آروم و بی‌صدا.','کیسه پره! میز من، دارم میام.'],
  escort:['خب... برگشتم سر خونه‌ی اول. این بار با دقت بیشتر!','اوکی، دوباره. این بار از پشت سرشون.','نکته: به نورهای زرد بیشتر احترام بذارم.','دفعه‌ی بعد اول صبر می‌کنم، بعد می‌رم.','باشه باشه، از اول. فندق، تو هم حواست باشه!'],
  hushOk:['حق‌السکوت دادم... گرون شد ولی ارزششو داشت.','سکه‌هام رفت، ولی آبروم موند!','این خرج رو یه جایی می‌نویسم: «خسارت فضولی».'],
  woke:['هان؟! خواب نبودم!','من فقط چشمامو استراحت می‌دادم!','کی؟ چی؟ من بیدارم!'],
  sound:['هوم؟ صدای پا!','کی اون پشته؟','یه صدایی اومد...']
};
function addPart(x,y,txt,col){G.parts.push({x,y,txt,col,t:0});}
/* a squeak makes the nearest free coworker walk over and look around */
function investigate(x,y){
  let best=null;const tx=Math.floor(x),ty=Math.floor(y);
  for(const w of G.workers){if((w.state!=='routine'&&w.state!=='returning')||w.asleep)continue;
    const r=findPath(G,Math.floor(w.x),Math.floor(w.y),tx,ty);if(r&&r.dist<=7.5&&(!best||r.dist<best.r.dist))best={w,r};}
  if(!best)return;const w=best.w,d={x:tx+.5,y:ty+.5,t:0,inspect:true,dur:2.6};G.donuts.push(d);
  if(w.state==='routine')w.saved={x:w.type==='turn'?w.x0:w.x,y:w.type==='turn'?w.y0:w.y,dir:w.dir};
  w.state='toDonut';w.donut=d;w.lookT=0;w.path=best.r.path.slice(1);if(!w.path.length){w.state='eating';w.eatT=d.dur;}
  sayAt(w,pick('inspect',['کی اون‌جاست؟ برم ببینم...','صدای چی بود؟ الان میام!','یه نفر اون‌جا راه می‌ره... دارم میام!','هوم... بذار یه نگاه بندازم.']),2.2);
}
function makeNoise(x,y,r,label){G.noises.push({x,y,t:0,r});sfx('squeak');if(label)addPart(x,y-.6,label,'#2E7FD8');const g=G;setTimeout(()=>{if(G===g&&G.state==='play')investigate(x,y);},450);
  for(const w of G.workers){if(w.state==='eating'||w.state==='toDonut'||w.asleep)continue;if(Math.hypot(w.x-x,w.y-y)<r){w.lookT=2.2;w.lookDir=Math.atan2(y-w.y,x-w.x);if(w.hearCD<=0){sayAt(w,pick('hear',LINES.hear),1.8);w.hearCD=2;}}}}
function yawn(){
  sfx('yawn');addPart(G.K.x,G.K.y-.7,pick('yawn',LINES.yawn),'#5F7383');
  for(const w of G.workers){if(w.state==='eating'||w.state==='toDonut'||w.asleep)continue;
    if(Math.hypot(w.x-G.K.x,w.y-G.K.y)<4.5){w.lookT=2.2;w.lookDir=Math.atan2(G.K.y-w.y,G.K.x-w.x);}}
}
function onEnterTile(tx,ty){
  const L=G.L,id=ty*L.W+tx,K=G.K;
  if(L.noise.has(id)){if(G.ab==='silent'||G.ab==='all')once('silentStep',()=>think('کاپوچینوی ابری کار می‌کنه! قدم‌هام بی‌صدان.',2.6));
    else{makeNoise(tx+.5,ty+.5,4.5,'جیرجیر!');once('firstNoise',()=>think('وای! این کاشی جیرجیر کرد... باید از کاشی‌های براق دوری کنم.',3.4));}}
  if(L.hide.has(id))once('closet',()=>think('این‌جا تو کمد، اگه تکون نخورم هیچ‌کس پیدام نمی‌کنه.',3));
  for(const it of G.items){if(it.got||it.x!==tx||it.y!==ty)continue;it.got=true;
    if(it.kind==='coin'){G.coinsGot++;sfx('coin');addPart(it.x+.5,it.y+.2,'+'+fa(1),'#D99100');}
    else if(it.kind==='bean'){G.beanGot=true;sfx('bean');addPart(it.x+.5,it.y+.2,'دونه‌ی طلایی!','#C98B00');}
    else if(it.kind==='clock'){G.bonusTime+=10;sfx('bean');addPart(it.x+.5,it.y+.2,'+'+fa(10)+' ثانیه','#2E7FD8');}
    else if(it.kind==='shot'){K.energy=K.max;K.warned=false;sfx('gulp');addPart(it.x+.5,it.y+.2,'شات اسپرسو!','#6B3E26');}
    else if(it.kind==='secret'){G.secretGot=true;sfx('secret');G.shake=.15;toast('راز مخفی پیدا شد!');addPart(it.x+.5,it.y,'راز!','#9B59D0');}
    else if(it.kind==='key'){G.keys[it.key]=true;sfx('key');const col=it.key==='1'?'صورتی':'آبی';addPart(it.x+.5,it.y+.2,'کارت '+col+'!',it.key==='1'?'#FF4F86':'#2E7FD8');
      think('کارت‌کلید '+col+'! حالا در '+col+' برام باز می‌شه.',2.8);sfx('door');}
    else{G.docsGot++;sfx('doc');addPart(it.x+.5,it.y+.2,'پرونده!','#6B3E26');
      const left=G.docsTotal-G.docsGot;
      if(G.def.boss){const b=G.workers.find(w=>w.boss);if(b){sayAt(b,G.def.boss.taunts[Math.min(G.docsGot-1,2)]||'!',3);G.shake=.25;sfx('sting');}$('#bossBar').classList.add('hit');setTimeout(()=>$('#bossBar').classList.remove('hit'),500);}
      if(left===0){toast('حالا برگرد سر میزت!');think(pick('docAll',LINES.docAll),3.4);}
      else think((G.docsGot===1?pick('doc1',LINES.doc1):pick('docN',LINES.docN))+' '+fa(left)+' تای دیگه مونده.',3);}
  }
}
function triggerCatch(by){
  const K=G.K;K.path=[];K.useP=null;G.placing=null;$('#hHint').classList.add('off');
  if(G.docsGot>0){G.state='busted';G.bustBy=by;G.susp=1;sfx('busted');G.shake=.45;if(!by.cam)by.dir=Math.atan2(K.y-by.y,K.x-by.x);return;}
  G.state='caught';G.catchBy=by;G.susp=1;sfx('alert');G.shake=.3;if(!by.cam){by.dir=Math.atan2(K.y-by.y,K.x-by.x);by.lookT=0;}
  setTimeout(()=>{if(G&&G.state==='caught')catchDialog(by);},550);
}
function catchDialog(by){
  const key=by.cam?'cam':by.who,per=PERSONA[key]||PERSONA.cam,greedy=per.type==='greedy'&&save.coins>=per.hush;
  const line=greedy?pick('ask'+key,per.ask):pick('back'+key,per.back),nm=by.cam?(by.laser?'لیزر امنیتی':'دوربین امنیتی'):PEOPLE[by.who].name;
  show(`<div class="catch-card"><div class="cc-head">${by.cam?'<span class="cam-ic">'+IC.cam+'</span>':`<canvas class="portrait sm" data-who="${by.who}" data-mood="${per.type==='kind'?'sad':'smug'}"></canvas>`}<b>${nm}</b><span class="tag-${per.type}">${per.type==='kind'?'مهربون':per.type==='greedy'?'طمع‌کار':'سخت‌گیر'}</span></div>
    <p>«${line}»</p><p class="muted small">دستت خالی بود، پس فقط برت می‌گردونن سر میزت.</p>
    ${greedy?`<div class="row2"><button class="btn gold" id="cPay">${IC.coin} بدم (${fa(per.hush)})</button><button class="btn alt" id="cNo">نمی‌دم!</button></div>`:`<button class="btn" id="cOk">باشه... برمی‌گردم</button>`}</div>`,'catchscr');
  const vk=key==='cam'?'cam':key;
  for(let i=0;i<line.length;i+=2)setTimeout(()=>AUDIO.voice(vk,line[i],{}),i*20);
  on('#cOk',()=>escort(by));on('#cNo',()=>{sayAt(by,pick('refuse',['باشه، پس برگرد سر میزت!','خسیس! برو سر جات!','هه! پس پیاده برگرد سر میزت!']),2);escort(by);});
  on('#cPay',()=>{save.coins-=per.hush;persist();sfx('hush');hideScreen();G.state='play';G.caught++;G.susp=0;by.lookT=3.5;by.lookDir=by.dir+P;sayAt(by,pick('saw',['من چیزی ندیدم...','کی؟ من؟ هیچ‌کس رو ندیدم.','چه هوای خوبی... من فقط سقف رو نگاه می‌کنم.']),2.4);think(pick('hushOk',LINES.hushOk),2.6);updateHud();});
}
function escort(by){
  hideScreen();sfx('escort');const K=G.K,st=G.L.start;K.crawl=null;
  const kx=Math.floor(K.x),ky=Math.floor(K.y),r=findPath(G,kx,ky,st.x,st.y)||findPath(G,kx,ky,st.x,st.y,true);if(!r){K.x=st.x+.5;K.y=st.y+.5;K.tile=-1;}K.path=r?r.path.slice(1):[];
  G.state='escort';G.caught++;G.escortBy=by;G.escortPath=K.path.slice();if(!K.path.length)endEscort();
}
function endEscort(){G.state='play';G.susp=0;G.escortPath=null;think(pick('escort',LINES.escort),3);}
function update(dt){
  if(!G)return;
  G.shake=Math.max(0,G.shake-dt);
  for(const p of G.parts)p.t+=dt;G.parts=G.parts.filter(p=>p.t<1.1);
  for(const p of G.phones)p.t+=dt;G.phones=G.phones.filter(p=>p.t<3.6);
  for(const n of G.noises)n.t+=dt;G.noises=G.noises.filter(n=>n.t<.9);
  for(const s of G.says)s.t+=dt;G.says=G.says.filter(s=>s.t<s.dur);
  if(G.thought){G.thought.t+=dt;if(G.thought.t>G.thought.dur)G.thought=null;}
  if(G.marker)G.marker.t+=dt;
  if(G.state==='busted'||G.state==='timeout'||G.state==='won'){G.endT+=dt;
    if(G.endT>1.1&&!G.shown){G.shown=true;if(G.state==='won')showWin();else showFail();}
    return;}
  const K=G.K,cf=G.cf,def=G.def;
  if(G.state==='escort'){K.walking=false;K.t+=dt;if(K.path.length){const p=K.path[0];if(Math.hypot(p.x-K.x,p.y-K.y)>1.6){K.x=p.x;K.y=p.y;K.path.shift();sfx('vent');}else moveAlong(K,dt,5.5,18);if(!K.path.length)endEscort();}
    G.wt+=dt;for(const w of G.workers)updWorker(G,w,dt);for(const c of G.cams)updWorker(G,c,dt);G.susp=Math.max(0,G.susp-dt);updateHud();return;}
  if(G.state!=='play')return;
  G.t+=dt;K.walking=false;K.t+=dt;
  for(const p of G.printers){p.on=Math.max(0,p.on-dt);p.cd=Math.max(0,p.cd-dt);}
  const spd=3.1*(K.energy>0?cf.speed:.62)*(G.boxT>0?.6:1);let moved=false;
  if(K.crawl){K.crawl.t+=dt;K.walking=true;moved=true;
    if(K.crawl.t>=K.crawl.dur){K.x=K.crawl.to.x;K.y=K.crawl.to.y;K.crawl=null;sfx('vent');addPart(K.x,K.y-.6,'پاپ!','#5F7383');}}
  else if(K.path.length){const p=K.path[0];
    if(Math.hypot(p.x-K.x,p.y-K.y)>1.6){K.path.shift();K.crawl={to:{x:p.x,y:p.y},from:{x:K.x,y:K.y},t:0,dur:VENT_COST/spd};K.walking=true;moved=true;sfx('vent');
      once('ventTip',()=>think(pick('ventT',['اوخ، چه تنگه! ولی هیچ‌کس این تو رو نمی‌بینه.','تونل جاسوسی! بوی گردوخاک میاد...']),2.6));}
    else{moveAlong(K,dt,spd,18);moved=true;}
    if(!K.path.length&&!K.crawl&&K.useP){const pr=K.useP;K.useP=null;usePrinter(pr);}}
  if(moved&&K.energy>0){K.energy=Math.max(0,K.energy-dt);
    if(!K.warned&&K.energy<K.max*.25){K.warned=true;sfx('coffeeLow');think(pick('low',LINES.low),2.8);}
    if(K.energy<=0){sfx('coffeeOut');toast('قهوه تموم شد!');think(pick('out',LINES.out),3.2);}}
  if(G.boxT>0)G.boxT=Math.max(0,G.boxT-dt);
  const wdt=def.mode==='freeze'?(K.walking?dt:0):dt;
  G.frozen=def.mode==='freeze'&&!K.walking;G.wt+=wdt;
  if(K.energy<=0&&wdt>0&&!K.crawl){K.yawnT-=dt;if(K.yawnT<=0){K.yawnT=6+Math.random()*3;yawn();}}
  const tx=Math.floor(K.x),ty=Math.floor(K.y),tid=ty*G.L.W+tx;
  if(!K.crawl&&tid!==K.tile){K.tile=tid;onEnterTile(tx,ty);}
  for(const f of G.friends){f.t+=dt;if(!f.said&&Math.hypot(f.x-K.x,f.y-K.y)<1.7){f.said=true;sfx('ding');sayAt(f,f.line,4.5);
    if(f.give==='coins'){G.bonusCoins+=3;addPart(f.x,f.y-.6,'+'+fa(3)+' سکه','#D99100');}else if(f.give==='shot'){K.energy=K.max;K.warned=false;addPart(f.x,f.y-.6,'قهوه!','#6B3E26');}}}
  for(const w of G.workers)updWorker(G,w,wdt);
  for(const c of G.cams)updWorker(G,c,wdt);
  // vision
  const still=!K.walking,inCloset=G.L.hide.has(tid),hidden=!!K.crawl||(G.boxT>0&&still)||(inCloset&&still);
  const camBlind=G.ab==='camblind';
  let seen=null,close=0;
  for(const w of G.workers.concat(G.cams)){w.sees=!hidden&&!(w.cam&&camBlind)&&canSee(G,w,K.x,K.y);if(w.sees){const c=1-Math.hypot(w.x-K.x,w.y-K.y)/Math.max(.1,visionRange(G,w));if(!seen||c>close){seen=w;close=c;}}}
  // lasers
  if(!K.crawl&&G.L.laser.has(tid)&&laserOn(G,tx,ty,G.wt)&&!(G.boxT>0&&!K.walking)){G.shake=.3;addPart(K.x,K.y-.7,'بیــپ!','#FF2D55');triggerCatch({cam:true,laser:true,x:K.x,y:K.y});return;}
  // ears + radar
  const silent=G.ab==='silent'||G.ab==='all';
  for(const w of G.workers){
    if(w.ears&&!silent&&K.walking&&!hidden&&w.state==='routine'&&!w.asleep&&w.hearCD<=0&&Math.hypot(w.x-K.x,w.y-K.y)<w.ears){w.lookT=1.6;w.lookDir=Math.atan2(K.y-w.y,K.x-w.x);w.hearCD=2.2;sayAt(w,pick('sound',LINES.sound),1.6);G.noises.push({x:K.x,y:K.y,t:0,r:w.ears});}
    if(w.radar){if(w.radar.fired){w.radar.fired=false;sfx('whoosh');}
      if(w.radar.p>=0&&!w.radar.hit&&!hidden&&wdt>0){const Rr=w.radar.range*w.radar.p,d=Math.hypot(K.x-w.x,K.y-w.y);
      if(Math.abs(Rr-d)<.45&&lineClear(G,w.x,w.y,K.x,K.y)){w.radar.hit=true;G.susp+=.6;G.shake=.2;sfx('alert');addPart(K.x,K.y-.8,'داغه!','#E5484D');if(G.susp>=1){triggerCatch(w);return;}}}}
    if(w.justWoke){w.justWoke=0;sayAt(w,pick('woke',LINES.woke),1.6);}
  }
  G.alertCD-=dt;
  if(wdt>0){
    const rate=((G.ab==='cool'||G.ab==='all')?.6:1)*G.diff;
    if(seen){if(G.alertCD<=0){sfx('alert');G.alertCD=1.3;}G.susp+=wdt*1.05*rate*(1+close*.8);}
    else G.susp=Math.max(0,G.susp-wdt*.5);
  }
  G.suspPeak=Math.max(G.suspPeak,G.susp);
  if(G.susp>=1){triggerCatch(seen||G.workers[0]);return;}
  if(def.mode==='timed'&&def.limit+G.bonusTime-G.t<=0){G.state='timeout';K.path=[];sfx('timeout');G.shake=.3;G.refunded=refundUsed();return;}
  if(!K.crawl&&G.docsGot===G.docsTotal&&tx===G.L.start.x&&ty===G.L.start.y){G.state='won';K.path=[];sfx('win');}
  updateHud();
}

/* ================= HUD ================= */
let hudCache={};
function setH(id,html){if(hudCache[id]!==html){hudCache[id]=html;$(id).innerHTML=html;}}
function updateHud(){
  if(!G||G.chase)return;const def=G.def,K=G.K;
  setH('#hDocs',IC.doc+'<span>'+fa(G.docsGot)+'/'+fa(G.docsTotal)+'</span>');
  setH('#hCoins',IC.coin+'<span>'+fa(G.coinsGot)+'/'+fa(G.coinsTotal)+'</span>');
  if(def.mode==='timed'){const rem=def.limit+G.bonusTime-G.t;setH('#hTime',IC.hourglass+'<span>'+fmtTime(rem)+'</span>');$('#hTime').classList.toggle('danger',rem<10);}
  else{setH('#hTime',IC.clock+'<span>'+fmtTime(G.t)+'</span>');$('#hTime').classList.remove('danger');}
  const pct=Math.max(0,K.energy/K.max),sec=Math.ceil(K.energy),cup=$('#hCup');
  setH('#hCupIc','<span style="color:'+(K.energy>0?G.cf.color:'#B9C2C9')+';display:flex">'+IC.cup+'</span>');
  if(hudCache.pct!==Math.round(pct*100)){hudCache.pct=Math.round(pct*100);cup.style.setProperty('--p',(pct*100)+'%');cup.style.setProperty('--cc',G.cf.color);}
  setH('#hCupSec',K.energy>0?fa(sec)+'<small>ث</small>':'<small>تموم!</small>');
  cup.classList.toggle('low',K.energy>0&&pct<.25);cup.classList.toggle('out',K.energy<=0);
  setH('#hCupAb',G.ab?ABILITY[G.ab]:'');
  const sus=$('#hSus');sus.classList.toggle('on',G.susp>0.01);sus.firstElementChild.style.width=(Math.min(1,G.susp)*100)+'%';sus.classList.toggle('hot',G.susp>.6);
  for(const k of['donut','phone','box']){const n=save.gadgets[k];setH('#g_'+k,IC[k]+(n>0?'<b>'+fa(n)+'</b>':'<b class="plus">+</b>'));const b=$('#g_'+k);b.classList.toggle('armed',G.placing===k||(k==='box'&&G.boxT>0));b.classList.toggle('empty',n<=0);}
  if(def.boss)setH('#bossHp',Array.from({length:G.docsTotal},(_,i)=>'<i class="'+(i<G.docsTotal-G.docsGot?'on':'')+'"></i>').join(''));
  $('#modeChip').classList.toggle('lit',G.frozen);
}

/* ================= Game rendering ================= */
function drawFloor(x,y,s,th,tk,L){
  const px=x*s,py=y*s,ch=L.rows[y][x];
  ctx.fillStyle=(x+y)%2?th.floorA:th.floorB;ctx.fillRect(px,py,s+.5,s+.5);
  if(tk==='archive'){ctx.strokeStyle='rgba(120,80,40,.18)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(px+((y%2)?s*.5:0),py);ctx.lineTo(px+((y%2)?s*.5:0),py+s);ctx.stroke();}
  else if(tk==='build'){ctx.fillStyle='rgba(0,0,0,.08)';circ(ctx,px+s*hsh(x*7+y),py+s*hsh(y*5+x),s*.05);ctx.fill();}
  else if(tk==='night'){ctx.fillStyle='rgba(201,162,39,.18)';starPath(ctx,px+s/2,py+s/2,s*.12,4,.4);ctx.fill();}
  else if(tk==='tea'){ctx.fillStyle='rgba(255,255,255,.35)';heartPath(ctx,px+s/2,py+s/2,s*.08);ctx.fill();}
  if(ch==='u'){const lw=Math.max(1.2,s*.04);ctx.fillStyle='#9AA6B2';rr(ctx,px+s*.12,py+s*.14,s*.76,s*.72,s*.08);ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=lw;ctx.stroke();
    ctx.fillStyle='#3A4652';for(let i=0;i<4;i++)ctx.fillRect(px+s*.2,py+s*(.24+i*.15),s*.6,s*.07);
    const sh=G&&G.K&&G.K.crawl?Math.sin(performance.now()/40)*s*.02:0;ctx.fillStyle='#C9D3DA';for(const[a,b]of[[.18,.2],[.78,.2],[.18,.78],[.78,.78]]){circ(ctx,px+s*a+sh,py+s*b,s*.035);ctx.fill();}}
  if(ch==='n'){ctx.fillStyle='rgba(120,210,245,.55)';ctx.fillRect(px+1,py+1,s-2,s-2);ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=Math.max(1.5,s*.05);
    ctx.beginPath();ctx.moveTo(px+s*.18,py+s*.3);ctx.lineTo(px+s*.38,py+s*.14);ctx.moveTo(px+s*.55,py+s*.82);ctx.lineTo(px+s*.82,py+s*.58);ctx.stroke();
    ctx.strokeStyle='rgba(46,127,216,.55)';ctx.lineWidth=Math.max(1,s*.035);ctx.beginPath();for(let i=0;i<4;i++){const xx=px+s*(.3+i*.13);ctx.moveTo(xx,py+s*.52);ctx.quadraticCurveTo(xx+s*.06,py+s*.42,xx+s*.12,py+s*.52);}ctx.stroke();}
}
function drawBlock(ch,x,y,s,th,tk,L){
  const px=x*s,py=y*s,lw=Math.max(1.5,s*.045);ctx.lineWidth=lw;ctx.strokeStyle=INK;
  if(ch==='#'){ctx.fillStyle=th.wall;ctx.fillRect(px,py,s+.5,s+.5);
    if(y+1<L.H&&L.rows[y+1][x]!=='#'){ctx.fillStyle=th.wallFace;ctx.fillRect(px,py+s*.7,s+.5,s*.3+.5);
      if(th.stripes){ctx.fillStyle='#FFC531';for(let i=0;i<2;i++){ctx.beginPath();ctx.moveTo(px+i*s*.5,py+s);ctx.lineTo(px+i*s*.5+s*.25,py+s);ctx.lineTo(px+i*s*.5+s*.5,py+s*.7);ctx.lineTo(px+i*s*.5+s*.25,py+s*.7);ctx.closePath();ctx.fill();}}
      else if(y===0&&(x*7+L.W)%5===2&&!th.night)drawBankLogo(ctx,px+s*.5,py+s*.45,s*.24,0,{noZ:true});}
    ctx.fillStyle='rgba(255,255,255,.08)';ctx.fillRect(px,py,s,s*.12);return;}
  if(ch==='d'){ctx.fillStyle='#C98B5A';rr(ctx,px+s*.05,py+s*.1,s*.9,s*.8,s*.1);ctx.fill();ctx.stroke();ctx.fillStyle='#E0A777';ctx.fillRect(px+s*.1,py+s*.15,s*.8,s*.1);
    ctx.fillStyle='#2D3E4E';rr(ctx,px+s*.28,py+s*.2,s*.44,s*.3,s*.04);ctx.fill();ctx.fillStyle=tk==='night'?'#3A4A6A':'#7FD1F0';ctx.fillRect(px+s*.32,py+s*.24,s*.36,s*.2);
    ctx.fillStyle='#fff';ctx.fillRect(px+s*.15,py+s*.6,s*.25,s*.18);ctx.fillStyle='#FF8FB5';circ(ctx,px+s*.72,py+s*.68,s*.08);ctx.fill();return;}
  if(ch==='p'){ctx.fillStyle='#4FAE6B';for(const[a,b,r]of[[.35,.38,.22],[.65,.38,.22],[.5,.24,.24]]){circ(ctx,px+s*a,py+s*b,s*r);ctx.fill();ctx.stroke();}
    ctx.fillStyle='#C2643C';rr(ctx,px+s*.28,py+s*.5,s*.44,s*.38,s*.06);ctx.fill();ctx.stroke();return;}
  if(ch==='f'){ctx.fillStyle='#9AA6B2';rr(ctx,px+s*.1,py+s*.05,s*.8,s*.88,s*.06);ctx.fill();ctx.stroke();ctx.fillStyle='#B8C2CC';ctx.fillRect(px+s*.1,py+s*.05,s*.8,s*.12);
    for(let i=0;i<3;i++){ctx.strokeRect(px+s*.18,py+s*(.22+i*.23),s*.64,s*.18);ctx.fillStyle=INK;ctx.fillRect(px+s*.42,py+s*(.29+i*.23),s*.16,s*.04);}return;}
  if(ch==='x'){ctx.fillStyle='#C98B5A';rr(ctx,px+s*.08,py+s*.08,s*.84,s*.84,s*.05);ctx.fill();ctx.stroke();ctx.strokeStyle='#8B5A2B';ctx.lineWidth=lw*1.4;
    ctx.beginPath();ctx.moveTo(px+s*.15,py+s*.15);ctx.lineTo(px+s*.85,py+s*.85);ctx.moveTo(px+s*.85,py+s*.15);ctx.lineTo(px+s*.15,py+s*.85);ctx.stroke();ctx.strokeStyle=INK;ctx.lineWidth=lw;
    ctx.fillStyle='#FFC531';ctx.fillRect(px+s*.08,py+s*.08,s*.84,s*.1);ctx.strokeRect(px+s*.08,py+s*.08,s*.84,s*.1);return;}
  if(ch==='o'){const col=tk==='tea'?'#36A985':'#7E57C2';ctx.fillStyle=shade(col,-.15);rr(ctx,px+s*.04,py+s*.12,s*.92,s*.8,s*.2);ctx.fill();ctx.stroke();
    ctx.fillStyle=col;rr(ctx,px+s*.14,py+s*.3,s*.72,s*.5,s*.12);ctx.fill();ctx.stroke();ctx.fillStyle=tk==='tea'?'#FFC531':'#FF8FB5';circ(ctx,px+s*.5,py+s*.25,s*.12);ctx.fill();ctx.stroke();return;}
  if(ch==='m'){const pr=G.printers&&G.printers.find(p=>p.x===x&&p.y===y),onp=pr&&pr.on>0,jig=onp?Math.sin(performance.now()/30)*s*.02:0;
    ctx.fillStyle='#9AA6B2';rr(ctx,px+s*.08+jig,py+s*.28,s*.84,s*.6,s*.1);ctx.fill();ctx.stroke();ctx.fillStyle='#C9D3DA';rr(ctx,px+s*.14+jig,py+s*.12,s*.72,s*.22,s*.05);ctx.fill();ctx.stroke();
    ctx.fillStyle='#2D3E4E';ctx.fillRect(px+s*.22+jig,py+s*.44,s*.36,s*.12);ctx.fillStyle=onp?((performance.now()/150|0)%2?'#62C784':'#FFE14D'):(pr&&pr.cd>0?'#E5484D':'#62C784');circ(ctx,px+s*.74+jig,py+s*.5,s*.06);ctx.fill();ctx.stroke();
    if(onp){const k=(performance.now()/400)%1;ctx.fillStyle='#fff';ctx.fillRect(px+s*.26,py+s*(.7+k*.22),s*.48,s*.14);ctx.strokeRect(px+s*.26,py+s*(.7+k*.22),s*.48,s*.14);}
    else{ctx.fillStyle='#fff';ctx.fillRect(px+s*.26,py+s*.7,s*.48,s*.1);ctx.strokeRect(px+s*.26,py+s*.7,s*.48,s*.1);}
    if(pr&&!onp&&pr.cd<=0&&G.state==='play'){const a=.35+Math.sin(performance.now()/300)*.25;ctx.strokeStyle='rgba(46,127,216,'+a+')';ctx.lineWidth=Math.max(1.5,s*.05);rr(ctx,px+s*.03,py+s*.05,s*.94,s*.9,s*.14);ctx.stroke();ctx.strokeStyle=INK;}
    return;}
  if(ch==='!'||ch==='@'){const open=G.keys[DOOR_OF[ch]],col=ch==='!'?'#FF6FA3':'#4FA3F0';
    if(open){ctx.fillStyle='rgba(0,0,0,.12)';ctx.fillRect(px,py,s,s);ctx.fillStyle=col;ctx.fillRect(px,py,s*.14,s);ctx.fillRect(px+s*.86,py,s*.14,s);ctx.strokeRect(px,py,s*.14,s);ctx.strokeRect(px+s*.86,py,s*.14,s);return;}
    ctx.fillStyle=col;rr(ctx,px+s*.04,py+s*.04,s*.92,s*.92,s*.08);ctx.fill();ctx.stroke();ctx.fillStyle=shade(col,-.2);ctx.fillRect(px+s*.1,py+s*.47,s*.8,s*.06);
    ctx.fillStyle='#fff';rr(ctx,px+s*.36,py+s*.2,s*.28,s*.2,s*.04);ctx.fill();ctx.stroke();ctx.fillStyle='#E5484D';circ(ctx,px+s*.5,py+s*.3,s*.05);ctx.fill();return;}
}
function drawCloset(x,y,s,occupied,now){
  const px=x*s,py=y*s,lw=Math.max(1.5,s*.045);ctx.lineWidth=lw;ctx.strokeStyle=INK;
  ctx.fillStyle='#B07A3B';rr(ctx,px+s*.06,py+s*.04,s*.88,s*.9,s*.08);ctx.fill();ctx.stroke();
  const gap=occupied?s*.02:s*.12;ctx.fillStyle='#C98B5A';rr(ctx,px+s*.12,py+s*.1,s*.38-gap/2,s*.78,s*.04);ctx.fill();ctx.stroke();rr(ctx,px+s*.5+gap/2,py+s*.1,s*.38-gap/2,s*.78,s*.04);ctx.fill();ctx.stroke();
  ctx.fillStyle='#FFC531';circ(ctx,px+s*.44,py+s*.5,s*.035);ctx.fill();circ(ctx,px+s*.56,py+s*.5,s*.035);ctx.fill();
  if(occupied){const bl=((now*.7)%3)<.15;ctx.fillStyle='#fff';ctx.fillRect(px+s*.38,py+s*.32,s*.24,s*.1);if(!bl){ctx.fillStyle=INK;circ(ctx,px+s*.45,py+s*.37,s*.03);ctx.fill();circ(ctx,px+s*.55,py+s*.37,s*.03);ctx.fill();}}
}
function drawItem(it,s,now){
  const cx=(it.x+.5)*s,cy=(it.y+.5)*s+Math.sin(now*3+it.ph)*s*.05;ctx.lineWidth=Math.max(1.5,s*.05);ctx.strokeStyle=INK;
  if(it.kind==='coin'){ctx.fillStyle='#FFC531';ell(ctx,cx,cy,s*.2*Math.abs(Math.cos(now*2+it.ph))+s*.04,s*.2);ctx.fill();ctx.stroke();}
  else if(it.kind==='bean'){ctx.fillStyle='rgba(255,197,49,.35)';circ(ctx,cx,cy,s*(.42+Math.sin(now*5)*.05));ctx.fill();
    ctx.save();ctx.translate(cx,cy);ctx.rotate(.5+Math.sin(now*2)*.2);ctx.fillStyle='#F5B700';ell(ctx,0,0,s*.17,s*.25);ctx.fill();ctx.stroke();ctx.strokeStyle='#9A6A00';ctx.beginPath();ctx.moveTo(-s*.03,-s*.2);ctx.quadraticCurveTo(s*.08,0,-s*.02,s*.2);ctx.stroke();ctx.restore();
    ctx.fillStyle='#fff';starPath(ctx,cx+s*.22,cy-s*.22,s*.08*(1+Math.sin(now*6)),4,.3);ctx.fill();}
  else if(it.kind==='clock'){ctx.fillStyle='rgba(94,200,247,.3)';circ(ctx,cx,cy,s*.42);ctx.fill();ctx.fillStyle='#FFC531';circ(ctx,cx,cy,s*.24);ctx.fill();ctx.stroke();ctx.fillStyle='#fff';circ(ctx,cx,cy,s*.16);ctx.fill();
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(now*4)*s*.12,cy+Math.sin(now*4)*s*.12);ctx.stroke();ctx.fillStyle='#FFC531';ctx.fillRect(cx-s*.05,cy-s*.34,s*.1,s*.08);}
  else if(it.kind==='shot'){drawHeld(ctx,'cup',cx,cy,s*1.6,now);}
  else if(it.kind==='key'){const col=it.key==='1'?'#FF6FA3':'#4FA3F0';ctx.fillStyle=col+'55';circ(ctx,cx,cy,s*.42);ctx.fill();ctx.save();ctx.translate(cx,cy);ctx.rotate(Math.sin(now*2+it.ph)*.25);
    ctx.fillStyle=col;rr(ctx,-s*.26,-s*.17,s*.52,s*.34,s*.06);ctx.fill();ctx.stroke();ctx.fillStyle='#FFE58A';ctx.fillRect(-s*.18,-s*.06,s*.16,s*.12);ctx.strokeRect(-s*.18,-s*.06,s*.16,s*.12);ctx.restore();}
  else if(it.kind==='secret'){const show=G.ab==='fortune'||G.ab==='all';if(show){ctx.save();ctx.globalAlpha=.75+Math.sin(now*4)*.2;ctx.fillStyle='#C9A0E8';starPath(ctx,cx,cy,s*.3,5,.5);ctx.fill();ctx.stroke();txt(ctx,'؟',cx,cy+s*.03,Math.round(s*.3),INK,null,FONT_B);ctx.restore();}
    else{const k=((now+it.ph)%6.5);if(k<.6){const a=Math.sin(k/.6*P);ctx.fillStyle='rgba(255,255,255,'+a*.95+')';starPath(ctx,cx,cy,s*.22*a,4,.25);ctx.fill();}}}
  else{const w=s*.6,h=s*.45;ctx.save();ctx.translate(cx,cy);ctx.rotate(Math.sin(now*2+it.ph)*.08);
    ctx.fillStyle='rgba(255,197,49,.38)';circ(ctx,0,0,s*(.5+Math.sin(now*4)*.05));ctx.fill();
    ctx.fillStyle='#fff';ctx.fillRect(-w*.36,-h*.72,w*.68,h*.6);ctx.strokeRect(-w*.36,-h*.72,w*.68,h*.6);
    ctx.fillStyle='#F5B841';ctx.beginPath();ctx.moveTo(-w/2,-h/2);ctx.lineTo(-w*.12,-h/2);ctx.lineTo(0,-h*.36);ctx.lineTo(w/2,-h*.36);ctx.lineTo(w/2,h/2);ctx.lineTo(-w/2,h/2);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#E5484D';circ(ctx,w*.2,h*.12,s*.07);ctx.fill();ctx.restore();}
}
function drawLaser(x,y,s,onNow,now){
  const px=x*s,py=y*s+s*.5;
  if(onNow){ctx.save();ctx.shadowColor='#FF2D55';ctx.shadowBlur=s*.4;ctx.strokeStyle='rgba(255,45,85,.95)';ctx.lineWidth=Math.max(2,s*.09);ctx.beginPath();ctx.moveTo(px-1,py);ctx.lineTo(px+s+1,py);ctx.stroke();ctx.restore();
    ctx.strokeStyle='rgba(255,220,230,.9)';ctx.lineWidth=Math.max(1,s*.03);ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+s,py);ctx.stroke();}
  else{ctx.save();ctx.setLineDash([s*.08,s*.12]);ctx.strokeStyle='rgba(255,45,85,.35)';ctx.lineWidth=Math.max(1,s*.03);ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+s,py);ctx.stroke();ctx.restore();}
}
function drawCam(c,s,now){
  const px=c.x*s,py=c.y*s;ctx.save();ctx.translate(px,py);ctx.rotate(c.dir);ctx.lineWidth=Math.max(1.5,s*.05);ctx.strokeStyle=INK;
  ctx.fillStyle='#E9EEF2';rr(ctx,-s*.18,-s*.15,s*.5,s*.3,s*.06);ctx.fill();ctx.stroke();ctx.fillStyle=INK;circ(ctx,s*.32,0,s*.1);ctx.fill();ctx.fillStyle='#5EC8F7';circ(ctx,s*.32,0,s*.05);ctx.fill();
  ctx.restore();ctx.fillStyle=(now*2%1)<.5?'#E5484D':'#7A1E22';circ(ctx,px,py-s*.2,s*.05);ctx.fill();
}
function bubble(x,y,s,t,bg,maxW){
  const fs=Math.max(12,Math.round(s*.36));ctx.save();ctx.font='800 '+fs+'px '+FONT_B;ctx.direction='rtl';
  const lines=wrapText(t,Math.max(maxW||s*5.5,fs*11)),lh=fs*1.28,w=Math.max(fs*1.4,...lines.map(l=>ctx.measureText(l).width))+fs*.8,h=lh*lines.length+fs*.4;
  let bx=Math.max(-G.ox+4,Math.min(x-w/2,G.L.W*s+(vw-G.ox-G.L.W*s)-w-4));
  ctx.fillStyle=bg;ctx.strokeStyle=INK;ctx.lineWidth=Math.max(1.5,s*.05);rr(ctx,bx,y-h,w,h,Math.min(h*.4,s*.25));ctx.fill();ctx.stroke();
  ctx.beginPath();ctx.moveTo(x-s*.08,y-1);ctx.lineTo(x,y+s*.14);ctx.lineTo(x+s*.08,y-1);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillRect(x-s*.07,y-ctx.lineWidth-1,s*.14,ctx.lineWidth+1);
  ctx.fillStyle=(bg==='#fff'||bg==='#FFFBEA')?INK:'#fff';ctx.textAlign='center';ctx.textBaseline='middle';lines.forEach((l,i)=>ctx.fillText(l,bx+w/2,y-h+fs*.2+lh*(i+.5)));ctx.restore();
}
function wrapText(t,maxW){const words=t.split(' '),lines=[];let cur='';for(const w of words){const tt=cur?cur+' '+w:w;if(ctx.measureText(tt).width>maxW&&cur){lines.push(cur);cur=w;}else cur=tt;}if(cur)lines.push(cur);return lines;}
function thoughtBubble(x,y,s,text){
  const fs=Math.max(14,Math.round(s*.33));ctx.save();ctx.font='500 '+fs+'px '+FONT_T;ctx.direction='rtl';
  const lines=wrapText(text,Math.min(Math.max(s*6.2,fs*14),vw*.8)),lh=fs*1.45,w=Math.max(...lines.map(l=>ctx.measureText(l).width))+fs*1.2,h=lh*lines.length+fs*.8;
  const minX=-G.ox+6,maxX=vw-G.ox-6-w;let bx=Math.max(minX,Math.min(x-w/2,maxX)),by=y-h-s*.55;if(by<-G.oy+60)by=y+s*.9;
  ctx.fillStyle='#FFFBEA';ctx.strokeStyle=INK;ctx.lineWidth=Math.max(1.5,s*.045);
  ctx.beginPath();const r=Math.min(h*.5,s*.4);rr(ctx,bx,by,w,h,r);ctx.fill();ctx.setLineDash([s*.12,s*.08]);ctx.stroke();ctx.setLineDash([]);
  const dy=by<y?1:-1;for(let i=0;i<2;i++){circ(ctx,x+(bx+w/2-x)*.15*(1-i),(dy>0?by+h:by)+dy*s*(.16+i*.2),s*(.09-i*.03));ctx.fill();ctx.stroke();}
  ctx.fillStyle='#5A4A7A';ctx.textAlign='center';ctx.textBaseline='middle';lines.forEach((l,i)=>ctx.fillText(l,bx+w/2,by+fs*.4+lh*(i+.5)));ctx.restore();
}
function renderGame(){
  ctx.setTransform(dpr,0,0,dpr,0,0);
  const th=G.th,tk=G.tk;ctx.fillStyle=th.bg;ctx.fillRect(0,0,vw,vh);
  const s=G.s,L=G.L,now=performance.now()/1000,K=G.K;
  let sx=0,sy=0;if(G.shake>0){sx=(Math.random()-.5)*12*G.shake;sy=(Math.random()-.5)*12*G.shake;}
  ctx.save();ctx.translate(G.ox+sx,G.oy+sy);const X=x=>x*s,Y=y=>y*s;
  for(let y=0;y<L.H;y++)for(let x=0;x<L.W;x++)if(L.rows[y][x]!=='#')drawFloor(x,y,s,th,tk,L);
  const st=L.start,all=G.docsGot===G.docsTotal;
  ctx.fillStyle='#FFB3CB';ctx.strokeStyle=INK;ctx.lineWidth=2;rr(ctx,st.x*s+s*.08,st.y*s+s*.08,s*.84,s*.84,s*.2);ctx.fill();ctx.stroke();
  ctx.fillStyle='#FF4F86';ctx.font='800 '+Math.max(9,Math.round(s*.22))+'px '+FONT_B;ctx.textAlign='center';ctx.textBaseline='middle';ctx.direction='rtl';ctx.fillText('میز من',X(st.x+.5),Y(st.y+.5));
  if(all&&G.state==='play'){ctx.strokeStyle='#FF4F86';ctx.lineWidth=3;circ(ctx,X(st.x+.5),Y(st.y+.5),s*(.55+Math.sin(now*6)*.08));ctx.stroke();}
  if(G.ab==='paths'||G.ab==='all'){ctx.save();ctx.setLineDash([s*.12,s*.14]);ctx.lineWidth=Math.max(2,s*.06);ctx.strokeStyle='rgba(107,62,38,.5)';
    for(const w of G.workers){if(w.loop)for(const seg of w.loop){ctx.beginPath();seg.forEach((p,i)=>i?ctx.lineTo(X(p.x),Y(p.y)):ctx.moveTo(X(p.x),Y(p.y)));ctx.stroke();}
      else if(w.angles){ctx.beginPath();for(const a of w.angles){ctx.moveTo(X(w.x0),Y(w.y0));ctx.lineTo(X(w.x0+Math.cos(a)*1.6),Y(w.y0+Math.sin(a)*1.6));}ctx.stroke();}}
    ctx.restore();}
  if(G.escortPath&&G.state==='escort'){ctx.save();ctx.setLineDash([s*.1,s*.12]);ctx.lineDashOffset=-now*20;ctx.strokeStyle='#FF4F86';ctx.lineWidth=Math.max(2,s*.08);ctx.beginPath();ctx.moveTo(X(K.x),Y(K.y));for(const p of K.path)ctx.lineTo(X(p.x),Y(p.y));ctx.stroke();ctx.restore();}
  if(G.marker&&G.marker.t<.6){const m=G.marker,a=1-m.t/.6;ctx.strokeStyle='rgba(255,79,134,'+a+')';ctx.lineWidth=3;circ(ctx,X(m.x+.5),Y(m.y+.5),s*(.15+m.t*.5));ctx.stroke();}
  for(const t of L.laser){const x=t%L.W,y=(t/L.W)|0;drawLaser(x,y,s,laserOn(G,x,y,G.wt),now);}
  for(const it of G.items)if(!it.got)drawItem(it,s,now);
  for(const d of G.donuts){if(d.printer||d.inspect)continue;const cx=X(d.x),cy=Y(d.y);ctx.fillStyle='#E8A35C';ctx.strokeStyle=INK;ctx.lineWidth=2;circ(ctx,cx,cy,s*.2);ctx.fill();ctx.stroke();
    ctx.fillStyle='#FF7FA8';ctx.beginPath();ctx.arc(cx,cy,s*.16,P,TAU);ctx.fill();ctx.fillStyle=th.floorA;circ(ctx,cx,cy,s*.06);ctx.fill();ctx.stroke();
    if(d.t>0){ctx.fillStyle=th.floorA;ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,s*.23,-P/2,-P/2+TAU*d.t);ctx.closePath();ctx.fill();}}
  for(const p of G.phones){const cx=X(p.x)+Math.sin(now*60)*s*.03,cy=Y(p.y);ctx.fillStyle='#2D3748';rr(ctx,cx-s*.1,cy-s*.17,s*.2,s*.34,s*.04);ctx.fill();ctx.stroke();ctx.fillStyle='#7FD1F0';ctx.fillRect(cx-s*.07,cy-s*.12,s*.14,s*.22);
    ctx.strokeStyle='rgba(229,72,77,'+(1-p.t/3.6)+')';ctx.lineWidth=2;for(let i=1;i<=2;i++){const r=s*(.3+((now*2+i*.5)%1)*.4);ctx.beginPath();ctx.arc(cx,cy,r,0,TAU);ctx.stroke();}}
  for(const n of G.noises){const k=n.t/.9;ctx.strokeStyle='rgba(46,127,216,'+(1-k)*.8+')';ctx.lineWidth=Math.max(2,s*.08)*(1-k*.5);circ(ctx,X(n.x),Y(n.y),n.r*s*k);ctx.stroke();}
  for(const w of G.workers)if(w.radar&&w.radar.p>=0){const R=w.radar.range*w.radar.p;ctx.strokeStyle='rgba(255,255,255,'+(1-w.radar.p)*.9+')';ctx.lineWidth=s*.18;circ(ctx,X(w.x),Y(w.y),R*s);ctx.stroke();
    ctx.strokeStyle='rgba(54,169,133,'+(1-w.radar.p)*.6+')';ctx.lineWidth=s*.08;ctx.stroke();}
  const viewers=G.workers.concat(G.cams);
  for(const w of viewers){w.poly=conePoly(G,w);if(w.poly.length<3)continue;const ox=X(w.x),oy=Y(w.y),r=visionRange(G,w);
    ctx.beginPath();w.poly.forEach((p,i)=>i?ctx.lineTo(X(p[0]),Y(p[1])):ctx.moveTo(X(p[0]),Y(p[1])));ctx.closePath();
    const g=ctx.createRadialGradient(ox,oy,0,ox,oy,Math.max(1,r*s));
    const col=w.state==='eating'?'150,160,170':w.sees?'235,70,80':w.cam?'90,170,255':th.night?'255,236,170':(w.boss&&G.docsGot>0?'255,150,60':'255,205,50');
    g.addColorStop(0,'rgba('+col+','+(th.night?.35:.55)+')');g.addColorStop(1,'rgba('+col+',.12)');ctx.fillStyle=g;ctx.fill();}
  for(let y=0;y<L.H;y++)for(let x=0;x<L.W;x++){const ch=L.rows[y][x];if('#dpfxom!@'.includes(ch))drawBlock(ch,x,y,s,th,tk,L);}
  const kt=Math.floor(K.y)*L.W+Math.floor(K.x),inCl=L.hide.has(kt)&&!K.walking&&G.state!=='escort';
  for(const t of L.hide){const x=t%L.W,y=(t/L.W)|0;if(!(inCl&&t===kt))drawCloset(x,y,s,false,now);}
  for(const c of G.cams)drawCam(c,s,now);
  const kl=lookOf('kiana'),ents=[];
  ents.push({y:K.y,draw:()=>{
    if(inCl){drawCloset(Math.floor(K.x),Math.floor(K.y),s,true,now);return;}
    if(K.crawl){const k=K.crawl.t/K.crawl.dur,fx=k<.5?K.crawl.from:K.crawl.to;ctx.fillStyle='rgba(120,130,140,'+(.6*(1-Math.abs(k-.5)*2))+')';for(let i=0;i<3;i++){circ(ctx,X(fx.x)+Math.sin(now*9+i*2)*s*.25,Y(fx.y)-s*(.2+((now*1.5+i*.33)%1)*.5),s*(.08+i*.03));ctx.fill();}
      txt(ctx,'تق‌تق',X(K.crawl.to.x),Y(K.crawl.to.y)-s*.75,Math.round(s*.28),'#5F7383','#fff',FONT_B);return;}
    if(G.boxT>0){const cx=X(K.x),cy=Y(K.y)+s*.05,bob=K.walking?Math.abs(Math.sin(now*14))*s*.06:0;ctx.save();ctx.translate(cx,cy-bob);ctx.scale(s/24,s/24);ctx.translate(-12,-14);
      ctx.fillStyle='#C98B5A';ctx.strokeStyle=INK;ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(3,8);ctx.lineTo(12,4);ctx.lineTo(21,8);ctx.lineTo(21,19);ctx.lineTo(12,23);ctx.lineTo(3,19);ctx.closePath();ctx.fill();ctx.stroke();
      ctx.beginPath();ctx.moveTo(3,8);ctx.lineTo(12,12);ctx.lineTo(21,8);ctx.moveTo(12,12);ctx.lineTo(12,23);ctx.stroke();if(K.walking){ctx.fillStyle=INK;circ(ctx,8,15,1.2);ctx.fill();circ(ctx,16,15,1.2);ctx.fill();}ctx.restore();return;}
    const e=K.energy/K.max,carrying=G.docsGot>0&&G.docsGot<=G.docsTotal;
    drawPerson(ctx,X(K.x),Y(K.y)-s*.08,s*1.02,Object.assign({},kl,{dir:K.dir,walking:K.walking,t:K.t,mood:G.state==='escort'?'sad':K.energy<=0?'sleepy':(G.susp>.4?'shock':carrying?'smug':'normal'),
      mess:K.energy<=0?1:Math.max(0,.12+.6*(1-e/.4))*(e<.4?1:0)+.08,bird:K.energy<=0,held:carrying?'doc':null,arms:carrying?'hold':'down'}));}});
  for(const w of G.workers)ents.push({y:w.y,draw:()=>{if(w.boss){ctx.strokeStyle='rgba(229,72,77,'+(.5+Math.sin(now*5)*.3)+')';ctx.lineWidth=3;ell(ctx,X(w.x),Y(w.y)+s*.3,s*.45,s*.16);ctx.stroke();}
    drawPerson(ctx,X(w.x),Y(w.y)-s*.08,s*1.02,Object.assign({},PEOPLE[w.who],{dir:w.asleep?P/2:w.dir,walking:w.walking,t:w.t,seed:w.seed,mood:w.asleep?'sleepy':w.state==='eating'?'happy':w.sees?'shock':(w.lookT>0?'normal':(w.boss?'evil':'normal')),held:w.who==='guard'?'flashlight':null}));
    if(w.asleep){const zz=(now*.8)%1;ctx.globalAlpha=1-zz;txt(ctx,'z',X(w.x)+s*.3+zz*s*.2,Y(w.y)-s*.8-zz*s*.4,Math.round(s*.34),'#fff',INK,FONT_B);ctx.globalAlpha=1;}}});
  for(const f of G.friends)ents.push({y:f.y,draw:()=>{ctx.fillStyle='rgba(98,199,132,'+(.25+Math.sin(now*3)*.1)+')';ell(ctx,X(f.x),Y(f.y)+s*.3,s*.5,s*.18);ctx.fill();
    drawPerson(ctx,X(f.x),Y(f.y)-s*.08,s*1.02,Object.assign({},PEOPLE[f.who],{dir:Math.atan2(K.y-f.y,K.x-f.x),t:f.t,mood:'happy',held:'mop'}));}});
  ents.sort((a,b)=>a.y-b.y).forEach(e=>e.draw());
  ctx.restore();
  if(th.night){
    dctx.setTransform(1,0,0,1,0,0);dctx.clearRect(0,0,dk.width,dk.height);dctx.setTransform(dpr,0,0,dpr,0,0);
    dctx.globalCompositeOperation='source-over';dctx.fillStyle='rgba(6,4,22,.92)';dctx.fillRect(G.ox-2,G.oy-2,L.W*s+4,L.H*s+4);
    dctx.globalCompositeOperation='destination-out';dctx.save();dctx.translate(G.ox+sx,G.oy+sy);
    const nv=(G.ab==='nightvis'||G.ab==='all')?4.2:2.6,kx=X(K.x),ky=Y(K.y),g=dctx.createRadialGradient(kx,ky,s*.5,kx,ky,s*nv);g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(1,'rgba(0,0,0,0)');dctx.fillStyle=g;dctx.fillRect(kx-s*nv-s,ky-s*nv-s,s*(nv*2+2),s*(nv*2+2));
    for(const w of viewers){if(!w.poly||w.poly.length<3)continue;const ox=X(w.x),oy=Y(w.y),gg=dctx.createRadialGradient(ox,oy,0,ox,oy,Math.max(1,visionRange(G,w)*s));gg.addColorStop(0,'rgba(0,0,0,.95)');gg.addColorStop(1,'rgba(0,0,0,.35)');
      dctx.fillStyle=gg;dctx.beginPath();w.poly.forEach((p,i)=>i?dctx.lineTo(X(p[0]),Y(p[1])):dctx.moveTo(X(p[0]),Y(p[1])));dctx.closePath();dctx.fill();}
    for(const w of viewers){const ox=X(w.x),oy=Y(w.y),g2=dctx.createRadialGradient(ox,oy,0,ox,oy,s*.9);g2.addColorStop(0,'rgba(0,0,0,.8)');g2.addColorStop(1,'rgba(0,0,0,0)');dctx.fillStyle=g2;dctx.fillRect(ox-s,oy-s,s*2,s*2);}
    for(const t of L.laser){const x=t%L.W,y=(t/L.W)|0;if(laserOn(G,x,y,G.wt)){dctx.fillStyle='rgba(0,0,0,.6)';dctx.fillRect(X(x),Y(y)+s*.3,s,s*.4);}}
    dctx.restore();dctx.globalCompositeOperation='source-over';
    ctx.drawImage(dk,0,0,vw,vh);
    ctx.save();ctx.translate(G.ox+sx,G.oy+sy);
    for(const it of G.items)if(!it.got&&(it.kind==='doc'||it.kind==='key')){const k=(Math.sin(now*4+it.ph)+1)/2;ctx.fillStyle=it.kind==='doc'?'rgba(255,215,90,'+(.5+k*.5)+')':'rgba(255,140,190,'+(.5+k*.5)+')';starPath(ctx,X(it.x+.5),Y(it.y+.5),s*(.18+k*.08),4,.3);ctx.fill();}
    ctx.fillStyle='rgba(255,179,203,.6)';starPath(ctx,X(st.x+.5),Y(st.y+.5),s*.2,4,.3);ctx.fill();
    ctx.restore();
  }
  // bubbles, thoughts & particles (above darkness)
  ctx.save();ctx.translate(G.ox+sx,G.oy+sy);
  for(const w of G.workers){const bx=X(w.x),by=Y(w.y)-s*.95;
    if((G.state==='busted'||G.state==='caught')&&(G.bustBy===w||G.catchBy===w))bubble(bx,by,s*1.3,'!','#E5484D');
    else if(w.sees)bubble(bx,by,s,G.susp>.6?'!':'?',G.susp>.6?'#E5484D':'#E8873A');
    else if(w.state==='eating')bubble(bx,by,s,w.donut&&w.donut.inspect?'؟':w.donut&&w.donut.printer?'کاغذ...؟':'هام هام',w.donut&&w.donut.inspect?'#E8873A':'#fff');}
  for(const c of G.cams)if(c.sees||G.bustBy===c||G.catchBy===c)bubble(X(c.x),Y(c.y)-s*.4,s,'!','#E5484D');
  for(const sp of G.says){const w=sp.w;if(w.sees)continue;bubble(X(w.x),Y(w.y)-s*(w.big?1.15:1.0),s*.9,sp.text,'#fff',s*5);}
  if(K.energy<=0&&G.state==='play'&&G.boxT<=0){ctx.fillStyle=th.night?'#fff':'rgba(31,47,61,.7)';ctx.font='800 '+Math.round(s*.32)+'px '+FONT_B;ctx.textAlign='center';
    const zz=(now*.8)%1;ctx.globalAlpha=1-zz;ctx.fillText('z',X(K.x)+s*.3+zz*s*.2,Y(K.y)-s*.8-zz*s*.4);ctx.globalAlpha=1;}
  for(const p of G.parts){const a=1-p.t/1.1;ctx.globalAlpha=Math.max(0,a);ctx.font='800 '+Math.max(13,Math.round(s*.36))+'px '+FONT_B;ctx.textAlign='center';ctx.direction='rtl';
    ctx.lineWidth=4;ctx.strokeStyle='#fff';ctx.strokeText(p.txt,X(p.x),Y(p.y-p.t*.9));ctx.fillStyle=p.col;ctx.fillText(p.txt,X(p.x),Y(p.y-p.t*.9));ctx.globalAlpha=1;}
  if(G.thought&&G.state!=='brief')thoughtBubble(X(K.x),Y(K.y)-s*.7,s,G.thought.text);
  ctx.restore();
  if(G.frozen){ctx.fillStyle='rgba(120,180,255,.13)';ctx.fillRect(0,0,vw,vh);}
  if(G.susp>0){const g=ctx.createRadialGradient(vw/2,vh/2,Math.min(vw,vh)*.35,vw/2,vh/2,Math.max(vw,vh)*.75);g.addColorStop(0,'rgba(229,72,77,0)');g.addColorStop(1,'rgba(229,72,77,'+(Math.min(1,G.susp)*.45)+')');ctx.fillStyle=g;ctx.fillRect(0,0,vw,vh);}
}

/* ================= Backdrops ================= */
function renderTitle(t){
  ctx.setTransform(dpr,0,0,dpr,0,0);
  const W=Math.min(vw,560),st={x:(vw-W)/2,y:0,w:W,h:vh};
  drawBG(ctx,'street',vw,vh,st,t,{night:0});
  const s=W*.36,ky=vh*.86;
  drawPerson(ctx,vw/2-W*.17,ky,s,Object.assign({},lookOf('kiana'),{t,arms:'wave',mood:'happy',mess:.12+.12*Math.sin(t*.7)}));
  drawPerson(ctx,vw/2+W*.2,ky+4,s*.95,Object.assign({},lookOf('hiroman'),{t:t+1,arms:'hold',held:'cup',mood:'happy'}));
  drawBird(ctx,vw/2+Math.cos(t*.9)*W*.35,ky-s*1.25+Math.sin(t*1.8)*s*.15,s*.11,t,{fly:true,flip:Math.sin(t*.9)>0});
}
function renderMenuBG(t){
  ctx.setTransform(dpr,0,0,dpr,0,0);skyGrad(ctx,vw,vh,['#6CC8F5','#BDE8FF','#E8F7FF']);
  for(let i=0;i<5;i++)cloud(ctx,((hsh(i)*vw+t*10*(1+i*.3))%(vw+200))-100,vh*(.08+hsh(i+3)*.8),16+hsh(i+5)*16);
}
function drawPortraits(t){
  const playing=mode==='play'&&screenEl.hidden;
  for(const el of document.querySelectorAll('canvas.portrait')){
    if(playing&&el.id!=='bossPic')continue;
    if(!el.isConnected||el.offsetParent===null)continue;const r=el.getBoundingClientRect();if(!r.width)continue;const W=Math.round(r.width*2),H=Math.round(r.height*2);
    if(el.width!==W||el.height!==H){el.width=W;el.height=H;}
    const c=el.getContext('2d');c.clearRect(0,0,W,H);
    const who=lookOf(el.dataset.who);if(!who)continue;const mood=el.dataset.mood||'happy',full=el.dataset.full;
    if(full)drawPerson(c,W/2,H*.78,Math.min(W,H)*.72,Object.assign({},who,{dir:P/2,t,mood,arms:el.dataset.arms||'down',held:el.dataset.held||null,mess:+(el.dataset.mess||0)}));
    else drawPerson(c,W/2,H*.66,W*.72,Object.assign({},who,{dir:P/2,t,mood,mess:el.dataset.mess?+el.dataset.mess:.1,sugar:el.dataset.who==='katy'&&mood==='evil'}));
  }
}

/* ================= Title ================= */
function topChips(){return `<div class="chip">${IC.coin}<span>${fa(save.coins)}</span></div><div class="chip">${IC.starOn}<span>${fa(starTotal())}</span></div>`;}
function titleScreen(){
  G=null;SC=null;setMode('title');AUDIO.music('title');
  const cont=save.started;
  show(`<div class="tbar"><button class="round sm" id="tSet" aria-label="تنظیمات">${IC.gear}</button><div class="chips">${topChips()}</div></div>
    <h1 class="logo"><span class="k">کیانا کویین</span><span class="s">عملیات قهوه</span></h1>
    <div class="spacer"></div>
    <div class="menu">
      <button class="btn big" id="bPlay">${IC.play} ${cont?'ادامه‌ی ماجرا':'شروع ماجرا'}</button>
      <div class="tiles">
        <button class="tile" id="mLevels">${IC.map}<span>مرحله‌ها</span></button>
        <button class="tile" id="mWard">${IC.shirt}<span>کمد لباس</span></button>
        <button class="tile" id="mShop">${IC.bag}<span>فروشگاه</span></button>
        <button class="tile" id="mBoard">${IC.board}<span>تخته‌ی سرنخ</span></button>
        <button class="tile ${endlessOpen()?'':'lk'}" id="mEnd">${IC.car}<span>پیست بی‌نهایت</span>${endlessOpen()?'':'<em>'+IC.lock+'</em>'}</button>
      </div>
      
    </div>`,'title');
  on('#tSet',()=>settingsScreen(titleScreen));
  on('#bPlay',()=>{if(!save.started){save.started=true;persist();enterLevel(0);}else{const i=LEVELS.findIndex((l,i)=>unlocked(i)&&!(save.stars[i]>0));enterLevel(i<0?LEVELS.length-1:i);}});
  on('#mLevels',goTower);on('#mWard',()=>wardrobe(titleScreen));on('#mShop',()=>shopScreen(titleScreen));on('#mBoard',()=>boardScreen(titleScreen));on('#mEnd',()=>{if(!endlessOpen()){toast('بعد از اولین مرحله‌ی تعقیب (مرحله‌ی ۲۰) باز می‌شه!',true);return;}endlessScreen(titleScreen);});
}

/* ================= Settings ================= */
function settingsScreen(back){
  const row=(k,ic,label)=>`<label class="srow">${ic}<span>${label}</span><input type="checkbox" class="sw" data-k="${k}" ${save.set[k]?'checked':''}></label>`;
  show(`<div class="sheet"><h2 class="sh-t" id="setT">تنظیمات</h2>
    ${row('music',IC.music,'موسیقی')}${row('sfx',IC.speaker,'افکت‌های صوتی')}${row('voice',IC.talk,'صدای شخصیت‌ها')}
    ${save.set.test||save.devOn?`<div class="sdiv"></div>${row('test',IC.lock,'حالت تست: همه‌ی مرحله‌ها باز')}<p class="muted small">برای امتحان کردن؛ ستاره‌ها و سکه‌ها مثل همیشه حساب می‌شن.</p>`:''}
    <div class="sdiv"></div>
    <div class="sec-t">پشتیبان بازی</div>
    <p class="muted small">با «کد پشتیبان» اگه بازی پاک شد یا گوشی عوض کردی، همه‌ی پیشرفتت برمی‌گرده.</p>
    <div class="row2"><button class="btn alt" id="sExp">گرفتن کد</button><button class="btn alt" id="sImp">وارد کردن کد</button></div>
    <div class="sdiv"></div>
    <button class="btn alt danger-t" id="sReset">پاک کردن همه‌ی پیشرفت</button>
    <p class="muted small center">کیانا کویین · ساخته‌شده با عشق و قهوه</p>
    <button class="btn" id="sBack">برگرد</button></div>`,'over');
  for(const el of screenEl.querySelectorAll('.sw'))el.onchange=()=>{save.set[el.dataset.k]=el.checked;persist();applySettings();sfx('click');if(el.dataset.k==='music'&&el.checked)AUDIO.music(mode==='play'&&G?musicForLevel(G.def):'title');};
  let devN=0;const st=$('#setT');if(st)st.onclick=()=>{if(++devN>=7&&!save.devOn){save.devOn=1;persist();toast('حالت تست پیدا شد!',true);settingsScreen(back);}};
  on('#sBack',back);
  on('#sExp',()=>{persist();const code=saveCode();
    show(`<div class="sheet"><h2 class="sh-t">کد پشتیبان</h2>
      <p class="small">این کد رو کپی کن و یه جای امن نگهش دار؛ مثلاً «پیام‌های ذخیره‌شده»ی تلگرام. هر وقت لازم شد، از «وارد کردن کد» همه‌چی برمی‌گرده.</p>
      <textarea class="codebox" id="kCode" readonly dir="ltr" rows="5">${code}</textarea>
      <button class="btn gold" id="kCopy">کپی کد</button>
      <button class="btn" id="sBack">برگرد</button></div>`,'over');
    const ta=$('#kCode');ta.onfocus=()=>ta.select();
    on('#kCopy',()=>{const ok=()=>toast('کد کپی شد!',true),old=()=>{ta.focus();ta.select();try{document.execCommand('copy')?ok():toast('کد رو نگه دار و «کپی» رو بزن',true);}catch(e){}};
      try{navigator.clipboard.writeText(code).then(ok,old);}catch(e){old();}});
    on('#sBack',()=>settingsScreen(back));});
  on('#sImp',()=>{show(`<div class="sheet"><h2 class="sh-t">وارد کردن کد</h2>
      <p class="small">کد پشتیبانت رو این‌جا بچسبون. پیشرفت فعلی این گوشی جاش رو می‌گیره.</p>
      <textarea class="codebox" id="kIn" dir="ltr" rows="5" placeholder="KQ1-..."></textarea>
      <button class="btn gold" id="kGo">برگردون!</button>
      <button class="btn" id="sBack">برگرد</button></div>`,'over');
    on('#kGo',()=>{const s=readCode($('#kIn').value);if(!s){toast('این کد درست نیست؛ دوباره کامل کپی‌اش کن',true);return;}
      save=s;persist();applySettings();titleScreen();toast('پیشرفتت برگشت!',true);});
    on('#sBack',()=>settingsScreen(back));});
  on('#sReset',()=>{show(`<div class="sheet"><h2 class="sh-t">مطمئنی؟</h2><p class="center">همه‌ی ستاره‌ها، سکه‌ها، لباس‌ها و سرنخ‌ها پاک می‌شن و این کار برگشت‌پذیر نیست.</p>
    <button class="btn alt" id="rNo">نه، پشیمون شدم</button><button class="btn dangerb" id="rYes">آره، همه رو پاک کن</button></div>`,'over');
    on('#rNo',()=>settingsScreen(back));on('#rYes',()=>{const st=save.set;save=FRESH();save.set=st;persist();applySettings();titleScreen();toast('همه‌چی پاک شد',true);});});
}

/* ================= Tower (level select) ================= */
function goTower(){
  if(G&&G.chase&&CHASE)CHASE.stop();
  G=null;SC=null;setMode('tower');AUDIO.music('title');hud.classList.remove('chase');
  const cur=LEVELS.findIndex((l,i)=>unlocked(i)&&!(save.stars[i]>0));
  const chHtml=CHAPTERS.map((ch,ci)=>{
    const idxs=LEVELS.map((l,i)=>l.ch===ci?i:-1).filter(i=>i>=0);if(!idxs.length)return'';
    const open=unlocked(idxs[0]);
    const nodes=idxs.slice().reverse().map((i,k)=>{const l=LEVELS[i],st=save.stars[i]||0,un=unlocked(i),boss=!!l.boss,chs=!!l.chase;
      const tag=chs?'':l.mode==='timed'?IC.clock:l.mode==='freeze'?IC.snow:l.night?IC.moon:'';
      const stars=[0,1,2].map(n=>n<st?IC.starOn:IC.starOff).join('');
      const pos=['p1','p2','p3','p2'][k%4];
      return `<button class="node ${pos} ${boss?'boss':''} ${chs?'chase':''} ${un?'':'locked'} ${i===cur?'cur':''}" data-i="${i}" ${un?'':'disabled'} aria-label="مرحله‌ی ${fa(i+1)}">
        ${boss?`<canvas class="portrait" data-who="${l.boss.who}" data-mood="${un?'evil':'normal'}"></canvas>`:chs?`<span class="veh">${l.chase.vehicle==='moto'?IC.moto:IC.car}</span><span class="num sm">${fa(i+1)}</span>`:`<span class="num">${fa(i+1)}</span>`}
        ${un?'':`<span class="lk">${IC.lock}</span>`}${tag?`<span class="tag">${tag}</span>`:''}${save.beans[i]?`<span class="bn">${IC.bean}</span>`:''}${save.secrets[i]?`<span class="sc">${IC.secret}</span>`:''}
        <span class="st">${stars}</span></button>`;}).join('');
    return `<section class="floor ${open?'':'dim'}" style="--fc:${ch.color}">
      <div class="fl-head"><span class="fl-n">${ch.title}</span><span class="fl-s">${ch.sub}</span></div>
      <div class="fl-body">${nodes}</div></section>`;}).reverse().join('');
  show(`<div class="topbar">
      <button class="round sm" id="tHome" aria-label="خانه">${IC.home}</button>
      <div class="chip">${IC.coin}<span>${fa(save.coins)}</span></div>
      <div class="chip">${IC.starOn}<span>${fa(starTotal())}/${fa(LEVELS.length*3)}</span></div>
      <div class="chip">${IC.bean}<span>${fa(beanCount())}/${fa(BEANS_NEED)}</span></div>
      <button class="round sm" id="tShop" aria-label="فروشگاه">${IC.bag}</button></div>
    <div class="tower">
      <div class="roof">${starTotal()>=LEVELS.length*3?fa(LEVELS.length*3)+' ستاره! تو واقعاً ملکه‌ای!':'نوک قوری: ؟؟؟'}</div>
      ${chHtml}
      <div class="ground"><canvas class="logo-c" width="120" height="120"></canvas><span>${BANK.name}</span><small>${BANK.slogan}</small></div></div>`,'towerScreen');
  const lc=screenEl.querySelector('.logo-c');if(lc){const c=lc.getContext('2d');drawBankLogo(c,60,70,34,0,{noZ:true});}
  on('#tHome',titleScreen);
  on('#tShop',()=>shopScreen(goTower));
  for(const b of screenEl.querySelectorAll('.node'))b.onclick=()=>{sfx('click');enterLevel(+b.dataset.i,{replay:save.stars[+b.dataset.i]>0});};
  const c=screenEl.querySelector('.node.cur')||screenEl.querySelector('.node:not(.locked)');
  if(c)setTimeout(()=>c.scrollIntoView({block:'center',behavior:'instant'}),30);
}

/* ================= Shop ================= */
function shopRows(only){
  return ['donut','phone','box'].filter(k=>!only||k===only).map(k=>{const g=GADGETS[k],open=gadgetOpen(k);
    return `<div class="card shop ${open?'':'lockd'}">${IC[k]}<div class="grow"><b>${g.name}</b><div class="muted">${open?g.desc:'از مرحله‌ی '+fa(g.from+1)+' باز می‌شه'}</div><div class="have">داری: <span id="n_${k}">${fa(save.gadgets[k])}</span></div></div>
    ${open?`<button class="btn gold buy" data-k="${k}">${IC.coin}${fa(g.price)}</button>`:`<span class="lockic">${IC.lock}</span>`}</div>`;}).join('');
}
function wireShop(){
  const upd=()=>{for(const b of screenEl.querySelectorAll('.buy')){b.disabled=save.coins<GADGETS[b.dataset.k].price;}const w=$('#wal');if(w)w.textContent=fa(save.coins);};upd();
  for(const b of screenEl.querySelectorAll('.buy'))b.onclick=()=>{const k=b.dataset.k,p=GADGETS[k].price;if(save.coins<p){sfx('error');return;}save.coins-=p;save.gadgets[k]++;persist();sfx('buy');$('#n_'+k).textContent=fa(save.gadgets[k]);upd();if(G)updateHud();};
}
function shopScreen(back){
  show(`<div class="sheet"><h2 class="sh-t">کارگاه نخود</h2><p class="muted center">ابزارهای جاسوسی اختراع نخود. قهوه رو هم هر صبح توی کافه هیرومن می‌خری.</p>
    <div class="chip wallet">${IC.coin}<span id="wal">${fa(save.coins)}</span><span>سکه</span></div>
    ${shopRows()}
    <div class="card shop">${IC.bean}<div class="grow"><b>قهوه‌ی طلایی</b><div class="muted">${beanCount()>=BEANS_NEED?'باز شد! صبح‌ها از هیرومن بخواه.':'با جمع کردن '+fa(BEANS_NEED)+' دونه‌ی طلایی باز می‌شه ('+fa(beanCount())+'/'+fa(BEANS_NEED)+')'}</div></div></div>
    <p class="muted small center">ابزاری که استفاده کنی و بازنده بشی، بهت پس داده می‌شه.</p>
    <button class="btn" id="sBack">برگرد</button></div>`,'over');
  wireShop();on('#sBack',back);
}
function quickShop(k){
  if(!G)return;const prev=G.state;G.state='paused';
  show(`<div class="sheet"><h2 class="sh-t">${GADGETS[k].name} نداری!</h2>
    <div class="chip wallet">${IC.coin}<span id="wal">${fa(save.coins)}</span><span>سکه</span></div>
    ${shopRows(k)}<button class="btn" id="qBack">برگرد به بازی</button></div>`,'over');
  wireShop();on('#qBack',()=>{hideScreen();G.state=prev==='paused'?'play':prev;updateHud();});
}

/* ================= Pause ================= */
function pauseMenu(){
  if(!G)return;G.state='paused';G.placing=null;$('#hHint').classList.add('off');
  const ch=G.chase&&G.started&&CHASE;if(ch)CHASE.pause(true);
  show(`<div class="sheet"><h2 class="sh-t">استراحت قهوه</h2>
    <div class="pz-name">${G.def.name}${G.endless?'':' · مرحله‌ی '+fa(G.idx+1)}</div>${goalsHtml(G.def)}
    <button class="btn big" id="pRes">${IC.play} ادامه</button>
    <div class="row2"><button class="btn alt" id="pRe">${IC.restart} از اول</button><button class="btn alt" id="pShop">${IC.bag} فروشگاه</button></div>
    <div class="row2"><button class="btn alt" id="pSet">${IC.gear} تنظیمات</button><button class="btn alt" id="pQuit">${IC.home} برج</button></div></div>`,'over');
  on('#pRes',()=>{hideScreen();G.state='play';if(ch)CHASE.pause(false);});
  on('#pRe',()=>{refundUsed();if(ch)CHASE.stop();if(G.endless)startEndless(G.def.chase.vehicle);else startLevel(G.idx,G.coffeeKey);});
  on('#pShop',()=>shopScreen(pauseMenu));
  on('#pSet',()=>settingsScreen(pauseMenu));
  on('#pQuit',()=>{refundUsed();if(ch)CHASE.stop();const e=G.endless;G=null;if(e)endlessScreen(titleScreen);else goTower();});
}

/* ================= Wardrobe ================= */
let wardWho='kiana',wardTry=null;
const optInfo=o=>({v:String(o[0]),lab:o[1],need:o[2]||0,price:o[3]?Math.max(5,Math.round(o[3]*.6/5)*5):0});
const ownKey=(who,k,v)=>who+'.'+k+'.'+v;
function wardrobe(back){
  setMode('tower');
  const tabs=`<div class="wtabs w3"><button class="${wardWho==='kiana'?'on':''}" id="wK">کیانا</button><button class="${wardWho==='hiroman'?'on':''}" id="wH">هیرومن</button><button class="${wardWho==='garage'?'on':''}" id="wG">گاراژ</button></div>`;
  if(wardWho==='garage'){
    show(`<div class="sheet ward">${tabs}<div class="row"><span class="muted small">ماشین و موتورت رو انتخاب کن؛ توی مرحله‌های تعقیب و پیست بی‌نهایت سوارشون می‌شی.</span><span class="chip">${IC.coin}<span>${fa(save.coins)}</span></span></div>${garageHtml()}<button class="btn" id="wBack">برگرد</button></div>`,'over');
    on('#wK',()=>{wardWho='kiana';wardrobe(back);});on('#wH',()=>{wardWho='hiroman';wardrobe(back);});on('#wBack',back);wireGarage(back);return;}
  const L=LOOKS[wardWho]||{},cur=save.look[wardWho]||{},stars=starTotal();
  LOOK_CHOICE[wardWho]=Object.assign({},cur,wardTry?{[wardTry.k]:wardTry.v}:{});
  const cats=Object.entries(L).map(([k,cat])=>{
    const base=PEOPLE[wardWho][k];const sel=String(wardTry&&wardTry.k===k?wardTry.v:cur[k]!=null?cur[k]:base!=null?base:cat.opts[0][0]);
    return `<div class="wcat"><b>${cat.label}</b><div class="wopts">${cat.opts.map(o=>{const q=optInfo(o),lock=stars<q.need,own=!q.price||save.owned[ownKey(wardWho,k,q.v)];
      return `<button class="wopt ${cat.swatch?'swt':''} ${q.v===sel?'sel':''} ${lock?'lk':''} ${!lock&&!own?'buy':''}" data-k="${k}" data-v="${q.v}" ${cat.swatch?`style="--sw:${q.v}"`:''} aria-label="${q.lab}">
        ${cat.swatch?'':`<span>${q.lab}</span>`}${lock?`<em>${IC.starOn}${fa(q.need)}</em>`:!own?`<em class="pr">${IC.coin}${fa(q.price)}</em>`:''}</button>`;}).join('')}</div></div>`;}).join('');
  let bar='';
  if(wardTry){const q=wardTry.q;bar=`<div class="trybar"><span>«${q.lab}» رو پوشیدی!</span><div class="row2"><button class="btn gold" id="wBuy" ${save.coins<q.price?'disabled':''}>${IC.coin} بخر (${fa(q.price)})</button><button class="btn alt" id="wUndo">درش بیار</button></div></div>`;}
  show(`<div class="sheet ward">${tabs}
    <div class="wprev"><canvas class="portrait" data-full="1" data-who="${wardWho}" data-mood="happy" data-arms="${wardWho==='kiana'?'wave':'hold'}" ${wardWho==='hiroman'?'data-held="cup"':''}></canvas>
    <div class="chip">${IC.starOn}<span>${fa(stars)}</span></div><div class="chip coins">${IC.coin}<span>${fa(save.coins)}</span></div></div>
    ${bar}
    <p class="muted small center">با ستاره‌ها لباس‌های تازه باز می‌شن؛ بعضی‌ها رو هم باید با سکه بخری. اول امتحانش کن!</p>
    ${cats}<button class="btn" id="wBack">برگرد</button></div>`,'over');
  const leave=f=>()=>{wardTry=null;applySettings();f();};
  on('#wK',()=>{wardTry=null;applySettings();wardWho='kiana';wardrobe(back);});on('#wH',()=>{wardTry=null;applySettings();wardWho='hiroman';wardrobe(back);});on('#wG',()=>{wardTry=null;applySettings();wardWho='garage';wardrobe(back);});on('#wBack',leave(back));
  on('#wUndo',()=>{wardTry=null;applySettings();wardrobe(back);});
  on('#wBuy',()=>{const t=wardTry;if(!t||save.coins<t.q.price){sfx('error');return;}save.coins-=t.q.price;save.owned[ownKey(wardWho,t.k,t.v)]=1;save.look[wardWho][t.k]=t.v;wardTry=null;persist();applySettings();sfx('buy');toast('مال خودت شد!');wardrobe(back);});
  for(const b of screenEl.querySelectorAll('.wopt'))b.onclick=()=>{const k=b.dataset.k,cat=L[k],q=optInfo(cat.opts.find(o=>String(o[0])===b.dataset.v));
    if(stars<q.need){sfx('error');toast('برای این '+fa(q.need)+' ستاره لازمه',true);return;}
    const y=screenEl.scrollTop;
    if(q.price&&!save.owned[ownKey(wardWho,k,q.v)]){wardTry={k,v:q.v,q};sfx('pop');wardrobe(back);screenEl.scrollTop=0;return;}
    wardTry=null;save.look[wardWho][k]=q.v;persist();applySettings();sfx('pop');wardrobe(back);screenEl.scrollTop=y;};
}

/* ================= Clue board ================= */
function boardScreen(back,tab){
  setMode('tower');tab=tab||'clues';
  const cards=LEVELS.map((l,i)=>save.clues[i]?`<button class="bcard" data-i="${i}" style="--r:${((hsh(i)-.5)*6).toFixed(1)}deg"><span class="pin"></span><em>${fa(i+1)}</em><b>${l.clue.title}</b></button>`:`<div class="bcard empty" style="--r:${((hsh(i)-.5)*6).toFixed(1)}deg"><em>${fa(i+1)}</em><b>؟</b></div>`).join('');
  const secs=LEVELS.map((l,i)=>!l.secret?'':save.secrets[i]?`<div class="card sec"><b>${IC.secret}${l.secret.title}</b><p>${l.secret.text}</p><span class="muted small">مرحله‌ی ${fa(i+1)}</span></div>`:`<div class="card sec lockd"><b>${IC.lock} راز مرحله‌ی ${fa(i+1)}</b></div>`).join('');
  show(`<div class="sheet board"><h2 class="sh-t">تخته‌ی کارآگاهی</h2>
    <div class="wtabs"><button class="${tab==='clues'?'on':''}" id="bt1">سرنخ‌ها ${fa(Object.keys(save.clues).length)}/${fa(LEVELS.length)}</button><button class="${tab==='secrets'?'on':''}" id="bt2">رازها ${fa(secretCount())}/${fa(secretTotal())}</button></div>
    ${tab==='clues'?`<div class="cork">${cards}</div>`:`<div class="secs">${secs}</div>`}
    <button class="btn" id="bBack">برگرد</button></div>`,'over');
  on('#bt1',()=>boardScreen(back,'clues'));on('#bt2',()=>boardScreen(back,'secrets'));on('#bBack',back);
  for(const b of screenEl.querySelectorAll('.bcard[data-i]'))b.onclick=()=>{sfx('paper');clueScreen(+b.dataset.i,()=>boardScreen(back,'clues'),true);};
}

/* ================= Clue folder (must-read presentation) ================= */
function clueScreen(i,then,review){
  setMode('tower');const c=LEVELS[i].clue,doc=c.doc||c.text||'',note=c.note||'';
  show(`<div class="folder ${review?'still':''}"><div class="ftab">پرونده‌ی ${fa(i+1)}</div><div class="stamp">محرمانه</div>
    <div class="paper">${c.who?`<canvas class="portrait sm" data-who="${c.who}" data-mood="${c.who==='hiroman'?'sad':'smug'}"></canvas>`:''}
      <h3>${c.title}</h3><p id="clueText" class="doc"></p></div>
    ${note?`<div class="knote ${review?'on':''}" id="kNote"><canvas class="portrait sm" data-who="kiana" data-mood="smug"></canvas><div><b>کیانا با خودش:</b><p class="thinkf">${note}</p></div></div>`:''}
    ${c.next?`<div class="nextdest ${review?'on':''}" id="nDest"><span>مقصد بعدی</span><b>${c.next}</b></div>`:''}</div>
    <button class="btn big ${review?'':'hide'}" id="cPin">${review?'برگرد':'ادامه'}</button>`,'over cluescr');
  const el=$('#clueText');let k=0,timer=null,done=false;
  const finish=()=>{if(done)return;done=true;clearInterval(timer);el.textContent=doc;
    const kn=$('#kNote'),nd=$('#nDest');setTimeout(()=>{if(kn){kn.classList.add('on');AUDIO.voice('kiana','آ',{think:true});}},250);setTimeout(()=>{if(nd)nd.classList.add('on');$('#cPin').classList.remove('hide');},note?900:300);};
  const startType=()=>{if(done)return;timer=setInterval(()=>{k+=2;el.textContent=doc.slice(0,k);if(k%4===0)AUDIO.voice('narrator',doc[k]||'',{});if(k>=doc.length)finish();},36);};
  if(review){el.textContent=doc;done=true;}else{setTimeout(()=>{sfx('stamp');const f=screenEl.querySelector('.folder');if(f)f.classList.add('stamped');},500);setTimeout(()=>{sfx('paper');startType();},950);}
  screenEl.querySelector('.folder').onclick=finish;
  on('#cPin',()=>{if(review){then();return;}if(!done)return finish();sfx('pin');save.clues[i]=1;persist();screenEl.querySelector('.folder').classList.add('fly');$('#cPin').classList.add('hide');setTimeout(then,650);});
}
function meetScene(i){
  const def=LEVELS[i],lines=def.clue.meet,n=Object.keys(save.clues).length,noHome=CHAPTERS[def.ch].noHome;
  const sc=def.chase?talkScene(lines,null,'road',{night:!def.chase.dawn,dawn:!!def.chase.dawn}):noHome?talkScene(lines,levelTheme(def),'office',{theme:levelTheme(def)}):talkScene(lines,null,'cafe',{night:1,board:n,fresh:true});
  sc.beats.unshift({say:['narrator',def.chase?'کنار جاده. موتورها هنوز داغن. یه جلسه‌ی سرپایی.':noHome?pick('meetT',['یه گوشه‌ی تاریک، پشت راه‌پله. جلسه‌ی فوری.','پشت یه ستون، دور از چراغ‌قوه‌ها. یه جلسه‌ی یواشکی.','کنار دریچه‌ی تهویه. همه سرها نزدیک هم.']):pick('meetD',['شب. کافه هیرومن. جلسه‌ی کارآگاهی دور تخته‌ی سرنخ‌ها.','کرکره‌ی کافه پایینه، ولی چراغ‌ها روشن. جلسه‌ی شبانه!','بوی قهوه، صدای گچ روی تخته. وقت جلسه‌ست.'])]});
  sc.music=noHome?'night':'cafe';
  for(const id in sc.actors)sc.actors[id].y=.74;
  return sc;
}

/* ================= Day flow ================= */
function runSteps(steps){let i=0;const next=()=>{const f=steps[i++];if(f)f(next);};next();}
function enterLevel(i,opt){
  opt=opt||{};const def=LEVELS[i],ch=CHAPTERS[def.ch],first=LEVELS.findIndex(l=>l.ch===def.ch)===i;
  hideScreen();if(G&&G.chase&&CHASE)CHASE.stop();G=null;hud.classList.remove('chase');
  let coffee=null;const steps=[];
  const scene=(key,n)=>{const fin=()=>{save.seen[key]=1;persist();n();};if(SCENES[key])playScene(SCENES[key],fin);else fin();};
  if(first&&!save.seen[ch.intro])steps.push(n=>{if(ch.intro==='prologue')coffee='drip';scene(ch.intro,n);});
  if(def.preScene&&!save.seen[def.preScene])steps.push(n=>scene(def.preScene,n));
  if(def.bossIntro&&!save.seen[def.bossIntro])steps.push(n=>scene(def.bossIntro,n));
  steps.push(n=>{if(coffee)return n();(ch.noHome?helperMorning:morning)(i,k=>{coffee=k;n();});});
  if(!ch.noHome&&!def.chase)steps.push(n=>playScene(toWorkScene(def),n));
  if(def.pre&&!save.seen['pre'+i])steps.push(n=>{save.seen['pre'+i]=1;persist();
    const sc=def.chase?talkScene(def.pre,null,'street',{night:def.chase.night||ch.noHome?1:0}):talkScene(def.pre,levelTheme(def));playScene(sc,n);});
  if(def.boss)steps.push(n=>bossCard(def,n));
  steps.push(()=>startLevel(i,coffee||'drip'));
  runSteps(steps);
}
function toWorkScene(def){
  const th=levelTheme(def);
  return{bg:'street',bgo:{night:0},label:LOC_THEME[th]||'بلاف بانک',music:null,actors:{kiana:{who:'kiana',x:-.15,y:.82,s:.3,mood:'smug',arms:'down',sparkle:true}},
    beats:[{d:1.9,to:{kiana:{x:1.2}},fx:[['speed',.5,.5]],hold:0}]};
}
function bossCard(def,next){
  setMode('tower');AUDIO.music('boss');
  show(`<div class="bosscard"><span class="rib">غول مرحله!</span>
    <canvas class="portrait big" data-who="${def.boss.who}" data-mood="evil"></canvas>
    <span class="bw">${PEOPLE[def.boss.who].name}</span><h2>«${def.boss.title}»</h2><p>${def.boss.desc}</p>
    <button class="btn" id="bcGo">بزن بریم!</button></div>`,'over bossScreen');
  sfx('sting');on('#bcGo',next);
}
const GREET=['صبح بخیر ملکه! امروز موهات شبیه جوجه‌تیغی شده.','سلام کیانا! فندق امروز توی موهات آواز می‌خونه؟','باز هم صبح، باز هم چشم‌های نیمه‌باز. بیا، قهوه‌ات آماده‌ست.',
  'صبح بخیر! نخود دیشب یه اختراع جدید منفجر کرد. باز.','سلام ملکه! امروز یه حسی دارم که روز بزرگیه.','کیانا، جوراب‌هات لنگه‌به‌لنگه‌ست. نه، یکیش دستکشه!',
  'به‌به! ملکه‌ی خواب‌آلود تشریف آوردن. فرش قرمز نداریم، ولی قهوه داریم.','صبح بخیر! امروز تاجت کجه. نه، اون‌ور... آهان، حالا شد.','اومدی؟ دستگاه قهوه از دیشب منتظرته. منم همین‌طور!',
  'سلام! امروز یه شوخی جدید یاد گرفتم... نه، اول قهوه، بعد شوخی.','کیانا! فندق امروز زودتر از تو بیدار شده بود. خجالت داره!','صبح بخیر قهرمان! پرونده‌ی امروز چیه؟'];
const KIANA_AM=['قـــهـوه...','زامبی‌ام. قهوه بده.','من... کی‌ام؟ آهان، کیانا. قهوه.','چشمام هنوز خوابن. فقط دهنم بیداره.','صبح... چرا صبح انقدر زود میاد؟',
  'سلام... قهوه... بعداً حرف می‌زنیم.','مغزم هنوز روی حالت پرواز گیر کرده.','امروز هم زنده‌ام. به لطف قهوه‌ای که هنوز نخوردم.','ه‌ی‌ر‌و‌م‌ن... ق‌ه‌و‌ه...','یه نفر فندقو از تو موهام برداره!'];
const MISS=['هیچ قهوه‌ای مثل قهوه‌ی هیرومن نیست... ولی فعلاً همینم غنیمته.','دلم برای «صبح بخیر ملکه»‌ی هیرومن تنگ شده.','خوشمزه‌ست... ولی هیرومن یه چیزی توش می‌ریخت که اسمش مهربونی بود.','با هر قلپ، یه طبقه بالاتر. دارم میام هیرومن.','هیرومن الان کجاست؟ یعنی کسی بهش قهوه داده؟'];
const NEWCF=['امروز یه قهوه‌ی جدید دارم: «%n»! %d','تازه‌ترین اختراع کافه: «%n»! %d','بو کن! «%n». %d'];
/* actor for an extra speaker in the café */
function addCafeActor(actors,who){if(actors[who]||who==='kiana'||who==='narrator'||!PEOPLE[who])return;
  const slots=[[.9,.72,11],[.12,.74,11],[.55,.74,12]],n=Object.keys(actors).length-2,sl=slots[Math.max(0,Math.min(2,n))];
  actors[who]={who,x:sl[0],y:sl[1],s:PEOPLE[who].kid?.3:.34,mood:'happy',z:sl[2],held:who==='golab'?'mop':who==='saadi'?'flashlight':null};}
function morning(i,done){
  const def=LEVELS[i];
  const newCf=Object.keys(COFFEES).filter(k=>!COFFEES[k].beans&&COFFEES[k].from<=i&&!save.cfSeen[k]&&COFFEES[k].from>0);
  const goldNew=beanCount()>=BEANS_NEED&&!save.cfSeen.gold;
  const gift=def.gift&&!save.gifts[i],giver=def.giftFrom||'hiroman';
  const actors={hiroman:{who:'hiroman',x:.72,y:.6,s:S,mood:'happy',z:0},kiana:{who:'kiana',x:-.25,y:.68,s:S,mood:'sleepy',mess:1,bird:true,arms:'zombie',zzz:true,z:2}};
  if(gift&&giver!=='hiroman')addCafeActor(actors,giver);
  const quick=!!(def.chase&&def.preScene);if(quick)Object.assign(actors.kiana,{mood:'smug',mess:0,bird:false,arms:'down',zzz:false});
  const beats=quick?[{d:.9,to:{kiana:{x:.3}},hold:.05}]:[{d:1.1,to:{kiana:{x:.3}},hold:.05},{say:['kiana',pick('am',KIANA_AM)]}];
  const firstTime=!save.seen['cafe'+i];
  if(quick){}
  else if(def.cafe&&firstTime)def.cafe.forEach(l=>{addCafeActor(actors,l[0]);const b={say:[l[0],l[1],l[3]]};if(l[0]!=='narrator')b.set={[l[0]]:{mood:l[2]==='sweat'?'sad':(l[2]||'happy'),sweat:l[2]==='sweat'}};beats.push(b);});
  else beats.push({say:['hiroman',pick('greet',GREET)],set:{hiroman:{arms:'wave'}}},{set:{hiroman:{arms:'down'}},d:.01});
  for(const k of newCf)beats.push({say:['hiroman',pick('newcf',NEWCF).replace('%n',COFFEES[k].name).replace('%d',COFFEES[k].desc)],set:{hiroman:{mood:'excited',held:'cup',arms:'hold'}},fx:[['sfx','magic']]},{set:{hiroman:{held:null,arms:'down',mood:'happy'}},d:.01});
  if(goldNew)beats.push({say:['hiroman',fa(BEANS_NEED)+' دونه‌ی طلایی! بالاخره می‌تونم برات «قهوه‌ی طلایی» افسانه‌ای رو دم کنم!'],set:{hiroman:{mood:'love'}},fx:[['sfx','fanfare'],['confetti',.5,.2]]});
  if(gift){const k=Object.keys(def.gift)[0],g=GADGETS[k];
    if(giver!=='hiroman'&&actors[giver])beats.push({d:.6,to:{[giver]:{x:.88}}},{say:[giver,(giver==='nokhod'?'کیانا! کیانا! اختراع جدیدمو ببین: «':'اینو برات آوردم: «')+g.name+'»! '+g.desc],set:{[giver]:{arms:'up'}}});
    else beats.push({say:['hiroman','اینا رو هم بگیر: «'+g.name+'». '+g.desc],set:{hiroman:{held:'tray',arms:'hold'}}});
    beats.push({d:.3,fx:[['sfx','unlock'],['boom',.5,.25,g.name+' ×'+fa(def.gift[k])]],set:{hiroman:{held:null,arms:'down'},...(actors[giver]&&giver!=='hiroman'?{[giver]:{arms:'down'}}:{})},hold:.6});}
  save.seen['cafe'+i]=1;for(const k of newCf)save.cfSeen[k]=1;if(goldNew)save.cfSeen.gold=1;
  if(gift){save.gifts[i]=1;for(const k in def.gift)save.gadgets[k]=(save.gadgets[k]||0)+def.gift[k];}persist();
  playScene({bg:'cafe',music:'cafe',stay:true,actors,beats},null);
  const check=setInterval(()=>{if(!SC||SC.done){clearInterval(check);return;}if(SC.idle){clearInterval(check);coffeePanel(i,done,{giver:'hiroman'});}},80);
}
/* ch4–ch5: no café. A friend brings coffee on this floor. */
function helperMorning(i,done){
  const def=LEVELS[i],h=def.helper||{who:'golab',coffees:['drip'],line:'بیا دخترم، اینو بخور جون بگیری.'},who=PEOPLE[h.who]?h.who:'golab',th=levelTheme(def);
  const actors={kiana:{who:'kiana',x:-.25,y:.72,s:S,mood:'sleepy',mess:.6,arms:'down',z:2},
    [who]:{who,x:1.25,y:.72,s:PEOPLE[who].kid?.3:S,mood:'happy',z:2,held:who==='saadi'?'flashlight':'cup',arms:'hold'}};
  const newCf=Object.keys(COFFEES).filter(k=>!COFFEES[k].beans&&COFFEES[k].from<=i&&!save.cfSeen[k]&&(h.coffees||[]).includes(k));
  const beats=[{d:.9,to:{kiana:{x:.3},[who]:{x:.7}},hold:.05},{say:[who,h.line],set:{[who]:{mood:'happy'}}}];
  for(const k of newCf)beats.push({say:[who,'اینو ببین: «'+COFFEES[k].name+'»! '+COFFEES[k].desc],set:{[who]:{mood:'excited'}},fx:[['sfx','magic']]});
  if(who!=='hiroman'&&i<42&&!save.seen['miss'+i]&&(i%2===0||!save.seen.missOnce)){save.seen.missOnce=1;beats.push({say:['kiana',pick('miss',MISS),'think'],set:{kiana:{mood:'sad'}}});}
  save.seen['miss'+i]=1;for(const k of newCf)save.cfSeen[k]=1;
  const gift=def.gift&&!save.gifts[i];
  if(gift){const k=Object.keys(def.gift)[0],g=GADGETS[k];if(!def.giftFrom||def.giftFrom===who)beats.push({say:[who,'اینم بگیر: «'+g.name+'». '+g.desc]});beats.push({d:.3,fx:[['sfx','unlock'],['boom',.5,.25,g.name+' ×'+fa(def.gift[k])]],hold:.5});
    save.gifts[i]=1;for(const kk in def.gift)save.gadgets[kk]=(save.gadgets[kk]||0)+def.gift[kk];}
  persist();
  const hbg=def.chase?(def.chase.dawn?'road':'garage'):'office',hbo=def.chase?{dawn:!!def.chase.dawn,night:!def.chase.dawn}:{theme:th};
  playScene({bg:hbg,bgo:hbo,music:'night',stay:true,actors,beats},null);
  const check=setInterval(()=>{if(!SC||SC.done){clearInterval(check);return;}if(SC.idle){clearInterval(check);coffeePanel(i,done,{giver:who,list:h.coffees});}},80);
}
function coffeePanel(i,done,opt){
  opt=opt||{};const def=LEVELS[i],giver=opt.giver||'hiroman';
  let keys=Object.keys(COFFEES).filter(k=>(coffeeOpen(k)||k==='gold')&&(!opt.list||opt.list.includes(k)||k==='gold'||k==='drip'));
  const bar=(v,max)=>`<span class="bar5">${Array.from({length:5},(_,n)=>`<i class="${n<Math.round(v/max*5)?'on':''}"></i>`).join('')}</span>`;
  const freeH=CHAPTERS[def.ch].noHome;const card=k=>{const c=COFFEES[k],lockedGold=k==='gold'&&beanCount()<BEANS_NEED,can=!lockedGold&&(freeH||save.coins>=c.price),nw=save.cfSeen[k]===1&&!save.seen['cfUsed_'+k];
    return `<button class="cf ${k==='gold'?'goldcf':''}" data-k="${k}" ${can?'':'disabled'}>
      ${nw&&!lockedGold?'<span class="free">جدید!</span>':''}
      <span class="ic" style="color:${c.color}">${lockedGold?IC.lock:IC.cup}</span><span class="nm">${c.name}</span>
      ${lockedGold?`<span class="ds">${fa(BEANS_NEED)} دونه‌ی طلایی لازمه (${fa(beanCount())}/${fa(BEANS_NEED)})</span>`:`<span class="stats"><span>${IC.bolt}${bar(c.speed-.8,.65)}</span><span>${IC.hourglass}${bar(c.energy,80)}</span></span>
      ${c.ab?`<span class="abl">${ABILITY[c.ab]}</span>`:''}<span class="ds">${c.desc}</span>`}
      ${lockedGold?'':`<span class="pr">${c.price&&!freeH?IC.coin+fa(c.price):'<b>مهمون '+PEOPLE[giver].name+'</b>'}</span>`}</button>`;};
  const tags=[def.chase?(def.chase.vehicle==='moto'?'موتور!':'ماشین!'):'',def.mode==='timed'?'ثانیه‌شمار':'',def.mode==='freeze'?'نوبتی':'',def.night?'شب':'',def.boss?'غول!':''].filter(Boolean).join(' · ');
  const noHome=CHAPTERS[def.ch].noHome;
  show(`<div class="mhead"><span class="time">${noHome?'طبقه‌ی بعد':'روز '+fa(i+1)} · ${def.name}</span>${tags?`<span class="tags">${tags}</span>`:''}</div>
    <div class="mpanel"><div class="row"><b>${def.chase?'قهوه‌ی قبل از رانندگی؟':'کدوم قهوه، ملکه؟'}</b><span class="chip">${IC.coin}<span>${fa(save.coins)}</span></span></div>
    <div class="legend">${def.chase?IC.bolt+' سرعت بیشتر = نیتروی بیشتر':IC.bolt+' سرعت · '+IC.hourglass+' مدت اثر'}</div>
    <div class="coffees">${keys.map(card).join('')}</div></div>`,'panel');
  for(const b of screenEl.querySelectorAll('.cf'))b.onclick=()=>{
    const k=b.dataset.k,price=CHAPTERS[def.ch].noHome?0:COFFEES[k].price;if(save.coins<price)return;save.coins-=price;save.seen['cfUsed_'+k]=1;persist();sfx('click');hideScreen();
    sceneAppend([
      {d:.3,set:{kiana:{held:'cup',arms:'hold',zzz:false},[giver]:{arms:'hold'}},fx:[['sfx','pop']],hold:.25},
      {d:.5,set:{kiana:{arms:'drink',mood:'happy'},[giver]:{arms:'down',held:null}},fx:[['sfx','sip']],hold:.3},
      {d:.5,set:{kiana:{mess:0,mood:'excited',bird:false,arms:'up',held:null,sparkle:true}},
       fx:[['flash'],['bolt',.3,.45],['shake',.35],['sfx','charge'],['boom',.3,.18,COFFEES[k].name+'!']],hold:.8},
      {d:.7,set:{kiana:{sparkle:false,arms:'down',mood:'smug'}},to:{kiana:{x:-.3}},hold:0}],()=>done(k));
  };
}
const UP=['یه طبقه‌ی دیگه. پاهام می‌لرزه، ولی دلم نه.','بالاتر، تاریک‌تر... و بوی چای قوی‌تر.','هر طبقه که می‌رم بالا، به هیرومن نزدیک‌ترم.','آسانسور باری... جیرجیرش منو یاد کاشی‌های همکف می‌ندازه.','فندق، تو هم می‌ترسی؟ منم یه‌کم. ولی می‌ریم.','این برج چندتا طبقه داره؟ کی اینو ساخته؟ یه قوری‌دوست!'];
function floorScene(i){
  const def=LEVELS[i],nx=LEVELS[i+1],n2=i<42?i-31:i-32,fl=fa(n2-1),fl2=fa(n2);
  return{bg:'elevator',bgo:{floor:fl},music:'night',actors:{kiana:{who:'kiana',x:.5,y:.7,s:S,mood:'smug',mess:.4,held:null}},
    beats:[{d:.5,fx:[['sfx','ding']],hold:.1},{d:.9,set:{_bg:{floor:fl2}},fx:[['sfx','whoosh'],['text',.5,.2,'طبقه‌ی '+fl2]],hold:.1},
      {say:['kiana',def.up||pick('up',UP),'think']},
      {d:.55,set:{kiana:{arms:'zombie',mood:'normal'}},to:{kiana:{x:1.3}},hold:0}]};
}

/* ================= Results ================= */
function evalGoals(){const d=G.def;return[true].concat(d.goals.map(g=>g==='coins'?G.coinsGot===G.coinsTotal:g==='time'?G.t<=d.par:g==='nocatch'?G.caught===0:
  g==='nogadget'?(G.used.donut+G.used.phone+G.used.box)===0:g==='secret'?G.secretGot:g==='ghost'?G.suspPeak<.6&&G.caught===0:g==='nohit'?G.hits===0:g==='chasecoins'?G.coinsGot>=d.par:false));}
function showWin(){
  const def=G.def,i=G.idx,res=evalGoals(),stars=res.filter(Boolean).length,prev=save.stars[i]||0,firstClear=!prev;
  const salary=firstClear?PAY.salary:PAY.replay,coinPay=Math.max(0,G.coinsGot-(save.coinBest[i]||0))+(firstClear?G.bonusCoins:0);
  const newStars=Math.max(0,stars-prev),starPay=newStars*PAY.star;
  const secretNew=G.secretGot&&!save.secrets[i],secPay=secretNew?PAY.secret:0,beanNew=G.beanGot&&!save.beans[i],beanPay=beanNew?PAY.bean:0;
  const bonus=firstClear?(def.boss?PAY.boss:def.chase?PAY.chase:0):0;
  const hadGold=beanCount()>=BEANS_NEED,total=salary+coinPay+starPay+secPay+beanPay+bonus;
  save.coins+=total;save.stars[i]=Math.max(prev,stars);save.coinBest[i]=Math.max(save.coinBest[i]||0,G.coinsGot);if(G.beanGot)save.beans[i]=1;if(G.secretGot)save.secrets[i]=1;
  save.best[i]=Math.min(save.best[i]||999,Math.round(G.t));persist();
  const goldNow=!hadGold&&beanCount()>=BEANS_NEED;
  const nextCf=i+1<LEVELS.length?Object.keys(COFFEES).filter(k=>COFFEES[k].from===i+1):[],nextG=i+1<LEVELS.length?Object.keys(GADGETS).filter(k=>GADGETS[k].from===i+1):[];
  renderWin({def,i,res,stars,salary,coinPay,starPay,secPay,beanPay,bonus,goldNow,firstClear,secretNew,nextCf,nextG});
}
function renderWin(R){
  const {def,i,res,stars}=R;setMode('tower');AUDIO.music('win');hud.classList.remove('chase');
  const starHtml=[0,1,2].map(n=>n<stars?IC.starOn.replace('<svg ','<svg style="animation-delay:'+(.2+n*.35)+'s" '):IC.starOff).join('');
  const notes=[],nextNoHome=i+1<LEVELS.length&&CHAPTERS[LEVELS[i+1].ch].noHome;
  if(R.secretNew)notes.push(`<div class="card unlock">${IC.secret}<div><b>راز پیدا شد: ${def.secret.title}</b><p class="small">${def.secret.text}</p></div></div>`);
  if(R.goldNow)notes.push(`<div class="card unlock">${IC.bean}<b>${fa(BEANS_NEED)} دونه‌ی طلایی! قهوه‌ی طلایی باز شد!</b></div>`);
  for(const k of R.nextCf)notes.push(`<div class="card unlock teaser">${IC.cup}<b>${nextNoHome?'یه قهوه‌ی جدید توی راهه: ':'فردا هیرومن یه قهوه‌ی جدید داره: '}${COFFEES[k].name}</b></div>`);
  for(const k of R.nextG)notes.push(`<div class="card unlock teaser">${IC[k]}<b>ابزار جدید باز شد: ${GADGETS[k].name}</b></div>`);
  const newFile=!save.clues[i];
  const nextLabel=newFile?'📁 پرونده‌ی جدید رو باز کن!':i>=LEVELS.length-1?'پایان':nextNoHome?'طبقه‌ی بعد':'روز بعد';
  const ttl=def.boss?'غول شکست خورد!':def.chase?(def.chase.mode==='escape'?'فرار کردیم!':'گرفتیمشون!'):'مأموریت انجام شد!';
  show(`<h2 class="ttl">${ttl}</h2>
    <div class="stars">${starHtml}</div>
    <div class="card">${goalsHtml(def,res)}</div>
    <div class="card lines">
      <div><span>حقوق امروز${R.firstClear?'':' (تکرار)'}</span><span>+${fa(R.salary)}</span></div>
      <div><span>سکه‌های جمع‌شده${R.firstClear?'':' (فقط بیشتر از رکورد قبلی)'}</span><span>+${fa(R.coinPay)}</span></div>
      ${R.starPay?`<div><span>ستاره‌های جدید</span><span>+${fa(R.starPay)}</span></div>`:''}
      ${R.secPay?`<div><span>راز مخفی</span><span>+${fa(R.secPay)}</span></div>`:''}
      ${R.beanPay?`<div><span>دونه‌ی طلایی</span><span>+${fa(R.beanPay)}</span></div>`:''}
      ${R.bonus?`<div><span>${def.boss?'جایزه‌ی غول':'جایزه‌ی مرحله‌ی ویژه'}</span><span>+${fa(R.bonus)}</span></div>`:''}
      <div class="tot"><span>کیف پول</span><span>${IC.coin}${fa(save.coins)}</span></div>
    </div>${notes.join('')}
    <button class="btn big ${newFile?'glow':''}" id="wNext">${nextLabel}</button>
    <div class="row2"><button class="btn alt" id="wAgain">${IC.restart} دوباره</button><button class="btn alt" id="wTower">${IC.map} برج</button></div>`,'over win');
  for(let n=0;n<stars;n++)setTimeout(()=>sfx('star',n),200+n*350);
  if(newFile)setTimeout(()=>sfx('glow'),1300);
  on('#wNext',()=>afterWin(i));
  on('#wAgain',()=>enterLevel(i,{replay:true}));
  on('#wTower',()=>afterWin(i,true));
}
function afterWin(i,toTower){
  const def=LEVELS[i],ch=CHAPTERS[def.ch],steps=[],outro=ch.outro,last=i>=LEVELS.length-1,nx=LEVELS[i+1];
  const chEnd=last||nx.ch!==def.ch;
  if(!save.clues[i])steps.push(n=>clueScreen(i,n));
  if(def.clue&&def.clue.meet&&!save.seen['meet'+i])steps.push(n=>{save.seen['meet'+i]=1;persist();playScene(meetScene(i),n);});
  if(chEnd&&!save.seen[outro]&&SCENES[outro])steps.push(n=>{save.seen[outro]=1;persist();playScene(SCENES[outro],n);});
  if(last){steps.push(()=>endScreen());}
  else if(toTower){steps.push(()=>goTower());}
  else{
    const nextNoHome=CHAPTERS[nx.ch].noHome;
    if(!nextNoHome){const th=!save.seen['home'+i]&&def.home?def.home:null;save.seen['home'+i]=1;persist();steps.push(n=>playScene(homeScene(th),n));}
    else if(!chEnd&&!def.chase&&!nx.preScene)steps.push(n=>playScene(floorScene(i),n));
    steps.push(()=>enterLevel(i+1));}
  runSteps(steps);
}
function showFail(){
  setMode('tower');AUDIO.music(null);hud.classList.remove('chase');
  if(G.chase){const r=G.res||{},moto=G.def.chase.vehicle==='moto';
    const ttl=r.reason==='crashed'?(moto?'موتور زمین خورد!':'دوشیش داغون شد!'):r.reason==='caught'?'گیرمون انداختن!':'از دستمون در رفت!';
    const kl=moto?pick('chaseFailM',['هیرومن، این بار من می‌گم کی بپیچی!','محکم‌تر بچسبم، تندتر بریم!','فندق، کلاه ایمنی‌تو ببند. دوباره!']):pick('chaseFail',['دوشیش، تو بهترین ماشین دنیایی. فقط... یه‌کم دیگه تمرین کنیم.','این بار حواسم به لاین‌ها هست!','فندق، کمربندتو ببند. دوباره می‌ریم!','نیترو رو زودتر می‌زنم!']);
    show(`<h2 class="ttl">${ttl}</h2><div class="card dlg short"><span class="who kiana">کیانا</span><p>«${kl}»</p></div>
      <p class="tipline">نکته: ${pick('chaseTip',['انگشتتو زودتر بکش؛ ماشین‌ها از دور معلومن.','نیترو رو توی جاده‌ی خلوت بزن، نه وسط ترافیک.','سکه‌ها رو فدای سلامتی نکن!','لکه‌های چای سُرت می‌دن؛ ازشون دوری کن.'])}</p>
      <button class="btn big" id="bRetry">${IC.restart} دوباره امتحان کن</button><button class="btn alt" id="bTower">${IC.map} برج</button>`,'over bust');
    on('#bRetry',()=>startLevel(G.idx,G.coffeeKey));on('#bTower',()=>goTower());return;}
  const by=G.bustBy,timeout=G.state==='timeout',key=by?(by.cam?'cam':by.who):null;
  if(!timeout&&!G.refunded)G.refunded=refundUsed();
  const who=timeout?null:key;
  const line=timeout?pick('tout',['وقت تموم شد! درها قفل شدن!','تیک‌تاک، تیک‌تاک... بوق!','زنگ آخر! همه‌ی درها قفل!']):pick('bust'+key,BUSTED[key]||BUSTED.cam);
  show(`<h2 class="ttl">${timeout?'وقت تموم شد!':'با پرونده گیر افتادی!'}</h2>
    ${who&&who!=='cam'?`<canvas class="portrait" data-who="${who}" data-mood="angry"></canvas>`:''}
    <div class="card dlg short">${who&&who!=='cam'?`<span class="who" style="background:${PEOPLE[who].shirt};color:#fff">${PEOPLE[who].name}</span>`:`<span class="who">${timeout?'بلندگوی بانک':by&&by.laser?'لیزر امنیتی':'دوربین امنیتی'}</span>`}<p>«${line}»</p></div>
    <div class="card dlg short"><span class="who kiana">کیانا</span><p>«${pick('excuse',EXCUSES)}»</p></div>
    ${G.refunded?`<div class="card unlock">${IC.bag}<b>${fa(G.refunded)} ابزاری که استفاده کرده بودی، پس داده شد.</b></div>`:''}
    <p class="tipline">نکته: ${pick('tip',['وقتی دستت خالیه، گیر افتادن فقط برت می‌گردونه سر میزت. ولی با پرونده باید روح باشی!','قبل از برداشتن پرونده، مسیر برگشت رو نگاه کن.','کمدها، دریچه‌ها و پشت میزها پناهگاه‌های خوبی‌ان.','قهوه‌ی مناسب مرحله رو انتخاب کن. هر قهوه یه قدرت داره!','دستگاه کپی رو روشن کن تا یکی رو از سر راهت برداری.','صبر کردن هم بخشی از نقشه‌ست. نور رو نگاه کن، بعد برو.'])}</p>
    <button class="btn big" id="bRetry">${IC.restart} دوباره امتحان کن</button>
    <button class="btn alt" id="bTower">${IC.map} برج</button>`,'over bust');
  on('#bRetry',()=>startLevel(G.idx,G.coffeeKey));
  on('#bTower',()=>goTower());
}
function endScreen(){
  G=null;SC=null;setMode('tower');AUDIO.music('win');
  show(`<h1 class="logo"><span class="k" style="font-size:50px">پایان فصل اول</span><span class="s">ادامه دارد...</span></h1>
    <div class="row" style="justify-content:center;gap:8px"><canvas class="portrait" data-who="kiana" data-mood="love"></canvas><canvas class="portrait" data-who="hiroman" data-mood="love"></canvas></div>
    <div class="card"><p>کیانا «عملیات بی‌کافئین» رو متوقف کرد، کافه‌ی هیرومن رو پس گرفت و ۴۷ کافه‌ی شهر دوباره قهوه دارن!</p>
    <p class="muted">ستاره‌ها: ${fa(starTotal())} از ${fa(LEVELS.length*3)} · رازها: ${fa(secretCount())} از ${fa(secretTotal())} · دونه‌های طلایی: ${fa(beanCount())}</p>
    <p class="muted">فصل دوم: «انتقام چای»... به‌زودی</p></div>
    <button class="btn big" id="eTower">${IC.map} برگرد به برج</button>`,'over');
  on('#eTower',goTower);
}


/* ================= Endless driving + garage ================= */
const VEHS=()=>typeof VEHICLES!=='undefined'&&VEHICLES?VEHICLES:{};
const vPrice=v=>v.price?Math.max(5,Math.round(v.price*.8/5)*5):0;
const vehDefault=type=>{const e=Object.entries(VEHS()).find(([k,v])=>v.type===type&&!v.price);return e?e[0]:null;};
function vehOf(type){if(!save.veh)save.veh={};const k=save.veh[type];return k&&VEHS()[k]?k:vehDefault(type);}
const vehOwned=k=>{const v=VEHS()[k];return v&&(!v.price||(save.vowned||{})[k]);};
const chaseWon=vehicle=>!!save.set.test||LEVELS.some((l,i)=>l.chase&&l.chase.vehicle===vehicle&&(save.stars[i]||0)>0);
const endlessOpen=()=>chaseWon('car')||chaseWon('moto');
function drawVehPreviews(){
  for(const el of screenEl.querySelectorAll('canvas.vprev')){const r=el.getBoundingClientRect();if(!r.width)continue;const W=Math.round(r.width*2),H=Math.round(r.height*2);
    if(el.width!==W){el.width=W;el.height=H;}const c=el.getContext('2d');c.clearRect(0,0,W,H);
    if(typeof VEH_DRAW==='function'){try{VEH_DRAW(c,el.dataset.k,W/2,H*.88,Math.min(W*.38,H*.52),clock);}catch(e){}}}
}
let endType='car';
function endlessScreen(back){
  G=null;SC=null;setMode('tower');AUDIO.music('chase');hud.classList.remove('chase');
  if(!chaseWon(endType))endType=chaseWon('car')?'car':'moto';
  const k=vehOf(endType),v=VEHS()[k]||{name:'؟'},best=(save.endBest||{})[endType]||0;
  const tab=(t,lab)=>`<button class="${endType===t?'on':''}" id="et_${t}" ${chaseWon(t)?'':'disabled'}>${lab}${chaseWon(t)?'':' 🔒'}</button>`;
  show(`<div class="sheet"><h2 class="sh-t">پیست بی‌نهایت</h2>
    <p class="muted center">تا جایی که می‌تونی برو! هر چی دورتر، جاده شلوغ‌تر. نصف سکه‌هایی که جمع کنی مال خودت می‌شه.</p>
    <div class="wtabs">${tab('car','ماشین')}${tab('moto','موتور')}</div>
    <canvas class="vprev big" data-k="${k}"></canvas>
    <div class="row"><b>${v.name}</b><span class="chip">${IC.starOn}<span>رکورد: ${fa(best)} متر</span></span></div>
    <button class="btn big" id="eGo">${IC.play} بزن بریم!</button>
    <button class="btn alt" id="eGar">${IC.car} گاراژ: ماشین و موتور جدید</button>
    <button class="btn alt" id="eBack">برگرد</button></div>`,'over');
  on('#et_car',()=>{endType='car';endlessScreen(back);});on('#et_moto',()=>{endType='moto';endlessScreen(back);});
  on('#eGo',()=>startEndless(endType));on('#eGar',()=>{wardWho='garage';wardrobe(()=>endlessScreen(back));});on('#eBack',back);
}
function startEndless(type){
  const def={ch:0,name:'پیست بی‌نهایت',goals:[],par:0,intro:[],chase:{endless:true,vehicle:type,mode:'escape',traffic:.45,hazards:['cone','puddle','barrier','bump','teaspill','ramp'],coins:0,night:false,rider:null}};
  G={idx:-1,def,chase:true,endless:true,started:true,cf:COFFEES.drip,coffeeKey:'drip',state:'play',t:0,used:{donut:0,phone:0,box:0},caught:0,hits:0,coinsGot:0,coinsTotal:0,bonusCoins:0,docsGot:0,docsTotal:0,flags:{},parts:[],says:[]};
  setMode('play');hideScreen();hud.classList.add('chase');hudCache={};$('#bossBar').hidden=true;$('#modeChip').hidden=true;AUDIO.music('chase');
  if(!CHASE){toast('حالت رانندگی در دسترس نیست',true);return endlessScreen(titleScreen);}
  CHASE.start(def,{coffee:COFFEES.espresso,skin:vehOf(type),best:(save.endBest||{})[type]||0,onEnd:endlessEnd});
}
function endlessEnd(res){
  if(!G||!G.endless||G.state!=='play')return;G.state='lost';
  const type=G.def.chase.vehicle,dist=Math.round(res&&res.distance||0),coins=res&&res.coins||0,pay=Math.min(30,Math.floor(coins/2)+Math.floor(dist/1000));
  if(!save.endBest)save.endBest={};const prev=save.endBest[type]||0,rec=dist>prev;if(rec)save.endBest[type]=dist;save.coins+=pay;persist();
  setTimeout(()=>{if(CHASE)CHASE.stop();setMode('tower');hud.classList.remove('chase');AUDIO.music(rec?'win':null);
    show(`<h2 class="ttl">${rec?'رکورد جدید!':'تصادف!'}</h2>
      <div class="card lines"><div><span>مسافت</span><span>${fa(dist)} متر</span></div><div><span>رکورد</span><span>${fa(Math.max(prev,dist))} متر</span></div>
      <div><span>سکه‌های جمع‌شده</span><span>${fa(coins)}</span></div><div class="tot"><span>به کیف پولت اضافه شد</span><span>${IC.coin}+${fa(pay)}</span></div></div>
      <button class="btn big ${rec?'glow':''}" id="eAgain">${IC.restart} دوباره!</button>
      <div class="row2"><button class="btn alt" id="eGar">${IC.car} گاراژ</button><button class="btn alt" id="eMenu">${IC.home} منو</button></div>`,'over win');
    if(rec)sfx('fanfare');
    on('#eAgain',()=>startEndless(type));on('#eGar',()=>{wardWho='garage';wardrobe(()=>endlessScreen(titleScreen));});on('#eMenu',titleScreen);},400);
}
function garageHtml(){
  const stars=starTotal(),list=Object.entries(VEHS());
  if(!list.length)return'<p class="muted center">گاراژ هنوز آماده نیست.</p>';
  const sec=type=>list.filter(([k,v])=>v.type===type).map(([k,v])=>{const own=vehOwned(k),lock=stars<(v.stars||0),sel=vehOf(type)===k;
    return `<div class="card veh ${sel?'sel':''} ${lock?'lockd':''}"><canvas class="vprev" data-k="${k}"></canvas><div class="grow"><b>${v.name}</b><div class="muted small">${v.desc||''}</div></div>
      ${sel?'<span class="tagsel">سوارشی!</span>':lock?`<span class="chip">${IC.starOn}${fa(v.stars)}</span>`:own?`<button class="btn alt vsel" data-k="${k}">انتخاب</button>`:`<button class="btn gold vbuy" data-k="${k}" ${save.coins<vPrice(v)?'disabled':''}>${IC.coin}${fa(vPrice(v))}</button>`}</div>`;}).join('');
  return `<div class="sec-t">ماشین‌ها</div>${sec('car')}<div class="sec-t">موتورها</div>${sec('moto')}`;
}
function wireGarage(back){
  for(const b of screenEl.querySelectorAll('.vsel'))b.onclick=()=>{const k=b.dataset.k,v=VEHS()[k];if(!save.veh)save.veh={};save.veh[v.type]=k;persist();sfx('pop');wardrobe(back);};
  for(const b of screenEl.querySelectorAll('.vbuy'))b.onclick=()=>{const k=b.dataset.k,v=VEHS()[k];if(save.coins<vPrice(v)){sfx('error');return;}save.coins-=vPrice(v);if(!save.vowned)save.vowned={};save.vowned[k]=1;if(!save.veh)save.veh={};save.veh[v.type]=k;persist();sfx('buy');toast('مال خودت شد!');wardrobe(back);};
}

/* ================= Loop ================= */
let last=performance.now();
function frame(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;clock+=dt;
  try{
    if(mode==='play'&&G){
      if(G.chase){ctx.setTransform(dpr,0,0,dpr,0,0);if(G.started&&CHASE){if(G.state==='play')CHASE.update(dt);CHASE.render(ctx);}else renderMenuBG(clock);}
      else{update(dt);if(G)renderGame();}}
    else if(mode==='scene'&&SC){sceneUpdate(dt);ctx.setTransform(dpr,0,0,dpr,0,0);renderScene(ctx);}
    else if(mode==='title')renderTitle(clock);
    else renderMenuBG(clock);
    drawPortraits(clock);if(!screenEl.hidden&&screenEl.querySelector('canvas.vprev'))drawVehPreviews();
  }catch(e){console.error(e);}
  requestAnimationFrame(frame);
}
resize();titleScreen();requestAnimationFrame(frame);


