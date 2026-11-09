'use strict';
/* ============================================================
   Cutscene engine + all story scenes
   Actor coords: x,y in 0..1 of the stage, s = size relative to stage width.
   Beat: {d, to:{id:{...,arc}}, set:{id:{...}}, say:[who,text,think?], fx:[...], ease, hold, tap, cut:{bg,bgo,actors}}
   ============================================================ */
let SC=null;
const EASE={linear:k=>k,in:k=>k*k,out:k=>1-(1-k)*(1-k),inOut:k=>k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2,
  back:k=>{const c1=1.70158,c3=c1+1;return 1+c3*Math.pow(k-1,3)+c1*Math.pow(k-1,2);},
  bounce:k=>{const n=7.5625,d=2.75;if(k<1/d)return n*k*k;if(k<2/d)return n*(k-=1.5/d)*k+.75;if(k<2.5/d)return n*(k-=2.25/d)*k+.9375;return n*(k-=2.625/d)*k+.984375;}};

function cloneActors(a){const o={};for(const id in a)o[id]=Object.assign({alpha:1,seed:hsh(id.length*7+id.charCodeAt(0))*5},a[id]);return o;}
/* location card + iris wipe whenever the place changes */
const LOC_NAMES={cafe:'کافه هیرومن',bedroom:'خونه‌ی کیانا',street:'خیابون',gallery:'اتوگالری جاوید',garage:'پارکینگ برج',road:'جاده',tower:'برج بلاف بانک',elevator:'آسانسور',construction:'کارگاه طبقه‌ی سوم',penthouse:'پنت‌هاوس',roof:'پشت‌بوم',sea:'یه جای دور...',kitchen:'آبدارخونه'};
const LOC_THEME={lobby:'بلاف بانک · همکف',archive:'بلاف بانک · طبقه‌ی دوم',build:'بلاف بانک · طبقه‌ی سوم',night:'برج · نیمه‌شب',tea:'داخل قوری'};
function locName(bg,bgo){if(bg==='office')return LOC_THEME[(bgo&&bgo.theme)||'lobby']||'بلاف بانک';return LOC_NAMES[bg]||'';}
let lastLoc='';
function startTrans(bg,bgo,force){const n=locName(bg,bgo);if(!n||(!force&&n===lastLoc))return;lastLoc=n;SC.trans={t:0,label:n};if(typeof sfx==='function')sfx('whoosh');}
function playScene(def,onEnd){
  SC={def,bg:def.bg,bgo:Object.assign({},def.bgo||{}),actors:cloneActors(def.actors||{}),beats:def.beats.slice(),i:-1,k:1,dur:0,t:0,fx:[],shake:0,flash:0,fade:1,onEnd,stay:!!def.stay,typed:0,line:'',done:false};
  if(typeof hideScreen==='function')hideScreen();
  setMode('scene');if(def.music!==undefined)AUDIO.music(def.music);if(typeof def.label==='string'){lastLoc=def.label;SC.trans={t:0,label:def.label};if(typeof sfx==='function')sfx('whoosh');}else if(def.label!==false)startTrans(def.bg,def.bgo);if(SC.trans)SC.fade=0;nextBeat();
}
function sceneAppend(beats,onEnd){if(!SC)return;SC.beats.push(...beats);SC.stay=false;SC.onEnd=onEnd;if(SC.idle){SC.idle=false;nextBeat();}}
function endScene(){const cb=SC.onEnd;SC.done=true;hideTalk();AUDIO.duck(false);if(cb)cb();}
function nextBeat(){
  if(!SC||SC.done)return;
  SC.i++;
  if(SC.i>=SC.beats.length){if(SC.stay){SC.i=SC.beats.length-1;SC.idle=true;SC.waitTap=true;SC.k=1;return;}endScene();return;}
  const b=SC.beats[SC.i];
  if(b.cut){const nb=b.cut.bg,no=b.cut.bgo||{};SC.bg=nb;SC.bgo=Object.assign({},no);SC.actors=cloneActors(b.cut.actors||{});SC.fade=1;startTrans(nb,no);if(SC.trans&&SC.trans.t===0)SC.fade=0;}
  if(b.set)for(const id in b.set){const a=id==='_bg'?SC.bgo:(SC.actors[id]||(SC.actors[id]={alpha:1,seed:0}));Object.assign(a,b.set[id]);}
  if(b.del)for(const id of b.del)delete SC.actors[id];
  SC.from={};SC.to=b.to||{};SC.autoWalk=[];
  for(const id in SC.to){const a=id==='_bg'?SC.bgo:SC.actors[id];if(!a)continue;SC.from[id]={};
    for(const k in SC.to[id]){if(k==='arc')continue;SC.from[id][k]=a[k]==null?0:a[k];}
    if(a.who&&SC.to[id].x!=null&&Math.abs(SC.to[id].x-(a.x||0))>.04&&!SC.to[id].arc&&!a.walking){a.walking=true;SC.autoWalk.push(a);}}
  SC.dur=b.d!=null?b.d:(b.to?.6:0);SC.k=SC.dur>0?0:1;if(SC.k>=1)applyTween(true);
  if(b.fx)b.fx.forEach(sceneFx);
  if(b.music!==undefined)AUDIO.music(b.music);
  if(b.say)startTalk(b.say[0],b.say[1],b.say[2]==='think');else if(!b.keepTalk)hideTalk();
  SC.waitTap=!!b.say||!!b.tap;SC.hold=b.hold!=null?b.hold:.12;SC.holdT=0;
}
function applyTween(final){
  const b=SC.beats[SC.i];if(!b)return;const e=final?1:(EASE[b.ease||'inOut'])(SC.k);
  for(const id in SC.to){const a=id==='_bg'?SC.bgo:SC.actors[id];if(!a)continue;const tt=SC.to[id];
    for(const k in tt){if(k==='arc')continue;const f=SC.from[id][k];a[k]=f+(tt[k]-f)*e;}
    if(tt.arc)a.yOff=final?0:-Math.sin(P*SC.k)*tt.arc;}
  if(final){SC.autoWalk.forEach(a=>a.walking=false);SC.autoWalk=[];}
}
function sceneFx(f){
  const [type,a1,a2,a3,a4]=f;
  if(type==='shake')SC.shake=Math.max(SC.shake,a1||.4);
  else if(type==='flash')SC.flash=1;
  else if(type==='sfx'){if(!SC.skipping)sfx(a1,a2);}
  else SC.fx.push({type,x:a1,y:a2,text:a3,col:a4,t:0});
}
function voiceKey(who){if(who==='katy'&&SC&&SC.actors.katy&&SC.actors.katy.sugar)return'katyEvil';return who;}
function sceneUpdate(dt){
  if(!SC||SC.done)return;
  const sk=document.getElementById('skipB');if(sk)sk.hidden=!(SC.t>1.2&&!SC.idle&&!SC.def.noSkip);
  SC.t+=dt;if(SC.trans){SC.trans.t+=dt;if(SC.trans.t>1.9)SC.trans=null;}SC.shake=Math.max(0,SC.shake-dt);SC.flash=Math.max(0,SC.flash-dt*2.5);SC.fade=Math.max(0,SC.fade-dt*2.5);
  for(const id in SC.actors){const a=SC.actors[id];if(a.hopT!=null)a.hopT+=dt;}
  for(const f of SC.fx)f.t+=dt;SC.fx=SC.fx.filter(f=>f.t<(f.type==='text'?1.4:1));
  if(SC.k<1){SC.k=Math.min(1,SC.k+dt/SC.dur);applyTween(SC.k>=1);}
  if(SC.line&&SC.typed<SC.line.length){const before=Math.floor(SC.typed);SC.typed=Math.min(SC.line.length,SC.typed+dt*44);const now=Math.floor(SC.typed);
    for(let i=before;i<now;i++)if(i%2===0)AUDIO.voice(voiceKey(SC.who),SC.line[i],{think:SC.think,excited:SC.excited});
    $('#talkText').textContent=SC.line.slice(0,now);if(SC.typed>=SC.line.length)$('#talk').classList.add('ready');}
  if(SC.k>=1&&!SC.waitTap&&!SC.idle){SC.holdT+=dt;if(SC.holdT>=SC.hold)nextBeat();}
}
function skipScene(){
  if(!SC||SC.done||SC.idle)return;SC.skipping=true;let n=0;
  while(SC&&!SC.done&&!SC.idle&&n++<600){if(SC.k<1){SC.k=1;applyTween(true);}SC.line='';nextBeat();}
  if(SC){SC.skipping=false;SC.fx=[];SC.shake=0;SC.flash=0;SC.trans=null;}
}
function sceneTap(){
  if(!SC||SC.done)return;
  if(SC.idle)return;
  if(SC.k<1){SC.k=1;applyTween(true);if(!(SC.line&&SC.typed<SC.line.length))return;}
  if(SC.line&&SC.typed<SC.line.length){SC.typed=SC.line.length;$('#talkText').textContent=SC.line;$('#talk').classList.add('ready');return;}
  if(!SC.waitTap&&!SC.line){SC.holdT=SC.hold;return;}
  sfx('tap');nextBeat();
}
function startTalk(who,text,think){
  if(SC&&SC.skipping){SC.line='';return;}
  const el=$('#talk'),narr=who==='narrator',p=lookOf(who)||PEOPLE.kiana;
  el.hidden=false;el.classList.remove('ready');el.classList.toggle('narr',narr);el.classList.toggle('think',!!think);
  const nm=$('#talkName');nm.textContent=narr?'راوی':think?'💭 '+p.name+' با خودش':p.name;
  nm.style.background=narr?'#E3E8EC':think?'#EDE6FF':p.shirt;nm.style.color=narr||think||p.shirt==='#FFFFFF'?'#22303C':'#fff';
  SC.line=text;SC.typed=0;SC.who=who;SC.think=!!think;
  if(AUDIO.voiceLine)AUDIO.voiceLine(voiceKey(who),text);
  const a=SC.actors[who];SC.excited=!!(a&&['excited','shock','angry'].includes(a.mood));
  $('#talkText').textContent='';if(a&&!think)a.hopT=0;
  AUDIO.duck(true);
}
function hideTalk(){const el=$('#talk');if(el)el.hidden=true;if(SC)SC.line='';}

function stageRect(){
  const talkH=Math.min(210,vh*.27);
  const h=Math.max(260,vh-talkH),w=Math.min(vw,h*.72,560);
  return{x:(vw-w)/2,y:0,w,h};
}
function renderScene(c){
  if(!SC)return;const st=stageRect(),t=SC.t;
  c.save();if(SC.shake>0)c.translate((Math.random()-.5)*26*SC.shake,(Math.random()-.5)*26*SC.shake);
  drawBG(c,SC.bg,vw,vh,st,t,SC.bgo);
  const list=Object.entries(SC.actors).filter(([,a])=>a.alpha>0.01&&!a.hidden).sort((A,B)=>((A[1].z||0)-(B[1].z||0))||((A[1].y||0)-(B[1].y||0)));
  const drawA=(id,a)=>{
    let hop=0;if(a.hopT!=null&&a.hopT<.32)hop=-Math.sin(P*a.hopT/.32)*.018;
    const X=st.x+(a.x||0)*st.w,Y=st.y+((a.y||0)+(a.yOff||0)+hop)*st.h,S=(a.s||.36)*st.w;
    if(a.who){const o=Object.assign({},lookOf(a.who),a,{t:t+(a.seed||0)});drawPerson(c,X,Y,S,o);c.globalAlpha=1;if(a.alpha>.5)drawActorFx(c,o,X,Y,S,t);
      if(SC.think&&SC.who===a.who&&SC.line){const hr=S*.33*(o.big||1),hy=Y-S*.31*(o.big||1);c.fillStyle='rgba(255,255,255,.9)';c.strokeStyle=INK;c.lineWidth=2;
        for(let i=0;i<3;i++){circ(c,X+hr*(.9+i*.35),hy-hr*(1.1+i*.45),hr*(.1+i*.06));c.fill();c.stroke();}}}
    else if(a.prop)drawProp(c,a,X,Y,S,t);
  };
  for(const[id,a]of list)if((a.z||0)<10)drawA(id,a);
  drawFG(c,SC.bg,vw,vh,st,t,SC.bgo);
  for(const[id,a]of list)if((a.z||0)>=10)drawA(id,a);
  for(const f of SC.fx){const X=st.x+f.x*st.w,Y=st.y+f.y*st.h;
    if(f.type==='boom'){const k=Math.min(1,f.t/.15),sc=EASE.back(k)*(1-Math.max(0,f.t-.7)/.3);if(sc<=0)continue;c.save();c.translate(X,Y);c.rotate(-.12);c.scale(sc,sc);
      c.fillStyle=f.col||'#FFE14D';starPath(c,0,0,st.w*.17,12,.72);c.fill();c.lineWidth=4;c.strokeStyle=INK;c.stroke();txt(c,f.text,0,st.w*.01,Math.round(st.w*.07),'#E5484D','#fff');c.restore();}
    else if(f.type==='text'){const a=1-f.t/1.4;c.globalAlpha=Math.max(0,a);txt(c,f.text,X,Y-f.t*st.h*.06,Math.round(st.w*.06),f.col||'#fff',INK);c.globalAlpha=1;}
    else if(f.type==='bolt'){const a=1-f.t;c.globalAlpha=Math.max(0,a);c.strokeStyle='#FFE14D';c.lineWidth=6;c.lineJoin='miter';
      for(let i=0;i<6;i++){const ang=i/6*TAU+f.t,r1=st.w*.18,r2=st.w*(.3+f.t*.1);c.beginPath();c.moveTo(X+Math.cos(ang)*r1,Y+Math.sin(ang)*r1);c.lineTo(X+Math.cos(ang+.12)*(r1+r2)/2,Y+Math.sin(ang+.12)*(r1+r2)/2);c.lineTo(X+Math.cos(ang-.05)*(r1+r2)/2,Y+Math.sin(ang-.05)*(r1+r2)/2);c.lineTo(X+Math.cos(ang)*r2,Y+Math.sin(ang)*r2);c.stroke();}c.globalAlpha=1;}
    else if(f.type==='confetti'){for(let i=0;i<40;i++){const px=X+(hsh(i)-.5)*st.w*1.2+Math.sin(f.t*4+i)*10,py=Y-st.h*.2+f.t*st.h*(.5+hsh(i+3)*.6);c.fillStyle=['#FF4F86','#FFC531','#5EC8F7','#8BD3B7'][i%4];c.fillRect(px,py,8,5);}}
    else if(f.type==='speed'){c.globalAlpha=Math.max(0,1-f.t);c.strokeStyle='rgba(255,255,255,.8)';c.lineWidth=3;for(let i=0;i<12;i++){const y=st.y+st.h*hsh(i+f.t)*.8,x0=st.x+st.w*hsh(i*3);c.beginPath();c.moveTo(x0,y);c.lineTo(x0+st.w*.25,y);c.stroke();}c.globalAlpha=1;}
  }
  c.restore();
  if(SC.flash>0){c.fillStyle='rgba(255,255,255,'+SC.flash+')';c.fillRect(0,0,vw,vh);}
  if(SC.fade>0){c.fillStyle='rgba(20,16,30,'+SC.fade+')';c.fillRect(0,0,vw,vh);}
  if(SC.trans)drawTrans(c,SC.trans);
}

function drawTrans(c,tr){
  const t=tr.t,R=Math.hypot(vw,vh)/2+20;
  // iris: a coffee-coloured curtain opening from a circle in the middle
  const k=Math.min(1,t/.6),e=1-Math.pow(1-k,3);
  if(e<1){c.save();c.fillStyle='#3B2316';c.beginPath();c.rect(0,0,vw,vh);c.arc(vw/2,vh*.45,R*e,0,TAU,true);c.fill('evenodd');
    c.strokeStyle='#FFC531';c.lineWidth=6;c.beginPath();c.arc(vw/2,vh*.45,R*e,0,TAU);c.stroke();c.restore();}
  // location card sliding in from the right
  const inK=Math.min(1,t/.35),outK=t>1.45?Math.min(1,(t-1.45)/.4):0,x=vw/2+(1-EASE.back(inK))*vw*.8-outK*vw;
  const w=Math.min(vw*.82,320),h=54,y=vh*.12;
  c.save();c.globalAlpha=1-outK*.6;c.translate(x,y);c.rotate(-.04);
  c.fillStyle='#fff';c.strokeStyle=INK;c.lineWidth=3;rr(c,-w/2,-h/2,w,h,14);c.fill();c.stroke();
  c.fillStyle='#FF4F86';rr(c,w/2-46,-h/2+8,36,h-16,8);c.fill();
  c.fillStyle='#fff';circ(c,w/2-28,0,7);c.fill();c.fillStyle='#FF4F86';circ(c,w/2-28,0,3);c.fill();
  txt(c,tr.label,-14,2,24,INK,null);
  c.restore();
}
/* ---------- Helper: quick dialog scene from level lines ---------- */
function talkScene(lines,theme,bg,bgo){
  const actors={},others=[];
  for(const l of lines){if(l[0]!=='narrator'&&l[0]!=='kiana'&&!others.includes(l[0]))others.push(l[0]);}
  actors.kiana={who:'kiana',x:others.length?.24:.5,y:.68,s:.34,mood:'normal'};
  const pos=others.length>2?[.78,.56,.92,.4]:[.74,.52];others.forEach((w,i)=>actors[w]={who:w,x:pos[i]!=null?pos[i]:.6,y:.68+(i>1?.03:0),s:(PEOPLE[w]&&PEOPLE[w].kid?.4:.34)*(others.length>2?.9:1),z:i>1?3:0,mood:'normal',held:w==='golab'?'mop':w==='saadi'?'flashlight':null});
  const beats=lines.map(l=>{const b={say:[l[0],l[1],l[3]]};if(l[0]!=='narrator'){b.set={[l[0]]:{mood:l[2]||'normal',sweat:l[2]==='sweat'}};if(l[2]==='sweat')b.set[l[0]].mood='sad';}return b;});
  return{bg:bg||'office',bgo:bgo||{theme},actors,beats,music:'story'};
}

/* ---------- Between levels: walk home, sleep, time-lapse, wake up (fast!) ---------- */
const WAKE_GAGS=[
  [{d:.5,set:{kiana:{mood:'shock',zzz:false}},fx:[['sfx','ring']],hold:.1},
   {d:.5,ease:'in',to:{kiana:{x:.3,y:.8,rot:-P/2-TAU,arc:.22}},fx:[['sfx','whoosh']]},
   {d:.25,set:{kiana:{rot:0,y:.7,mood:'dizzy',dizzy:true,noShadow:false,sq:.12}},fx:[['boom',.3,.6,'بوم!'],['shake',.6],['sfx','boom']],hold:.5}],
  [{d:.4,set:{fandogh:{alpha:1,fly:true}},to:{fandogh:{x:.6,y:.5}},fx:[['sfx','tweet']]},
   {d:.3,set:{kiana:{mood:'shock',zzz:false}},fx:[['text',.6,.45,'نوک!','#E5484D'],['shake',.3],['sfx','pop']],hold:.2},
   {d:.5,to:{fandogh:{x:.66,y:.42}},set:{kiana:{rot:0,y:.7,x:.42,mood:'angry',noShadow:false}},hold:.4}],
  [{d:.4,set:{kiana:{mood:'angry',zzz:false}},fx:[['sfx','ring']]},
   {d:.6,ease:'out',to:{clock:{x:1.3,y:.1,rot:6}},fx:[['text',.3,.4,'شوت!'],['sfx','whoosh']],hold:.2},
   {d:.3,fx:[['text',.8,.15,'تق!','#E5484D'],['sfx','boom']],set:{kiana:{rot:0,y:.7,x:.42,mood:'smug',noShadow:false}},hold:.5}],
  [{d:.4,set:{kiana:{mood:'sleepy',zzz:false}},fx:[['sfx','ring']]},
   {d:.7,set:{kiana:{rot:0,y:.7,noShadow:false,arms:'zombie'}},to:{kiana:{x:.15}},hold:.1},
   {d:.25,fx:[['boom',.08,.45,'دنگ!'],['shake',.4],['sfx','boom']],set:{kiana:{mood:'dizzy',dizzy:true}},hold:.5}]
];
const HOME_THOUGHTS=['امروز هم یه پرونده... فردا یکی دیگه. من مأمور مخفی‌ام یا کارمند بانک؟','پاهام از بس یواشکی راه رفتم درد گرفت.','فقط یه چیز می‌خوام: تخت. و فردا صبح: قهوه.',
  'هیرومن فردا چه قهوه‌ای برام درست می‌کنه؟','فندق، امشب توی موهام خروپف نکن، باشه؟','یه روز دیگه، یه قدم نزدیک‌تر به حقیقت.','کفشام از بس روی نوک پا راه رفتم کج شدن!',
  'باید یادم باشه فردا سرنخ‌ها رو با هیرومن مرور کنم.','امروز یه بار نزدیک بود لو برم... قلبم هنوز تند می‌زنه.','کاش یه روز بشه توی بانک، جلوی همه، قهوه خورد.'];
function homeScene(thought){
  const gag=rnd(WAKE_GAGS);
  return{bg:'street',bgo:{night:0},music:'story',actors:{kiana:{who:'kiana',x:.25,y:.82,s:.3,mood:'sleepy',mess:.55,arms:'down'}},
   beats:[
    {d:1.1,to:{kiana:{x:.75},_bg:{night:1}},hold:.05},
    {say:['kiana',thought||(typeof pick==='function'?pick('home',HOME_THOUGHTS):rnd(HOME_THOUGHTS)),'think']},
    {cut:{bg:'bedroom',bgo:{night:1},actors:{bed:{prop:'bed',x:.62,y:.7,s:.62,z:0},kiana:{who:'kiana',x:-.2,y:.7,s:.36,mood:'sleepy',mess:.7,z:3},
      blanket:{prop:'blanket',x:.62,y:.7,s:.62,z:4,alpha:0},clock:{prop:'clock',x:.13,y:.6,s:.1,z:3},moon:{prop:'moon',x:.56,y:.2,s:.08,z:1},fandogh:{prop:'bird',x:.13,y:.47,s:.04,z:5,alpha:0}}},d:.55,to:{kiana:{x:.5}}},
    {d:.35,ease:'in',to:{kiana:{x:.6,y:.62,rot:-P/2}},set:{kiana:{noShadow:true}},fx:[['sfx','thud']],hold:.05},
    {d:.2,set:{kiana:{zzz:true,z:1,mess:1,bird:true},blanket:{alpha:1}},fx:[['text',.6,.45,'شلپ!'],['sfx','snore']],hold:.25},
    {d:1.3,set:{clock:{spin:40}},to:{_bg:{night:0},moon:{y:.5,alpha:0}},fx:[['sfx','clockSpin'],['speed',.5,.5]],hold:.05},
    {set:{clock:{spin:0,ring:true}},d:.2,fx:[['text',.13,.45,'دیرینگ!'],['sfx','ring']],hold:.2},
    ...gag,
    {d:.6,set:{clock:{ring:false},kiana:{dizzy:false,sq:0,arms:'zombie',mood:'sleepy'}},to:{kiana:{x:1.25}},hold:0}
   ]};
}

/* ---------- The story: chapter files add their scenes with Object.assign(SCENES,{...}) ---------- */
const S=.36;
const SCENES={};
