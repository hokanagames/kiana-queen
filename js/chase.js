'use strict';
/* ============================================================
   CHASE MODE «تعقیب» (levels 20, 31, 43, 59) — pseudo-3D rear-view lane chase.
   Kiana drives «دوشیش» (vehicle 'car') or rides pillion behind Hiroman ('moto').
   mode 'catch' : close the gap to target(s) before the road ends (targets 1..3, one after another).
   mode 'escape': pursuers come from behind and ram / cut in; survive to the end.

   API (game.js):
     CHASE.start(def,{coffee,onEnd})   def.chase = BIBLE "Chase level schema"
     CHASE.update(dt)  CHASE.render(c)  CHASE.pointer('down'|'move'|'up',x,y)  CHASE.key(k)
     CHASE.pause(on)   CHASE.stop()     (+ CHASE.state() debug snapshot, CHASE.auto(on) autopilot for tests)
   onEnd(result) is called ONCE, ~2.6 s after the outcome:
     {win, reason:'caught'|'escaped'|'crashed'|'lost', t, hits, coins, coinsTotal}
   World units: 1 = one lane width. Camera sits DP units behind the player's rear bumper.

   Cutscene art registered here (side view, facing RIGHT by default; a.flip → faces left):
     PROP_EXT.car (دوشیش) / moto / van / teavan / mixer / teatruck / guardcar   (c,a,x,y,s,t)
       x,y = ground contact centre, s = size (car length ≈ s*1.6)
       a.riders = PEOPLE keys (car: [driver, back seat]; moto: [driver, pillion]); a.moods = [...]
       a.driving → wheels spin + bounce + exhaust + speed lines; a.col overrides body colour; a.siren (guardcar)
     BG_EXT.road (c,W,H,st,t,o): side-view street. o.speed (0..3) scrolls, o.dir=-1 scrolls the other way,
       o.night / o.dawn palettes. Road surface covers stage y≈.74..1 → put vehicles at y≈.84...9.
   ============================================================ */
/* Player vehicle skins (garage). type 'car'|'moto'; price in coins; stars = stars needed to unlock.
   shape/col/door/glow are drawing params. opts.skin picks one (story chases only when its type matches the level). */
const VEHICLES={
  dooshish:{name:'دوشیش',type:'car',price:0,stars:0,desc:'هاچ‌بک کوچولوی نعنایی با یه در صورتی. کم‌حرف و باوفا!',shape:'hatch',col:'#7FE3C4',door:'#FF8FB5'},
  dooshishPink:{name:'دوشیش صورتی',type:'car',price:40,stars:0,desc:'همون دوشیش، برعکس: صورتی با یه در نعنایی.',shape:'hatch',col:'#FF8FB5',door:'#7FE3C4'},
  taxi:{name:'تاکسی زرد',type:'car',price:60,stars:5,desc:'«دربست؟» با تابلوی روی سقف و نوار شطرنجی.',shape:'taxi',col:'#FFC531',door:'#FFC531'},
  jeep:{name:'جیپ صحرایی',type:'car',price:90,stars:12,desc:'چرخ‌های گنده، زاپاس پشتش؛ از هیچ چاله‌ای نمی‌ترسه.',shape:'jeep',col:'#C9A66B',door:'#A8884F'},
  sport:{name:'سوپراسپرت قرمز',type:'car',price:130,stars:25,desc:'کوتاه، تیز، با بال عقب. نور حسودیش می‌شه!',shape:'sport',col:'#E5484D',door:'#FFC531'},
  icecream:{name:'ون بستنی',type:'car',price:170,stars:45,desc:'یه بستنی قیفی گنده روی سقف. دینگ‌دینگ!',shape:'icecream',col:'#FFF1F6',door:'#8BD3E6'},
  limo:{name:'لیموزین طلایی',type:'car',price:250,stars:90,desc:'دراز و طلایی، درخور یه ملکه‌ی واقعی.',shape:'limo',col:'#F5C542',door:'#F5C542'},
  hiromoto:{name:'موتور هیرومن',type:'moto',price:0,stars:0,desc:'موتور قرمز هیرومن با جعبه‌ی اسپرسو پشتش.',shape:'street',col:'#E5484D'},
  scooter:{name:'اسکوتر صورتی',type:'moto',price:50,stars:3,desc:'گرد و صورتی و بامزه؛ آروم ولی خوشگل.',shape:'scooter',col:'#FF8FB5'},
  cross:{name:'موتور کراس',type:'moto',price:120,stars:30,desc:'گِل‌خور و پرپرش، با شماره‌ی ۷ روی دماغش.',shape:'cross',col:'#FF7A2F'},
  neon:{name:'موتور نئونی',type:'moto',price:200,stars:60,desc:'شب‌ها برق می‌زنه؛ خط‌های فیروزه‌ای و نور زیرش.',shape:'neon',col:'#2A2F48',glow:'#5EF7E6'}
};
const CHASE=(()=>{
  const DP=3,DRAW=64,SEG=1.6,VB=14,PLEN=1.7,CL=7;
  const FAD='۰۱۲۳۴۵۶۷۸۹',fa=n=>String(n).replace(/\d/g,d=>FAD[d]);
  const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,k)=>a+(b-a)*k,rnd=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.floor(Math.random()*a.length)];
  const LX=l=>l-1;
  const now=()=>(typeof performance!=='undefined'?performance.now():Date.now());

  /* ---------- audio (all guarded) ---------- */
  const au={
    sfx(n,a){try{if(typeof AUDIO!=='undefined'&&AUDIO.sfx)AUDIO.sfx(n,a);}catch(e){}},
    eng(on,p){try{if(typeof AUDIO!=='undefined'&&typeof AUDIO.engine==='function')AUDIO.engine(on,p);}catch(e){}},
    mus(m){try{if(typeof AUDIO!=='undefined'&&AUDIO.music)AUDIO.music(m);}catch(e){}},
    say(who,text,think){try{if(typeof AUDIO==='undefined')return;if(typeof AUDIO.speak==='function'){AUDIO.speak(who,text,{think});return;}
      if(!AUDIO.voice)return;let n=0;for(const ch of text){if(n++%3===0&&n<36){const k=ch;setTimeout(()=>{try{AUDIO.voice(who,k,{think});}catch(e){}},n*24);}}}catch(e){}}
  };

  /* ---------- tables ---------- */
  const DIM={car:{w:.8,l:1.7},taxi:{w:.8,l:1.7},pickup:{w:.84,l:2},van:{w:.9,l:2.2},teavan:{w:.9,l:2.2},guardcar:{w:.82,l:1.8},
    mixer:{w:.98,l:2.8},cup:{w:.55,l:.5},teatruck:{w:.98,l:3},cone:{w:.34,l:.3},barrier:{w:.96,l:.3},puddle:{w:.9,l:1.6,flat:1},teaspill:{w:.96,l:2.1,flat:1},
    bump:{w:3.1,l:.45,flat:1},ramp:{w:.86,l:1.3,flat:1},coin:{w:.55,l:.5}};
  const PICK={coin:1,cup:1};
  const CARCOL=['#5EC8F7','#E5484D','#9B7BE8','#F2A23A','#EDEFF2','#62C784','#FF8FB5','#8E9AA6'];
  const PAL={
    day:{sky:['#4FB6EE','#9BDAF8','#E2F5FF'],road:'#7B8592',road2:'#727C89',line:'#FFFFFF',side:'#D9CFBF',side2:'#CEC3B2',kerbA:'#E5484D',kerbB:'#FFFFFF',
      bld:['#FF8FB5','#FFC531','#8BD3B7','#9FB7E8','#F2A23A','#C9A0E8','#7FD1F0'],win:'#DDF4FF',lit:'#DDF4FF',far:'#9CC6DE',fog:'#CBE8F7',ground:'#BFB4A2',night:0,kind:'day'},
    night:{sky:['#070B26','#1A1D4E','#3A3070'],road:'#3A3B52',road2:'#35364C',line:'#CFD0E6',side:'#2E2C46',side2:'#29273F',kerbA:'#9C3A52',kerbB:'#8A8FAA',
      bld:['#242752','#2C2A5E','#1F2D57','#33295A','#28345E'],win:'#2C3263',lit:'#FFE58A',far:'#181A3E',fog:'#2C2860',ground:'#1E1C34',night:1,kind:'night'},
    dawn:{sky:['#2B2862','#874B88','#FF9575','#FFD9A0'],road:'#5E5A72',road2:'#58546B',line:'#F3E6E6',side:'#74668A',side2:'#6C5F82',kerbA:'#D85A6A',kerbB:'#EADDEA',
      bld:['#5A4A7E','#6B4F86','#4E4A78','#7A5280','#5F5A8C'],win:'#76689A',lit:'#FFD27A',far:'#4A3E70',fog:'#D79A9C',ground:'#5A4E6E',night:.55,kind:'dawn'}
  };
  const NAMES={kiana:'کیانا',hiroman:'هیرومن',arsi:'نور',nokhod:'نخود',saadi:'سعدی',anis:'انیس',golab:'خاله گلاب',gossip:'خانم غیبت‌چی',
    katy:'عمه کتی',zarrin:'زرین‌سبیل',guard:'نگهبان',lenz:'بازرس لنز',intern:'بهراد',foreman:'اوستا بتن',narrator:'راوی',javid:'آقا جاوید'};
  const FALLBACK={arsi:{skin:'#EDC3A0',hairCol:'#1E1E28',hair:'short',shirt:'#5EC8F7',shirt2:'#3FA9DD',pants:'#2E3440',glassesUp:true},
    saadi:{skin:'#E6B48F',hairCol:'#BFC4CC',hair:'cap',cap:'#2D3A66',shirt:'#33427A',pants:'#1E2547',mustache:'thick'},
    anis:{skin:'#F6D2B6',hairCol:'#2E1E1A',hair:'scarf',scarf:'#5EC8F7',shirt:'#FFC531',pants:'#3B3F6B',lashes:true},
    _:{skin:'#EDC3A0',hairCol:'#3A2A20',hair:'short',shirt:'#8FA0B2',pants:'#34405A'}};
  const nameOf=w=>(typeof PEOPLE!=='undefined'&&PEOPLE[w]&&PEOPLE[w].name)||NAMES[w]||w;
  function looks(w){let o=null;try{o=typeof lookOf==='function'?lookOf(w):null;}catch(e){}return o||FALLBACK[w]||FALLBACK._;}

  /* ---------- state ---------- */
  let S=null,paused=false,ptr=null,autoOn=false;
  const V={W:375,H:812,hy:276,K:1200,F:380,cx:187,camX:0};

  function start(def,opts){
    stop();
    const cd=Object.assign({vehicle:'car',mode:'catch',target:'van',targets:1,pursuer:'teavan',pursuers:1,length:60,traffic:.45,
      hazards:['cone','puddle','barrier'],coins:30,night:false,dawn:false,rider:null,lines:[]},(def&&def.chase)||{});
    opts=opts||{};const cf=opts.coffee||{speed:1},moto=cd.vehicle==='moto';
    if(cd.endless&&!(def&&def.chase&&def.chase.hazards))cd.hazards=['cone','puddle','barrier','bump','teaspill','ramp'];
    if(cd.endless&&!(def&&def.chase&&def.chase.traffic!=null))cd.traffic=.42;
    const coinsN=Math.max(0,cd.coins|0),groups=Math.ceil(coinsN/4),plan=[];
    for(let i=0,left=coinsN;i<groups;i++){const n=Math.min(4,left)-(i===groups-1?0:0);plan.push({p:.04+(i+.5)/groups*.72,n:i===groups-1?left:n});left-=n;}
    S={def,cd,opts,moto,catchMode:!cd.endless&&cd.mode!=='escape',endless:!!cd.endless,skin:pickSkin(moto?'moto':'car',opts.skin),best:Math.max(0,opts.best|0),rec:false,evtT:24,rain:0,dist:0,palSeq:null,pal:PAL[cd.night?'night':cd.dawn?'dawn':'day'],
      phase:'count',countT:0,lastN:-1,t:0,clock:0,z:0,v:0,vC:VB,cfMul:1+((cf.speed||1)-1)*.12,px:0,lane:1,tilt:0,qSteer:0,
      hits:0,inv:0,coins:0,coinsTotal:coinsN,coinsPlaced:0,plan,planI:0,
      nitro:Math.max(1,1+Math.round(((cf.speed||1)-1)*5)),nitroT:0,
      slideT:0,slideV:0,spin:0,airT:0,airDur:.95,bumpT:0,
      objs:[],fx:[],floats:[],booms:[],bq:[],bub:null,lineQ:(cd.lines||[]).slice().sort((a,b)=>(a[2]||0)-(b[2]||0)),
      shake:0,flash:0,flashCol:'255,255,255',curv:0,curvSeed:rnd(0,50),skyOff:0,engP:-1,hint:1,
      D:Math.max(20,cd.length||60)*VB*1.08,genZ:DP+PLEN+VB*2.6,p:0,gap:0,done:[],ended:false,result:null,endT:0};
    if(S.catchMode){S.tN=clamp(cd.targets|0||1,1,3);S.tI=0;S.closeFrac=.22;
      S.G0=VB*1.08*S.closeFrac*.88*(cd.length||60)/S.tN;spawnTarget();}
    else if(S.endless){S.purs=[];S.D=Infinity;S.coinsTotal=0;const st=cd.night?'night':cd.dawn?'dawn':'day',seq=['day','dawn','night','dawn'];
      const i0=st==='night'?2:st==='dawn'?1:0;S.palSeq=cd.rotate===false?null:[0,1,2,3].map(k=>seq[(i0+k)%4]);}
    else{S.purs=[];const n=clamp(cd.pursuers|0||1,1,3);
      for(let i=0;i<n;i++)S.purs.push({k:cd.pursuer||'teavan',i,st:'hold',rz:-15-i*4,hz:-13-i*4.5,x:LX(i%3),tx:LX(i%3),cool:4.5+i*3,t:0,rt:0,blink:0});}
    paused=false;ptr=null;
    au.sfx(moto?'motoRev':'engine');au.eng(true,.12);
  }
  function pickSkin(type,k){return VEHICLES[k]&&VEHICLES[k].type===type?k:(type==='moto'?'hiromoto':'dooshish');}
  function progP(z){return S.endless?1-Math.exp(-z/2600):clamp(z/S.D,0,1);}
  function lerpHex(a,b,k){const A=parseInt(a.slice(1),16),B=parseInt(b.slice(1),16),f=(x,y)=>Math.round(x+(y-x)*k);
    return'#'+((1<<24)|(f(A>>16,B>>16)<<16)|(f(A>>8&255,B>>8&255)<<8)|f(A&255,B&255)).toString(16).slice(1);}
  function skyAt(arr,q){const x=q*(arr.length-1),i=Math.min(arr.length-2,Math.floor(x));return lerpHex(arr[i],arr[i+1],x-i);}
  function mixPal(a,b,k){const o={};for(const key in a){const va=a[key],vb=b[key];
    if(key==='sky')o.sky=[0,1/3,2/3,1].map(q=>lerpHex(skyAt(a.sky,q),skyAt(b.sky,q),k));
    else if(typeof va==='number')o[key]=va+(vb-va)*k;
    else if(typeof va==='string'&&va[0]==='#'&&va.length===7&&typeof vb==='string'&&vb.length===7)o[key]=lerpHex(va,vb,k);
    else o[key]=k<.5?va:vb;}return o;}
  function spawnTarget(){
    const z=S.z+DP+PLEN+S.G0;
    S.tg={k:S.cd.target||'van',z,x:0,lane:1,st:'run',v:VB*(1-S.closeFrac),extra:0,lt:1,blink:0,t:0};S.gap=S.G0;
  }
  function stop(){au.eng(false);S=null;ptr=null;}
  function pause(on){paused=!!on;if(!S)return;if(paused)au.eng(false);else if(S.phase!=='end'||!S.ended){au.eng(true,Math.max(.1,S.engP));}}

  /* ---------- input ---------- */
  let probe=null; // reads env(safe-area-inset-*) through real padding (custom properties holding env() are not resolved everywhere)
  function safeIn(k){try{if(!probe){probe=document.createElement('div');probe.style.cssText='position:fixed;left:0;top:0;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)';document.body.appendChild(probe);}
    const key=innerWidth+'x'+innerHeight+k;if(safeIn.c&&safeIn.c[key]!=null)return safeIn.c[key];safeIn.c=safeIn.c||{};
    const cs=getComputedStyle(probe);return safeIn.c[key]=parseFloat(k==='--sat'?cs.paddingTop:k==='--sab'?cs.paddingBottom:k==='--sal'?cs.paddingLeft:cs.paddingRight)||0;}catch(e){return 0;}}
  function nitroBtn(){const W=vwN(),H=vhN(),r=40;return{x:W-16-r,y:H-18-r-safeIn('--sab'),r};}
  function vwN(){return typeof vw!=='undefined'&&vw?vw:V.W;}
  function vhN(){return typeof vh!=='undefined'&&vh?vh:V.H;}
  function steer(d){
    if(!S||S.phase==='end')return;
    if(S.slideT>0){S.qSteer=d;return;}
    const nl=clamp(S.lane+d,0,2);if(nl!==S.lane){S.lane=nl;S.hint=0;}
  }
  function useNitro(){
    if(!S||S.phase!=='go')return;
    if(S.nitroT>0)return;
    if(S.nitro<=0){au.sfx('error');return;}
    S.nitro--;S.nitroT=2.1;au.sfx('nitro');S.flash=Math.max(S.flash,.35);S.flashCol='255,214,90';
    floatText(S.moto?'وژژژژ!':'ویـــژ!',V.cx+(S.px-V.camX)*V.F/DP,V.hy+V.K/DP-70,'#FFC531');
  }
  function pointer(type,x,y){
    if(!S)return;
    if(type==='down'){const b=nitroBtn();if(Math.hypot(x-b.x,y-b.y)<b.r+12){useNitro();ptr=null;return;}
      ptr={x0:x,sx:x,t:now(),moved:false};}
    else if(type==='move'&&ptr){const dx=x-ptr.x0;if(Math.abs(dx)>=26){steer(dx>0?1:-1);ptr.x0=x;ptr.moved=true;}}
    else if(type==='up'&&ptr){if(!ptr.moved&&now()-ptr.t<450&&Math.abs(x-ptr.sx)<26)steer(x<vwN()/2?-1:1);ptr=null;}
  }
  function key(k){
    if(!S)return;
    if(k==='ArrowLeft'||k==='a'||k==='A')steer(-1);
    else if(k==='ArrowRight'||k==='d'||k==='D')steer(1);
    else if(k===' '||k==='Spacebar'||k==='ArrowUp'||k==='w'||k==='W')useNitro();
  }

  /* ---------- generation ---------- */
  function free(lane,z0,z1,ignore){
    const x=LX(lane);
    for(const o of S.objs){if(o===ignore||o.dead||PICK[o.k])continue;const d=DIM[o.k];if(d.flat&&o.k!=='ramp')continue;
      if(Math.abs(o.x-x)<.7&&o.z<z1&&o.z+d.l>z0)return false;}
    return true;
  }
  function add(k,lane,z,extra){const o=Object.assign({k,lane,x:LX(lane),z,v:0,v0:0,rot:0,fy:0,seed:Math.random()},extra||{});S.objs.push(o);return o;}
  function addTraffic(lane,zm,tau,p){
    const r=Math.random(),k=r<.18?'taxi':r<.33?'pickup':'car',v0=S.vC*rnd(.42,.54),z=zm-v0*tau;
    if(z<S.z+DP+PLEN+5)return;
    if(!free(lane,z-1.5,z+DIM[k].l+1.5))return;
    add(k,lane,z,{v0,v:v0,col:k==='taxi'?'#FFC531':k==='pickup'?'#3D7DD8':pick(CARCOL),tl:null,bt:0,lc:rnd(1,3)});
  }
  function genSlots(){
    const pf=S.z+DP+PLEN,look=S.vC*7.2;
    while(S.genZ<pf+look&&S.genZ<S.D-20){makeSlot(S.genZ);const p=progP(S.genZ);
      S.genZ+=S.vC*lerp(1.75,1.06,p)*(1.22-.38*clamp(S.cd.traffic,0,1))*(S.catchMode?1:S.endless?1.06:1.22);}
  }
  function makeSlot(zm){
    const cd=S.cd,p=progP(zm),UNL={bump:110,ramp:180,teaspill:330},hz=(cd.hazards||[]).filter(h=>DIM[h]&&(!S.endless||zm>=(UNL[h]||0))),pf=S.z+DP+PLEN,tau=Math.max(.4,(zm-pf)/S.vC);
    const wT=clamp(cd.traffic,0,1)*(S.catchMode?1:.85)+.08,wH=hz.length?.5+.15*p:0,wE=.16;
    const fl=Math.floor(Math.random()*3),others=[0,1,2].filter(l=>l!==fl),two=Math.random()<.12+.42*p;
    const lanes=two?others:[pick(others)];
    let r=Math.random()*(wT+wH+wE),coinLane=fl,ramp=false;
    if(S.endless&&S.rain>0){S.rain--;for(const L of[fl,pick(others)])for(let i=0;i<4;i++)add('coin',L,zm+(i-1.5)*1.5,{h:0});S.coinsPlaced+=8;return;}
    if(S.endless&&S.nitro<5&&Math.random()<.04)add('cup',fl,zm+3.5,{h:0});
    if(r<wT){for(const L of lanes)addTraffic(L,zm+rnd(-.5,.5),tau,p);}
    else if(r<wT+wH){
      const h=pick(hz);
      if(h==='cone'){for(const L of lanes){const n=Math.random()<.4+.3*p?2:1;for(let i=0;i<n;i++)add('cone',L,zm+i*1.1,{x:LX(L)+rnd(-.12,.12)});}}
      else if(h==='barrier'){for(const L of lanes)add('barrier',L,zm);}
      else if(h==='puddle'||h==='teaspill'){for(const L of (Math.random()<.5?lanes:[lanes[0]]))add(h,L,zm-.6);}
      else if(h==='bump'){add('bump',1,zm,{x:0});}
      else if(h==='ramp'){const L=lanes[0];add('ramp',L,zm-1.3);add('barrier',L,zm+2.6);
        if(S.endless||S.planI<S.plan.length){const g=S.endless?{n:4}:S.plan[S.planI++],ad=S.vC*S.airDur;
          for(let i=0;i<g.n;i++){const d=1.2+i*1.15;add('coin',L,zm+d,{h:Math.sin(Math.PI*clamp(d/ad,0,1))*.85+.1,air:true});S.coinsPlaced++;}}
        ramp=true;}
    }
    const due=S.endless?(!ramp&&Math.random()<.3):(!ramp&&S.planI<S.plan.length&&p>=S.plan[S.planI].p);
    if(due){
      const g=S.endless?{n:3+Math.floor(Math.random()*3)}:S.plan[S.planI++],kind=Math.random();
      if(kind<.62){for(let i=0;i<g.n;i++)add('coin',coinLane,zm+(i-(g.n-1)/2)*1.5,{h:0});}
      else{let L=coinLane;const z0=zm+3.2;for(let i=0;i<g.n;i++){add('coin',L,z0+i*1.9,{h:0});if(i%2===1)L=clamp(L+(L===0?1:L===2?-1:pick([-1,1])),0,2);}}
      S.coinsPlaced+=g.n;
    }
  }

  /* ---------- world update ---------- */
  function updPlayer(dt,p){
    S.vC=VB*(1+(S.endless?.5*p+Math.min(.35,S.z/45000):.2*p))*S.cfMul;
    let tv=S.vC;
    if(S.phase==='count')tv=0;
    else if(S.phase==='end')tv=S.reason==='escaped'?S.vC:0;
    if(S.nitroT>0){S.nitroT-=dt;if(S.phase==='go')tv=S.vC*1.55;}
    if(S.slideT>0)tv*=.85;
    const acc=S.v<tv?(S.nitroT>0?16:S.v<S.vC*.6?11:7):(S.phase==='end'?9:12);
    S.v+=clamp(tv-S.v,-acc*dt,acc*dt);
    if(S.phase==='end'&&S.reason==='caught'&&S.tg){const gp=S.tg.z-(S.z+DP+PLEN);if(gp<3.2)S.v=Math.min(S.v,Math.max(0,S.tg.v*(gp-.6)/2.6));}
    if(S.slideT>0){
      S.slideT-=dt;S.px=clamp(S.px+S.slideV*dt,-1.1,1.1);S.tilt=Math.sin(S.clock*22)*.12;
      if(S.slideT<=0){S.lane=clamp(Math.round(S.px)+1,0,2);if(S.qSteer){const q=S.qSteer;S.qSteer=0;steer(q);}}
    }else{
      const tx=LX(S.lane),k=1-Math.exp(-dt*(S.moto?15:11.5)),dx=(tx-S.px)*k;S.px+=dx;
      S.tilt=lerp(S.tilt,clamp(dx/Math.max(dt,1e-3)*.05,-.16,.16),Math.min(1,dt*12));
    }
    if(S.phase==='end'&&S.reason==='crashed')S.tilt+=dt*(S.v*.5);
    S.z+=S.v*dt;
    if(S.airT>0){S.airT-=dt;if(S.airT<=0){S.airT=0;au.sfx('thud');S.shake=Math.max(S.shake,.2);dust(10);}}
    if(S.bumpT>0)S.bumpT=Math.max(0,S.bumpT-dt);
    S.inv=Math.max(0,S.inv-dt);
    // road curvature (purely visual)
    const zz=S.z;S.curv=(.0062*Math.sin(zz*.011+S.curvSeed)+.0028*Math.sin(zz*.029+S.curvSeed*2))*Math.min(1,zz/90);
    S.skyOff+=S.curv*S.v*dt*900;
  }
  function airH(){if(S.airT>0){const k=1-S.airT/S.airDur;return Math.sin(Math.PI*k)*.85;}if(S.bumpT>0)return Math.sin(Math.PI*(1-S.bumpT/.35))*.16;return 0;}

  function updObjs(dt,p){
    const pf=S.z+DP+PLEN;
    for(const o of S.objs){
      if(o.dead)continue;
      if(o.fly){const f=o.fly;f.t+=dt;o.z+=f.vz*dt;o.x+=f.vx*dt;o.rot+=f.vr*dt;if(o.v0===0&&!f.fade)o.rot=clamp(o.rot,-.45,.45);f.vz*=Math.pow(.25,dt);f.vx*=Math.pow(.3,dt);
        o.fy=Math.max(0,f.vy*f.t-4.5*f.t*f.t);if(f.fade&&f.t>1.1)o.dead=true;continue;}
      if(!o.v0)continue;
      const d=DIM[o.k];let lim=o.v0,blocked=false;
      for(const q of S.objs){if(q===o||q.dead||PICK[q.k])continue;const qd=DIM[q.k];if(qd.flat)continue;
        if(Math.abs(q.x-o.x)<.72&&q.z>o.z&&q.z-(o.z+d.l)<3.2){lim=Math.min(lim,q.fly?0:(q.v||0));if(!q.v0||q.v<o.v0*.8)blocked=true;}}
      if(S.tg&&S.tg.st==='run'&&Math.abs(S.tg.x-o.x)<.7&&S.tg.z<o.z&&o.z-S.tg.z<4){}
      // lane changes: avoid blockers, later in the run also random weaving
      o.lc-=dt;
      if(o.tl==null&&(blocked||(p>.3&&o.lc<=0&&Math.random()<.35*p))){
        o.lc=rnd(1.5,3.5);
        const opts=[o.lane-1,o.lane+1].filter(l=>l>=0&&l<=2&&free(l,o.z-2.6,o.z+d.l+4.5,o)&&!(Math.abs(LX(l)-S.px)<.8&&o.z<pf+16&&o.z+d.l>S.z+DP-2.5)&&!(Math.abs(LX(l)-LX(S.lane))<.1&&o.z<pf+16));
        if(opts.length){o.tl=pick(opts);o.bt=.55;}
      }
      if(o.tl!=null&&o.tl!==o.lane&&Math.abs(LX(o.tl)-S.px)<.8&&o.z<pf+9&&o.z+d.l>S.z+DP-2)o.tl=o.lane;
      if(o.tl!=null){o.bt-=dt;if(o.bt<=0){const tx=LX(o.tl);o.x+=clamp(tx-o.x,-1.7*dt,1.7*dt);if(Math.abs(tx-o.x)<.01){o.x=tx;o.lane=o.tl;o.tl=null;}}}
      const tv=blocked&&o.tl!=null?Math.min(lim+2,o.v0):lim;
      o.v+=clamp(tv-o.v,-11*dt,4*dt);o.z+=o.v*dt;
    }
    S.objs=S.objs.filter(o=>!o.dead&&o.z+DIM[o.k].l>S.z-1.5);
  }

  function updTarget(dt,p){
    const g=S.tg;
    for(const d of S.done){d.t+=dt;d.v=Math.max(0,d.v-8*dt);d.z+=d.v*dt;d.x+=clamp(2.2-d.x,-1.8*dt,1.8*dt);}
    S.done=S.done.filter(d=>d.z>S.z-2);
    if(!g)return;
    g.t+=dt;
    if(g.st==='run'){
      const vT=VB*(1+.2*p)*(1-S.closeFrac);let mv=vT*dt;
      if(g.extra>0){const e=Math.min(g.extra,8*dt);g.extra-=e;mv+=e;}
      if(S.phase==='end'&&S.reason==='lost')mv=vT*1.25*dt;
      g.v=mv/Math.max(dt,1e-4);g.z+=mv;
      g.lt-=dt;
      if(g.lt<=0){g.lt=rnd(.5,1.2);
        const bl=l=>!free(l,g.z-1.5,g.z+DIM[g.k].l+9);
        if(bl(g.lane)){const o=[g.lane-1,g.lane+1].filter(l=>l>=0&&l<=2&&!bl(l));if(o.length){g.lane=pick(o);}}
        else if(Math.random()<.22){const o=[g.lane-1,g.lane+1].filter(l=>l>=0&&l<=2&&!bl(l));if(o.length)g.lane=pick(o);}}
      g.x+=clamp(LX(g.lane)-g.x,-2.2*dt,2.2*dt);
      S.gap=g.z-(S.z+DP+PLEN);
      if(S.gap<=.35&&S.phase==='go')caught();
    }else{g.v=Math.max(0,g.v-9*dt);g.z+=g.v*dt;g.x+=clamp(2.2-g.x,-1.8*dt,1.8*dt);}
  }
  function caught(){
    const g=S.tg;g.st='pulled';g.t=0;S.tI++;
    const [sx,sy]=P3(g.x,Math.max(DP+1,g.z-S.z),.6);
    boom(S.tI>=S.tN?'گرفتمت!':'یکی گرفتم!',sx,sy-30,'#FFE14D');
    au.sfx('boom');setTimeout(()=>au.sfx('brake'),180);
    S.shake=Math.max(S.shake,.35);stars(sx,sy-20,14);
    if(S.tI>=S.tN){endRun('caught');}
    else{S.done.push(g);spawnTarget();S.tg.lane=pick([0,1,2]);S.tg.x=LX(S.tg.lane);
      setTimeout(()=>{if(S)floatText(fa(S.tI)+' از '+fa(S.tN)+' — بعدی!',V.W/2,V.H*.56,'#fff',30);},900);}
  }

  function updPursuers(dt,p){
    if(!S.purs)return;
    const apr=lerp(3.2,4.8,p),react=lerp(.9,.55,p),lockD=lerp(3.4,3.9,p),pw=S.moto?.42:.74;
    let busy=S.purs.some(q=>q.st!=='hold');
    for(const q of S.purs){
      const d=DIM[q.k];q.t+=dt;
      if(S.phase==='end'){q.rz-=(S.reason==='escaped'?9:2)*dt;q.spin=(q.spin||0)+(S.reason==='escaped'?dt*6:0);continue;}
      if(q.st==='hold'){q.rz+=clamp(q.hz-q.rz,-5*dt,5*dt);q.cool-=dt;q.tx=LX(S.lane);
        if(q.cool<=0&&!busy&&S.inv<=0&&S.phase==='go'&&S.p<.97){q.st='chase';q.t=0;q.rt=0;q.lock=false;busy=true;au.sfx('siren');}}
      else if(q.st==='chase'){
        q.rz+=(apr+Math.max(0,S.vC-S.v)*.35)*dt;q.rt-=dt;
        if(!q.lock&&q.rz+d.l>-lockD){q.lock=true;q.tx=Math.round(q.tx);au.sfx('honk');}
        if(!q.lock&&q.rt<=0){q.rt=react;q.tx=LX(S.lane);}
        if(q.rz+d.l>=-.05){
          if(Math.abs(q.x-S.px)<(d.w+pw)/2-.12){if(canHit())crash(q,true);q.st='back';q.t=0;S.v+=4;}
          else{q.st='pass';q.t=0;q.tx=clamp(Math.round(q.x),-1,1);}
        }
      }else if(q.st==='pass'){q.rz+=3.8*dt;if(q.rz>=PLEN+1.4){q.st='cut';q.t=0;q.ctx=null;}}
      else if(q.st==='cut'){q.rz+=.4*dt;
        if(q.t<.55){q.blink=Math.sign(LX(S.lane)-q.x)||0;q.tx=q.x;}
        else{if(q.ctx==null){q.ctx=LX(S.lane);if(Math.abs(q.ctx-q.x)<.1){q.ctx=q.x;}au.sfx('honk');}q.tx=q.ctx;}
        if(q.t>1.25){q.st='brake';q.t=0;q.blink=0;au.sfx('brake');}}
      else if(q.st==='brake'){q.rz-=6*dt;if(q.rz<-5.5){q.st='back';q.t=0;}}
      else if(q.st==='back'){q.rz-=4.5*dt;q.blink=0;if(q.rz<=q.hz&&q.once){q.gone=true;}else if(q.rz<=q.hz){q.st='hold';q.cool=lerp(4.2,2.4,p)+rnd(0,1.4);}}
      const ls=q.st==='cut'?3.4:2.4;q.x+=clamp(q.tx-q.x,-ls*dt,ls*dt);q.x=clamp(q.x,-1,1);
      if((q.st==='pass'||q.st==='cut'||q.st==='brake')&&q.rz<PLEN&&q.rz+d.l>0&&Math.abs(q.x-S.px)<(d.w+pw)/2-.1){
        if(q.st==='pass'&&q.rz<.3){q.st='back';q.t=0;au.sfx('brake');}else{if(canHit())crash(q,true);q.st='back';q.t=0;}}
    }
  }
  function cleanPurs(){if(S.purs)S.purs=S.purs.filter(q=>!q.gone);}
  const canHit=()=>S.inv<=0&&S.airT<=0&&S.phase==='go';

  function collide(){
    const pr=S.z+DP,pf=pr+PLEN,pw=S.moto?.42:.74,inAir=S.airT>0,h=airH();
    for(const o of S.objs){
      if(o.dead||o.hit||o.fly)continue;const d=DIM[o.k];
      if(o.z>pf||o.z+d.l<pr)continue;
      if(Math.abs(o.x-S.px)>(d.w+pw)/2-.07)continue;
      const k=o.k;
      if(k==='cup'){if(h>.5)continue;o.dead=true;S.nitro=Math.min(9,S.nitro+1);au.sfx('sip');const [sx,sy]=P3(o.x,o.z-S.z,.4);sparkle(sx,sy);floatText('+۱ نیترو',sx,sy-20,'#FFD25E',22);continue;}
      if(k==='coin'){if(o.air&&!inAir)continue;if(!o.air&&h>.5)continue;o.dead=true;S.coins++;au.sfx('coin');
        const [sx,sy]=P3(o.x,o.z-S.z,(o.h||0)+.3);sparkle(sx,sy);floatText('+۱',sx,sy-16,'#FFE14D',20);continue;}
      if(inAir||(S.bumpT>0&&d.flat))continue;
      if(k==='puddle'||k==='teaspill'){o.hit=true;slide(k==='teaspill'?1:.8,k==='teaspill'?.85:.6);
        const [sx,sy]=P3(S.px,DP+.5);splash(sx,sy,k==='teaspill'?'#9C8A3E':'#8FD3F7');
        floatText(k==='teaspill'?'چای!':'شلپ!',sx,sy-90,k==='teaspill'?'#C9B04A':'#BDEFFF',24);au.sfx(k==='teaspill'?'skid':'splash');if(k==='puddle')au.sfx('skid');continue;}
      if(k==='bump'){o.hit=true;S.bumpT=.35;S.v*=.88;au.sfx('thud');S.shake=Math.max(S.shake,.15);continue;}
      if(k==='ramp'){o.hit=true;S.airT=S.airDur;S.v=Math.max(S.v,S.vC);au.sfx('whoosh');floatText('هوپ!',V.W/2,V.hy+V.K/DP-110,'#fff',26);continue;}
      if(S.inv>0||S.phase!=='go'){o.hit=true;continue;}
      crash(o,false);
    }
  }
  function slide(str,dur){
    if(S.slideT>0)return;
    const dir=S.px<=-.6?1:S.px>=.6?-1:(Math.random()<.5?-1:1);
    S.slideT=dur;S.slideV=dir*str/dur;S.spin=dur;S.v*=.9;
    if(S.catchMode&&S.tg)S.tg.extra+=1.2;
  }
  function crash(o,isPursuer){
    (S.log||(S.log=[])).push({k:o.k,t:+S.t.toFixed(1),px:+S.px.toFixed(2),ox:+o.x.toFixed(2),lane:S.lane,slide:S.slideT>0,pur:isPursuer,st:o.st,tl:o.tl,lock:o.lock,tx:o.tx,rz:o.rz});S.hits++;S.inv=1.7;S.v=Math.max(2.5,S.v*.32);S.nitroT=0;S.shake=.6;S.flash=1;S.flashCol='255,90,90';
    au.sfx('crash');setTimeout(()=>au.sfx(isPursuer?'honk':'honk'),200);
    const sd=Math.sign(o.x-S.px)||(Math.random()<.5?-1:1);
    if(!isPursuer){
      o.hit=true;
      if(o.v0){o.fly={vx:sd*rnd(1,1.8),vz:S.v*.5+2,vy:0,vr:sd*rnd(1.5,3),t:0};o.v0=0;}
      else o.fly={vx:sd*rnd(1.5,3),vz:6+S.v*.2,vy:k2(o.k),vr:sd*rnd(6,12),t:0,fade:true};
    }
    if(S.catchMode&&S.tg)S.tg.extra+=5;
    const [sx,sy]=P3(S.px,DP+PLEN*.6,.4);stars(sx,sy-20,18);
    floatText(pick(['آخ!','اوخ!','ای وای!','دوشیشم!']).replace('دوشیشم!',S.moto?'وای!':S.skin==='dooshish'?'دوشیشم!':'ماشینم!'),sx,sy-80,'#FF6B6E',30);
    if(S.hits>=3)endRun('crashed');
  }
  const k2=k=>k==='cone'?6:k==='barrier'?4:0;

  function endRun(reason){
    if(S.phase==='end')return;
    S.phase='end';S.reason=reason;S.endT=0;S.nitroT=0;
    const win=reason==='caught'||reason==='escaped';
    S.dist=Math.max(0,Math.round(S.z*3.5));
    S.result={win:S.endless?S.rec:win,reason,t:+S.t.toFixed(2),hits:S.hits,coins:S.coins,coinsTotal:S.endless?S.coinsPlaced:S.coinsTotal,distance:S.dist,skin:S.skin};
    if(S.endless){S.result.endless=true;S.result.record=S.rec;}
    const cy=V.H*.38;
    if(reason==='escaped'){boom('در رفتیم!',V.W/2,cy,'#8BD3B7');au.sfx('boom');au.sfx('honk');
      if(S.purs)for(const q of S.purs){q.st='spin';}}
    else if(reason==='crashed'){boom(S.endless?(S.rec?'رکورد جدید!':fa(S.dist)+' متر!'):S.moto?'وای! افتادیم!':S.skin==='dooshish'?'دوشیش ترکید!':'ماشینم ترکید!',V.W/2,cy,S.endless&&S.rec?'#FFE14D':'#FF8A8A');au.sfx('skid');setTimeout(()=>au.sfx('crash'),120);}
    else if(reason==='lost'){boom('در رفت!',V.W/2,cy,'#C9A0E8');au.sfx('brake');}
  }

  /* ---------- particles & texts (screen space) ---------- */
  function floatText(text,x,y,col,size){S.floats.push({text,x,y,col:col||'#fff',size:size||26,t:0});}
  function boom(text,x,y,col){S.booms.push({text,x,y,col:col||'#FFE14D',t:0});}
  function stars(x,y,n){for(let i=0;i<n;i++){const a=rnd(0,TAU),s=rnd(120,320);S.fx.push({k:'star',x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-80,g:500,t:0,life:rnd(.5,.8),r:rnd(5,10),col:pick(['#FFE14D','#FFC531','#fff','#FF8A8A'])});}}
  function sparkle(x,y){for(let i=0;i<7;i++){const a=i/7*TAU;S.fx.push({k:'star',x,y,vx:Math.cos(a)*120,vy:Math.sin(a)*120,g:0,t:0,life:.4,r:5,col:'#FFE58A'});}}
  function splash(x,y,col){for(let i=0;i<16;i++){const a=rnd(-P*.95,-P*.05),s=rnd(120,300);S.fx.push({k:'drop',x:x+rnd(-30,30),y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,g:900,t:0,life:.6,r:rnd(3,6),col});}}
  function dust(n){const [sx,sy]=P3(S.px,DP+.2);for(let i=0;i<n;i++)S.fx.push({k:'puff',x:sx+rnd(-40,40),y:sy,vx:rnd(-80,80),vy:rnd(-60,-10),g:0,t:0,life:.6,r:rnd(8,14),col:'rgba(220,220,230,.7)'});}

  /* ---------- main update ---------- */
  function update(dt){
    if(!S||paused)return;
    dt=Math.min(dt||0,.05);S.clock+=dt;
    if(S.phase==='count'){
      S.countT+=dt;const n=Math.floor(S.countT/.8);
      if(n!==S.lastN&&n<3){S.lastN=n;au.sfx('tick');if(n===1)au.sfx(S.moto?'motoRev':'honk');}
      if(S.countT>=2.4){S.phase='go';au.sfx('ding');au.sfx(S.moto?'motoRev':'engine');au.mus('chase');}
    }
    const pfz=S.z+DP+PLEN,p=progP(pfz);S.p=p;
    if(S.phase==='go'){S.t+=dt;genSlots();if(autoOn)autopilot();if(S.endless)endlessTick(dt);}
    S.dist=Math.max(0,Math.round(S.z*3.5));
    if(S.endless&&S.palSeq){const st=S.dist/1400,i=Math.floor(st),f=st-i,k=f>.78?(f-.78)/.22:0,A=PAL[S.palSeq[i%4]],B=PAL[S.palSeq[(i+1)%4]];S.pal=k>0?mixPal(A,B,k):A;}
    updPlayer(dt,p);updObjs(dt,p);
    if(S.phase!=='count'){if(S.catchMode)updTarget(dt,p);else updPursuers(dt,p);}
    cleanPurs();
    if(S.phase==='go'){collide();if(S.z+DP+PLEN>=S.D)endRun(S.catchMode?'lost':'escaped');}
    // lines / bubbles
    if(S.phase!=='count')while(S.lineQ.length&&S.t>=(S.lineQ[0][2]||0)){const l=S.lineQ.shift();S.bq.push({who:l[0],text:l[1],think:l[3]==='think'});}
    if(S.bub){S.bub.t+=dt;if(S.bub.t>S.bub.dur*(S.bq.length?.8:1))S.bub=null;}
    if(!S.bub&&S.bq.length){const b=S.bq.shift();b.t=0;b.dur=clamp(1.7+b.text.length*.055,2.6,5.4);S.bub=b;au.say(b.who,b.text,b.think);}
    // fx
    for(const f of S.fx){f.t+=dt;f.x+=f.vx*dt;f.y+=f.vy*dt;f.vy+=(f.g||0)*dt;}
    S.fx=S.fx.filter(f=>f.t<f.life);
    for(const f of S.floats)f.t+=dt;S.floats=S.floats.filter(f=>f.t<1.2);
    for(const b of S.booms)b.t+=dt;S.booms=S.booms.filter(b=>b.t<(S.phase==='end'?99:1.3));
    S.shake=Math.max(0,S.shake-dt*1.4);S.flash=Math.max(0,S.flash-dt*3);S.spin=Math.max(0,S.spin-dt);
    if(S.hint&&S.t>4)S.hint=0;
    // exhaust
    if(S.phase!=='end'&&Math.random()<dt*(S.nitroT>0?30:8)){const [sx,sy]=P3(S.px+(S.moto?.08:-.22),DP,airH()+.12);
      S.fx.push({k:'puff',x:sx,y:sy,vx:rnd(-30,30),vy:rnd(20,60),g:0,t:0,life:.5,r:rnd(4,7),col:S.nitroT>0?'rgba(255,170,60,.8)':'rgba(200,200,210,.55)'});}
    // engine hum
    const ep=S.phase==='end'&&S.ended?0:clamp(S.v/(VB*1.75),.08,1);
    if(Math.abs(ep-S.engP)>.03&&!S.ended){S.engP=ep;au.eng(true,ep);}
    if(S.phase==='end'){S.endT+=dt;
      if(S.endT>2.6&&!S.ended){S.ended=true;au.eng(false);const cb=S.opts.onEnd;if(cb)try{cb(S.result);}catch(e){console.error(e);}}}
  }
  function endlessTick(dt){
    if(S.best>0&&!S.rec&&S.dist>S.best){S.rec=true;au.sfx('star',2);floatText('رکورد!',V.W/2,V.H*.3,'#FFE14D',44);S.flash=Math.max(S.flash,.4);S.flashCol='255,225,80';}
    S.evtT-=dt;if(S.evtT>0)return;
    S.evtT=rnd(26,42)*(1-.25*S.p);
    const busy=S.purs.length>0;
    if(!busy&&S.t>20&&Math.random()<.55){S.purs.push({k:'teavan',i:0,st:'chase',rz:-20,hz:-18,x:LX(S.lane),tx:LX(S.lane),cool:99,t:0,rt:0,blink:0,once:true,lock:false});
      au.sfx('siren');floatText('وانت چای پشت سرته!',V.W/2,V.H*.62,'#8BD3B7',24);}
    else{S.rain=6;au.sfx('magic');floatText('بارون سکه!',V.W/2,V.H*.46,'#FFE14D',36);}
  }
  function autopilot(){
    const pr=S.z+DP,danger=l=>{let best=99;for(const o of S.objs){if(o.dead||o.hit||PICK[o.k]||o.k==='bump')continue;const d=DIM[o.k];
      if(Math.abs(o.x-LX(l))<.75&&o.z+d.l>pr-.2&&o.z<pr+16){best=Math.min(best,o.z-pr);}}
      if(S.purs)for(const q of S.purs)if((q.st==='cut'||q.st==='brake'||q.st==='pass')&&Math.abs(q.x-LX(l))<.75)best=Math.min(best,Math.max(0,q.rz));
      return best;};
    const cur=danger(S.lane);
    if(S.purs)for(const q of S.purs)if(q.st==='chase'&&q.lock&&Math.abs(q.tx-S.px)<.5){const opts=[S.lane-1,S.lane+1].filter(l=>l>=0&&l<=2).sort((a,b)=>danger(b)-danger(a));if(opts.length&&danger(opts[0])>3){steer(opts[0]-S.lane);return;}}
    if(cur<14){let bl=S.lane,bd=cur;for(const l of[S.lane-1,S.lane+1])if(l>=0&&l<=2){const dd=danger(l);if(dd>bd+.5){bd=dd;bl=l;}}if(bl!==S.lane)steer(bl-S.lane);}
    else if(S.purs){for(const q of S.purs)if(q.st==='chase'&&q.lock&&Math.abs(q.tx-S.px)<.5){const l=S.lane===1?pick([0,2]):1;if(danger(l)>8)steer(l-S.lane);}}
    if(S.nitro>0&&S.t>8&&S.nitroT<=0&&cur>30&&Math.random()<.01)useNitro();
  }

  /* ============================================================
     RENDER
     ============================================================ */
  function setView(){
    const W=vwN(),H=vhN();V.W=W;V.H=H;
    V.hy=Math.round(Math.max(150,H*.34));
    const py=H-Math.max(118,H*.15),roadPx=Math.min(W*1.02,H*.9);
    const sp=S?clamp(S.v/Math.max(1,S.vC)-1,0,.6):0;
    V.K=(py-V.hy)*DP;V.F=roadPx*DP/3*(1-sp*.12);V.cx=W/2;V.camX=S?S.px*.6:0;
  }
  function P3(x,dz,h){const sc=V.F/dz,off=S?S.curv*dz*dz*.5:0;return[V.cx+(x+off-V.camX)*sc,V.hy+V.K/dz-(h||0)*sc,sc];}
  function quad(c,xl,xr,a,b,col,ha,hb){const p1=P3(xl,a,ha),p2=P3(xr,a,ha),p3=P3(xr,b,hb),p4=P3(xl,b,hb);
    c.fillStyle=col;c.beginPath();c.moveTo(p1[0],p1[1]+.6);c.lineTo(p2[0],p2[1]+.6);c.lineTo(p3[0],p3[1]);c.lineTo(p4[0],p4[1]);c.closePath();c.fill();}
  function glow(c,x,y,r,rgb,a){if(r<1)return;const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba('+rgb+','+a+')');g.addColorStop(1,'rgba('+rgb+',0)');c.fillStyle=g;c.fillRect(x-r,y-r,2*r,2*r);}

  function drawSky(c){
    const pal=S.pal,W=V.W,H=V.H,hy=V.hy;
    const g=c.createLinearGradient(0,0,0,hy+10);pal.sky.forEach((s,i)=>g.addColorStop(i/(pal.sky.length-1),s));c.fillStyle=g;c.fillRect(0,0,W,hy+12);
    const so=S.skyOff;
    if(pal.night>.9){c.fillStyle='#fff';for(let i=0;i<60;i++){const k=(Math.sin(S.clock*2+i)+1)/2;c.globalAlpha=.35+k*.6;circ(c,((hsh(i)*W*1.4-so*.2)%(W*1.4)+W*1.4)%(W*1.4)-W*.2,hsh(i+50)*hy*.85,.8+hsh(i+9)*1.3);c.fill();}c.globalAlpha=1;
      const mx=((W*.78-so*.25)%(W*1.3)+W*1.3)%(W*1.3)-W*.15;const my=hy-62;c.fillStyle='#FFF4C9';circ(c,mx,my,Math.min(W,H)*.05);c.fill();c.fillStyle=pal.sky[1];circ(c,mx+W*.018,my-3,Math.min(W,H)*.045);c.fill();}
    else if(pal.kind==='dawn'){const sx=((W*.5-so*.25)%(W*1.4)+W*1.4)%(W*1.4)-W*.2,sy=hy-8-Math.min(30,S.t*.6);glow(c,sx,sy,W*.45,'255,210,140',.55);
      c.fillStyle='#FFE08A';circ(c,sx,sy,W*.11);c.fill();c.fillStyle='rgba(255,255,255,.7)';for(let i=0;i<14;i++){circ(c,hsh(i)*W,hsh(i+20)*hy*.35,1);c.fill();}}
    else{c.fillStyle='#FFE58A';const sx=((W*.82-so*.25)%(W*1.4)+W*1.4)%(W*1.4)-W*.2;glow(c,sx,hy-66,W*.25,'255,240,170',.6);circ(c,sx,hy-66,W*.06);c.fill();
      for(let i=0;i<5;i++){const x=((hsh(i)*W*1.6-so*.35-S.clock*6*(1+i*.2))%(W*1.6)+W*1.6)%(W*1.6)-W*.3;cloud(c,x,hy*(.25+hsh(i+3)*.4),12+hsh(i+5)*14,'rgba(255,255,255,.92)');}}
    // skyline silhouettes
    const SW=W+200;
    for(let lay=0;lay<2;lay++){c.fillStyle=lay?shade(pal.far,-.12):pal.far;const par=lay?.6:.35;
      for(let i=0;i<16;i++){const bw=34+hsh(i*3+lay)*46,bh=(lay?14:26)+hsh(i*7+lay*5)*(lay?36:56),x=((i*SW/16-so*par)%SW+SW)%SW-100;
        c.fillRect(x,hy-bh+2,bw,bh);if(pal.night>.4){c.fillStyle=pal.lit;c.globalAlpha=.6;for(let k=0;k<4;k++)if(hsh(i*11+k+lay)>.5)c.fillRect(x+5+k*8%(bw-8),hy-bh+6+(k*9)%(bh-8),3,4);c.globalAlpha=1;c.fillStyle=lay?shade(pal.far,-.12):pal.far;}}}
  }

  function drawRoad(c){
    const pal=S.pal,z0=S.z,i0=Math.floor((z0+1)/SEG),iN=Math.floor((z0+DRAW)/SEG);
    c.fillStyle=pal.ground;c.fillRect(0,V.hy,V.W,V.H-V.hy);
    for(let i=iN;i>=i0;i--){
      const a=Math.max(1,i*SEG-z0),b=Math.min(DRAW,(i+1)*SEG-z0);if(b<=a)continue;const alt=i&1;
      quad(c,-3.1,3.1,a,b,alt?pal.side:pal.side2);
      quad(c,-1.66,1.66,a,b,alt?pal.kerbA:pal.kerbB);
      quad(c,-1.5,1.5,a,b,alt?pal.road:pal.road2);
      if((i&3)<2){quad(c,-.535,-.465,a,b,pal.line);quad(c,.465,.535,a,b,pal.line);}
      if(S.D-z0-DP<DRAW&&i*SEG<=S.D&&(i+1)*SEG>S.D){for(let k=0;k<8;k++)quad(c,-1.5+k*.375,-1.5+(k+1)*.375,a,b,(k+i)&1?'#fff':INK);}
    }
    // pursuers' headlights sweeping in from behind
    if(S.purs)for(const q of S.purs){if(q.st!=='chase'||q.rz<-14)continue;const k=clamp((q.rz+14)/12,0,1),x=q.lock?q.tx:q.x;
      const a1=P3(x-.35,1.05),a2=P3(x+.35,1.05),b1=P3(x-.6,DP+3+k*4),b2=P3(x+.6,DP+3+k*4);
      const g=c.createLinearGradient(0,a1[1],0,b1[1]);g.addColorStop(0,'rgba(255,240,190,'+(.18+.32*k)+')');g.addColorStop(1,'rgba(255,240,190,0)');
      c.save();c.globalCompositeOperation=pal.night>.3?'lighter':'source-over';c.fillStyle=g;c.beginPath();c.moveTo(a1[0],a1[1]);c.lineTo(a2[0],a2[1]);c.lineTo(b2[0],b2[1]);c.lineTo(b1[0],b1[1]);c.closePath();c.fill();c.restore();}
    // night: lamp pools + headlights
    if(pal.night>.3){
      c.save();c.globalCompositeOperation='lighter';
      for(let j=Math.floor(z0/10);j<=Math.floor((z0+DRAW)/10);j++)for(const sd of[-1,1]){const zz=j*10+(sd>0?5:0),dz=zz-z0;if(dz<1.2||dz>DRAW-4)continue;
        const [sx,sy,sc]=P3(sd*1.05,dz);c.save();c.translate(sx,sy);c.scale(1,.32);glow(c,0,0,sc*1.3,'255,214,120',.22*pal.night);c.restore();}
      const a1=P3(S.px-.3,DP+PLEN),a2=P3(S.px+.3,DP+PLEN),b1=P3(S.px-1.25,DP+15),b2=P3(S.px+1.25,DP+15);
      const g=c.createLinearGradient(0,a1[1],0,b1[1]);g.addColorStop(0,'rgba(255,236,170,'+(.30*pal.night)+')');g.addColorStop(1,'rgba(255,236,170,0)');
      c.fillStyle=g;c.beginPath();c.moveTo(a1[0],a1[1]);c.lineTo(a2[0],a2[1]);c.lineTo(b2[0],b2[1]);c.lineTo(b1[0],b1[1]);c.closePath();c.fill();
      c.restore();
    }
    // horizon haze
    const g=c.createLinearGradient(0,V.hy-4,0,V.hy+26);g.addColorStop(0,S.pal.fog);g.addColorStop(1,'rgba(0,0,0,0)');c.globalAlpha=.75;c.fillStyle=g;c.fillRect(0,V.hy-4,V.W,30);c.globalAlpha=1;
  }

  /* ----- roadside scenery ----- */
  function building(c,sd,j){
    const seed=j*2+(sd>0?1:0),z0=S.z;if(hsh(seed*4.7+1)>.86)return null;
    const gap=.9+hsh(seed*3.1)*1.6,zn=j*CL+gap,zf=(j+1)*CL,h=2+hsh(seed*1.7)*3.6,x0=2.8+hsh(seed*2.9)*.5,dep=3.2;
    const pal=S.pal,col=pal.bld[Math.floor(hsh(seed*5.3)*pal.bld.length)];
    const dn=Math.max(1.05,zn-z0),df=Math.min(DRAW,zf-z0);if(df<=dn)return null;
    return{d:df,f:()=>{
      const fade=clamp((DRAW-dn)/10,0,1);c.globalAlpha=fade;
      const X=sd*x0,X2=sd*(x0+dep);
      // road-facing wall
      const wcol=shade(col,-.2);
      const q=[P3(X,dn,0),P3(X,df,0),P3(X,df,h),P3(X,dn,h)];
      c.fillStyle=wcol;c.beginPath();q.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();c.fill();
      c.lineWidth=Math.max(1,Math.min(3,q[0][2]*.025));c.strokeStyle=INK;c.stroke();
      // awning / shop band
      if(df-dn>.5){const ac=hsh(seed*9.1)>.5?'#FF6B6E':'#2BB59A';quad3(c,X,dn,df,.95,1.15,ac);}
      // windows
      if(q[0][2]>6){const nf=Math.floor((h-1.3)/.85),wl=[];for(let zz=Math.ceil((zn+.35)/1.25)*1.25;zz<zf-.4;zz+=1.25){const dz=zz-z0;if(dz<dn||dz>df-.3)continue;
        for(let f=0;f<nf;f++){const y0=1.5+f*.85;wl.push(dz,y0,hsh(zz*3.3+f*7.1+seed)>.42?1:0);}}
        for(const on of[1,0]){c.fillStyle=on?pal.lit:pal.win;c.beginPath();for(let i=0;i<wl.length;i+=3){if(wl[i+2]!==on)continue;const dz=wl[i],y0=wl[i+1],p1=P3(X,dz,y0),p2=P3(X,dz+.55,y0),p3=P3(X,dz+.55,y0+.5),p4=P3(X,dz,y0+.5);c.moveTo(p1[0],p1[1]);c.lineTo(p2[0],p2[1]);c.lineTo(p3[0],p3[1]);c.lineTo(p4[0],p4[1]);c.closePath();}c.fill();}}
      // near face (visible end)
      if(zn-z0>=1.05){const a=P3(X,dn,0),b=P3(X2,dn,0),hh=h*a[2];
        c.fillStyle=col;c.fillRect(Math.min(a[0],b[0]),a[1]-hh,Math.abs(b[0]-a[0]),hh);c.strokeRect(Math.min(a[0],b[0]),a[1]-hh,Math.abs(b[0]-a[0]),hh);
        c.fillStyle=shade(col,.15);c.fillRect(Math.min(a[0],b[0]),a[1]-hh,Math.abs(b[0]-a[0]),Math.max(1,a[2]*.12));
        if(a[2]>8){const ww=a[2]*.42,wh=a[2]*.5;for(const on of[1,0]){c.fillStyle=on?pal.lit:pal.win;c.beginPath();for(let f=0;f*.85+1.5<h-.6;f++)for(let k=0;k<2;k++){if((hsh(f*5+k+seed*2)>.42?1:0)!==on)continue;const wx=(sd>0?a[0]:b[0])+a[2]*(.35+k*1.4),wy=a[1]-a[2]*(1.5+f*.85)-wh;
          c.rect(wx,wy,ww,wh);}c.fill();}}}
      c.globalAlpha=1;}};
  }
  function quad3(c,X,za,zb,ya,yb,col){const p1=P3(X,za,ya),p2=P3(X,zb,ya),p3=P3(X,zb,yb),p4=P3(X,za,yb);c.fillStyle=col;c.beginPath();c.moveTo(p1[0],p1[1]);c.lineTo(p2[0],p2[1]);c.lineTo(p3[0],p3[1]);c.lineTo(p4[0],p4[1]);c.closePath();c.fill();}
  function lamp(c,sd,dz){
    const [bx,by,sc]=P3(sd*1.82,dz),[tx,ty]=P3(sd*1.82,dz,2.5),[hx,hy2]=P3(sd*1.25,dz,2.45);
    c.strokeStyle=INK;c.lineWidth=Math.max(1,sc*.07);c.beginPath();c.moveTo(bx,by);c.lineTo(tx,ty);c.lineTo(hx,hy2);c.stroke();
    c.strokeStyle='#5B6E82';c.lineWidth=Math.max(.6,sc*.035);c.beginPath();c.moveTo(bx,by);c.lineTo(tx,ty);c.lineTo(hx,hy2);c.stroke();
    const on=S.pal.night>.3;c.fillStyle=on?'#FFE58A':'#E6E6E6';ell(c,hx,hy2+sc*.03,sc*.13,sc*.06);c.fill();c.lineWidth=Math.max(.6,sc*.02);c.strokeStyle=INK;c.stroke();
    if(on){c.save();c.globalCompositeOperation='lighter';glow(c,hx,hy2+sc*.05,sc*.7,'255,220,130',.45*S.pal.night);c.restore();}
  }
  function tree(c,sd,dz,seed){const [bx,by,sc]=P3(sd*2.3,dz);if(sc<2)return;c.lineWidth=Math.max(1,sc*.03);c.strokeStyle=INK;
    c.fillStyle='#8B5A3C';c.fillRect(bx-sc*.06,by-sc*.7,sc*.12,sc*.7);c.strokeRect(bx-sc*.06,by-sc*.7,sc*.12,sc*.7);
    c.fillStyle=S.pal.night>.4?'#2F6B55':hsh(seed)>.5?'#4CB572':'#62C784';circ(c,bx,by-sc*1.05,sc*.42);c.fill();c.stroke();circ(c,bx-sc*.2,by-sc*.85,sc*.25);c.fill();
    c.fillStyle='rgba(255,255,255,.25)';circ(c,bx-sc*.12,by-sc*1.2,sc*.1);c.fill();}

  /* ----- sprites on the road ----- */
  function svOf(sx){return clamp((V.cx-sx)/V.W,-.5,.5)*26;}
  function drawObj(c,o,dz){
    const d=DIM[o.k],fade=clamp((DRAW-dz)/9,0,1);if(fade<=0)return;
    c.save();c.globalAlpha=fade*(o.fly&&o.fly.fade?clamp(1.3-o.fly.t,0,1):1);
    const k=o.k,t=S.clock;
    if(k==='puddle'||k==='teaspill'){
      const [ax,ay,as]=P3(o.x,dz),[bx,by]=P3(o.x,dz+d.l),cx=(ax+bx)/2,cy=(ay+by)/2,rx=d.w*.5*as*.95,ry=Math.max(2,(ay-by)/2);
      c.fillStyle=k==='puddle'?(S.pal.night>.5?'#4E6E9A':'#6FA8D6'):'#7E6B2C';c.beginPath();for(let i=0;i<18;i++){const an=i/18*TAU,wob=1+.08*Math.sin(an*3+o.seed*9),q=P3(o.x+Math.cos(an)*d.w*.48*wob,Math.max(.6,dz+d.l/2+Math.sin(an)*d.l*.5*wob));i?c.lineTo(q[0],q[1]):c.moveTo(q[0],q[1]);}c.closePath();c.fill();c.lineWidth=Math.max(1,as*.03);c.strokeStyle=INK;c.stroke();
      c.fillStyle=k==='puddle'?'rgba(220,245,255,.6)':'rgba(170,200,90,.55)';ell(c,cx-rx*.3,cy-ry*.25,rx*.35,ry*.18);c.fill();
      if(k==='teaspill'){c.fillStyle='#3E5A2A';for(let i=0;i<6;i++){ell(c,cx+(hsh(o.seed*9+i)-.5)*rx*1.4,cy+(hsh(o.seed*7+i)-.5)*ry,as*.04,as*.02,i);c.fill();}
        c.strokeStyle='rgba(255,255,255,.6)';c.lineWidth=Math.max(1,as*.02);for(let i=-1;i<=1;i+=2){c.beginPath();c.moveTo(cx+i*rx*.3,cy-ry);c.quadraticCurveTo(cx+i*rx*.3+Math.sin(t*4+i)*as*.08,cy-ry-as*.2,cx+i*rx*.3,cy-ry-as*.4);c.stroke();}}
    }else if(k==='bump'){
      for(let i=0;i<8;i++){const xl=-1.5+i*.375;quad(c,xl,xl+.375,dz,dz+d.l,i&1?INK:'#FFC531',.07,.07);}
      const [ax,ay,as]=P3(-1.5,dz),[bx]=P3(1.5,dz);c.fillStyle='#B88A10';c.fillRect(ax,ay-as*.07,bx-ax,as*.07);
    }else if(k==='ramp'){
      const xl=o.x-d.w/2,xr=o.x+d.w/2,a=dz,b=dz+d.l;
      const p1=P3(xl,a,0),p2=P3(xr,a,0),p3=P3(xr,b,.42),p4=P3(xl,b,.42),q3=P3(xr,b,0),q4=P3(xl,b,0);
      c.lineWidth=Math.max(1,p1[2]*.03);c.strokeStyle=INK;
      c.fillStyle='#B66A1E';c.beginPath();c.moveTo(p2[0],p2[1]);c.lineTo(p3[0],p3[1]);c.lineTo(q3[0],q3[1]);c.closePath();c.fill();c.stroke();
      c.beginPath();c.moveTo(p1[0],p1[1]);c.lineTo(p4[0],p4[1]);c.lineTo(q4[0],q4[1]);c.closePath();c.fill();c.stroke();
      c.fillStyle='#F2A23A';c.beginPath();c.moveTo(p1[0],p1[1]);c.lineTo(p2[0],p2[1]);c.lineTo(p3[0],p3[1]);c.lineTo(p4[0],p4[1]);c.closePath();c.fill();c.stroke();
      c.fillStyle='#fff';for(let i=0;i<2;i++){const m1=P3(o.x,a+.3+i*.45,.1+i*.15),m2=P3(o.x-.22,a+.12+i*.45,.04+i*.15),m3=P3(o.x+.22,a+.12+i*.45,.04+i*.15);
        c.beginPath();c.moveTo(m1[0],m1[1]);c.lineTo(m2[0],m2[1]);c.lineTo(m3[0],m3[1]);c.closePath();c.fill();}
    }else if(k==='cup'){
      const [sx,sy,sc]=P3(o.x,dz+.25,.45+Math.sin(t*4+o.seed*6)*.05),[gx,gy]=P3(o.x,dz+.25);c.fillStyle='rgba(0,0,0,.18)';ell(c,gx,gy,sc*.18,sc*.05);c.fill();
      c.save();c.globalCompositeOperation='lighter';glow(c,sx,sy,sc*.5,'255,210,90',.55);c.restore();drawHeld(c,'cup',sx,sy,sc*1.5,t);
    }else if(k==='coin'){
      const h=(o.h||0)+.32+Math.sin(t*4+o.seed*6)*.04,[sx,sy,sc]=P3(o.x,dz+.25,h),r=sc*.2,w=Math.abs(Math.cos(t*5+o.seed*7));
      if(!o.air){const [gx,gy]=P3(o.x,dz+.25);c.fillStyle='rgba(0,0,0,.18)';ell(c,gx,gy,r*.8,r*.25);c.fill();}
      else{c.save();c.globalCompositeOperation='lighter';glow(c,sx,sy,r*2.4,'255,220,100',.5);c.restore();}
      c.fillStyle='#FFC531';c.strokeStyle=INK;c.lineWidth=Math.max(1,r*.18);ell(c,sx,sy,r*(.25+.75*w),r);c.fill();c.stroke();
      if(w>.4){c.fillStyle='#FFE58A';ell(c,sx-r*.15*w,sy-r*.15,r*.35*w,r*.5);c.fill();}
    }else if(k==='cone'){
      const [sx,sy,sc]=P3(o.x,dz,o.fy||0),w=d.w*sc;c.translate(sx,sy);c.rotate(o.rot||0);
      c.lineWidth=Math.max(1,w*.06);c.strokeStyle=INK;c.fillStyle='#FF7A2F';rr(c,-w*.55,-w*.14,w*1.1,w*.14,w*.04);c.fill();c.stroke();
      c.beginPath();c.moveTo(-w*.38,-w*.12);c.lineTo(-w*.08,-w*1.05);c.lineTo(w*.08,-w*1.05);c.lineTo(w*.38,-w*.12);c.closePath();c.fill();c.stroke();
      c.fillStyle='#fff';c.beginPath();c.moveTo(-w*.27,-w*.42);c.lineTo(-w*.17,-w*.68);c.lineTo(w*.17,-w*.68);c.lineTo(w*.27,-w*.42);c.closePath();c.fill();
    }else if(k==='barrier'){
      const [sx,sy,sc]=P3(o.x,dz,o.fy||0),w=d.w*sc,h=.42*sc;c.translate(sx,sy);c.rotate(o.rot||0);
      c.lineWidth=Math.max(1,w*.025);c.strokeStyle=INK;c.fillStyle='#5B6E82';
      rr(c,-w*.42,-h*.6,w*.06,h*.6,1);c.fill();c.stroke();rr(c,w*.36,-h*.6,w*.06,h*.6,1);c.fill();c.stroke();
      c.save();rr(c,-w*.5,-h,w,h*.48,w*.04);c.clip();c.fillStyle='#fff';c.fillRect(-w*.5,-h,w,h*.48);c.fillStyle='#E5484D';
      for(let i=-6;i<6;i++){c.beginPath();c.moveTo(i*w*.16,-h*.52);c.lineTo(i*w*.16+w*.08,-h*.52);c.lineTo(i*w*.16+w*.16,-h);c.lineTo(i*w*.16+w*.08,-h);c.closePath();c.fill();}c.restore();
      rr(c,-w*.5,-h,w,h*.48,w*.04);c.stroke();
      const on=Math.sin(t*9+o.seed*5)>0;c.fillStyle=on?'#FFC531':'#8A6A10';circ(c,-w*.3,-h*1.1,w*.06);c.fill();c.stroke();circ(c,w*.3,-h*1.1,w*.06);c.fill();c.stroke();
      if(on&&S.pal.night>.3){c.globalCompositeOperation='lighter';glow(c,-w*.3,-h*1.1,w*.3,'255,200,60',.6);glow(c,w*.3,-h*1.1,w*.3,'255,200,60',.6);}
    }else{
      const [sx,sy,sc]=P3(o.x,dz,o.fy||0);
      rearVeh(c,k,sx,sy,d.w*sc,{col:o.col,t,sv:svOf(sx),rot:o.rot,blink:o.tl!=null?Math.sign(o.tl-o.lane):0,brake:o.v<o.v0*.7||!!o.fly,night:S.pal.night,seed:o.seed});
    }
    c.restore();
  }

  function drawPlayer(c){
    const h=airH(),[gx,gy,sc]=P3(S.px,DP),[sx,sy]=P3(S.px,DP,h),w=(S.moto?.64:.8)*sc;
    if(h>.02){c.fillStyle='rgba(0,0,0,.25)';ell(c,gx,gy-2,w*.5*(1-h*.3),w*.07);c.fill();}
    if(S.inv>0&&Math.floor(S.inv*10)%2===0&&S.phase==='go')c.globalAlpha=.35;
    const rot=S.tilt+(S.spin>0?Math.sin(S.clock*26)*.1*S.spin:0)+(S.phase==='end'&&S.reason==='crashed'?Math.sin(S.endT*12)*.25*Math.max(0,1-S.endT/2):0);
    const sv=Math.max(svOf(sx),4);
    if(S.moto)rearMoto(c,sx,sy,w,{t:S.clock,rot,night:S.pal.night,skin:S.skin,solo:S.endless});
    else rearVeh(c,'dooshish',sx,sy,w,{t:S.clock,rot,sv,night:S.pal.night,rider:S.cd.rider,skin:S.skin,brake:S.phase!=='go'||S.slideT>0,nitro:S.nitroT>0});
    c.globalAlpha=1;
    if(S.nitroT>0){c.save();c.globalCompositeOperation='lighter';for(const ox of(S.moto?[.08]:[-.25,.25])){const [fx,fy]=P3(S.px+ox,DP-.05,h+.1);
      const L=w*(.35+Math.random()*.25);const g=c.createLinearGradient(fx,fy,fx,fy+L);g.addColorStop(0,'rgba(255,240,150,.95)');g.addColorStop(.4,'rgba(255,140,40,.8)');g.addColorStop(1,'rgba(255,60,20,0)');
      c.fillStyle=g;c.beginPath();c.moveTo(fx-w*.06,fy);c.quadraticCurveTo(fx,fy+L*1.2,fx+w*.06,fy);c.closePath();c.fill();}c.restore();}
  }

  function drawTargetMarker(c,sx,sy,sc){
    const b=Math.sin(S.clock*6)*4,y=sy-Math.max(30,sc*1.4)-14+b;
    c.fillStyle='#FF4F86';c.strokeStyle=INK;c.lineWidth=2.5;c.beginPath();c.moveTo(sx-11,y-14);c.lineTo(sx+11,y-14);c.lineTo(sx,y);c.closePath();c.fill();c.stroke();
  }

  function drawWorld(c){
    const L=[],z0=S.z;
    // buildings
    for(const sd of[-1,1])for(let j=Math.floor(z0/CL);j<=Math.floor((z0+DRAW)/CL);j++){const b=building(c,sd,j);if(b)L.push(b);}
    // lamps & trees
    for(let j=Math.floor(z0/10);j<=Math.floor((z0+DRAW)/10);j++)for(const sd of[-1,1]){const dz=j*10+(sd>0?5:0)-z0;if(dz>1.1&&dz<DRAW-2)L.push({d:dz,f:()=>{c.globalAlpha=clamp((DRAW-dz)/9,0,1);lamp(c,sd,dz);c.globalAlpha=1;}});}
    if(S.pal.night<.9)for(let j=Math.floor(z0/CL);j<=Math.floor((z0+DRAW)/CL);j++)for(const sd of[-1,1]){const seed=j*2+(sd>0?1:0),dz=j*CL+.6-z0;if(dz>1.2&&dz<DRAW-3&&hsh(seed*1.3)>.35)L.push({d:dz,f:()=>{c.globalAlpha=clamp((DRAW-dz)/9,0,1);tree(c,sd,dz,seed);c.globalAlpha=1;}});}
    // finish arch
    {const dz=S.D-z0-DP;if(dz>1&&dz<DRAW)L.push({d:dz,f:()=>arch(c,dz)});}
    // objects
    for(const o of S.objs){const dz=o.z-z0;if(dz>.5&&dz<DRAW)L.push({d:dz+(DIM[o.k].flat?.01:0)+(o.k==='coin'?-.02:0),f:()=>drawObj(c,o,dz)});}
    // targets
    for(const g of S.done){const dz=g.z-z0;if(dz>.6&&dz<DRAW)L.push({d:dz,f:()=>{const [sx,sy,sc]=P3(g.x,dz);rearVeh(c,g.k,sx,sy,DIM[g.k].w*sc,{t:S.clock,sv:svOf(sx),night:S.pal.night,hazard:true,brake:true});
      if(sc>8)for(let i=0;i<4;i++){const a=S.clock*5+i*TAU/4;c.fillStyle='#FFC531';starPath(c,sx+Math.cos(a)*sc*.5,sy-sc*1.35+Math.sin(a)*sc*.12,sc*.09);c.fill();c.lineWidth=1.5;c.strokeStyle=INK;c.stroke();}}});}
    if(S.tg){const g=S.tg,real=g.z-z0,dz=Math.min(real,DRAW-1.5);if(dz>.6)L.push({d:dz,f:()=>{const [sx,sy,sc]=P3(g.x,dz);c.save();if(real>DRAW-1.5)c.globalAlpha=.9;
      rearVeh(c,g.k,sx,sy,DIM[g.k].w*sc,{t:S.clock,sv:svOf(sx),night:S.pal.night,hazard:g.st!=='run',brake:g.st!=='run',blink:0});c.restore();
      if(g.st==='run'&&S.phase!=='end')drawTargetMarker(c,sx,sy,sc*(g.k==='van'?.95:1.2));
      if(g.st!=='run'&&sc>8)for(let i=0;i<4;i++){const a=S.clock*5+i*TAU/4;c.fillStyle='#FFC531';starPath(c,sx+Math.cos(a)*sc*.5,sy-sc*1.35+Math.sin(a)*sc*.12,sc*.09);c.fill();c.lineWidth=1.5;c.strokeStyle=INK;c.stroke();}}});}
    // pursuers
    if(S.purs)for(const q of S.purs){const dz=DP+q.rz;if(dz>.75&&dz<DRAW)L.push({d:dz,f:()=>{const [sx,sy,sc]=P3(q.x,dz);
      rearVeh(c,q.k,sx,sy,DIM[q.k].w*sc,{t:S.clock,sv:svOf(sx),night:S.pal.night,blink:q.blink||0,brake:q.st==='brake',siren:true,rot:q.spin?Math.sin(q.spin)*.4:0});
      if(q.st==='cut'&&q.t<.6&&sc>6){txt(c,'!',sx,sy-sc*1.3,Math.round(Math.min(60,sc*.5)),'#FF4F86',INK);}}});}
    L.push({d:DP,f:()=>drawPlayer(c)});
    L.sort((a,b)=>b.d-a.d);
    for(const it of L){c.save();c.lineJoin='round';c.lineCap='round';it.f();c.restore();}
  }
  function arch(c,dz){
    const [lx,ly,sc]=P3(-1.75,dz),[rx]=P3(1.75,dz),[,ty]=P3(0,dz,2.3);c.lineWidth=Math.max(1,sc*.04);c.strokeStyle=INK;
    c.fillStyle='#E5484D';c.fillRect(lx-sc*.1,ty,sc*.2,ly-ty);c.strokeRect(lx-sc*.1,ty,sc*.2,ly-ty);c.fillRect(rx-sc*.1,ty,sc*.2,ly-ty);c.strokeRect(rx-sc*.1,ty,sc*.2,ly-ty);
    const bh=sc*.4,n=14,cw=(rx-lx+sc*.2)/n;for(let i=0;i<n;i++)for(let r=0;r<2;r++){c.fillStyle=(i+r)&1?'#fff':INK;c.fillRect(lx-sc*.1+i*cw,ty-bh+r*bh/2,cw+.5,bh/2+.5);}
    c.strokeRect(lx-sc*.1,ty-bh,rx-lx+sc*.2,bh);
  }

  /* ----- rear-view vehicles ----- */
  function sideQuad(c,ax,ay,bx,by,sv,dh,col){c.fillStyle=col;c.beginPath();c.moveTo(ax,ay);c.lineTo(bx,by);c.lineTo(bx+sv,by-dh);c.lineTo(ax+sv,ay-dh);c.closePath();c.fill();c.stroke();}
  function tyres(c,u,y0,big){c.fillStyle='#1D232B';const tw=big?18:15;rr(c,-47*u,-(y0)*u,tw*u,y0*u,3*u);c.fill();c.stroke();rr(c,(47-tw)*u,-(y0)*u,tw*u,y0*u,3*u);c.fill();c.stroke();
    if(big){rr(c,-30*u,-y0*u,14*u,y0*u,3*u);c.fill();c.stroke();rr(c,16*u,-y0*u,14*u,y0*u,3*u);c.fill();c.stroke();}}
  function tail(c,x,y,w,h,u,o,col){c.fillStyle=o.brake?'#FF5A5A':(col||'#C8323A');rr(c,x,y,w,h,2*u);c.fill();c.stroke();
    if(o.night>.3||o.brake){c.save();c.globalCompositeOperation='lighter';glow(c,x+w/2,y+h/2,w*(o.brake?1.9:1.3),'255,60,60',o.brake?.7:.45*Math.max(o.night,.4));c.restore();}}
  function blinkers(c,u,o,y,xs){const on=Math.sin(o.t*14)>0;if(!on)return;
    const sides=o.hazard?[-1,1]:o.blink?[o.blink]:[];for(const s of sides){const x=s*xs*u;c.fillStyle='#FFB020';circ(c,x,y*u,4*u);c.fill();c.stroke();c.save();c.globalCompositeOperation='lighter';glow(c,x,y*u,16*u,'255,180,40',.7);c.restore();}}
  function rearVeh(c,kind,x,y,w,o){
    if(w<1.5)return;
    const u=w/100;c.save();c.translate(x,y);if(o.rot)c.rotate(o.rot);
    c.lineJoin='round';c.lineCap='round';c.lineWidth=Math.max(1,u*2.6);c.strokeStyle=INK;
    c.fillStyle='rgba(10,15,25,.3)';ell(c,0,-u,w*.56,u*7);c.fill();
    const sv=(o.sv||0)*u,dh=u*4+Math.abs(sv)*.25,R=sv>=0?1:-1;
    const SK=kind==='dooshish'?(VEHICLES[o.skin]||VEHICLES.dooshish):null;
    if(SK&&SK.shape==='icecream')iceRear(c,u,o,sv,dh,R,SK);
    else if(kind==='car'||kind==='taxi'||kind==='dooshish'||kind==='guardcar'){
      const sh=SK?SK.shape:'hatch',G=RSHAPE[sh]||RSHAPE.hatch,bt=G.bt,ct=G.ct,cb=G.cb,cw=G.cw;
      const col=SK?SK.col:kind==='guardcar'?'#2D3A66':o.col||'#5EC8F7',sideC=SK&&R>0?SK.door:shade(col,-.25);
      tyres(c,u,G.ty||16);
      if(Math.abs(sv)>.5){sideQuad(c,R*50*u,-12*u,R*50*u,(bt+2)*u,sv,dh,sideC);sideQuad(c,R*(cb-1)*u,(bt+3)*u,R*cw*u,ct*u,sv*.8,dh,shade(col,-.32));
        if(SK&&R>0){c.strokeStyle=INK;c.beginPath();c.moveTo(50*u+sv*.45,-14*u-dh*.45);c.lineTo(50*u+sv*.45,(bt+3)*u-dh*.45);c.stroke();}}
      c.fillStyle=G.chrome?'#4A3C46':shade(col,.12);c.beginPath();c.moveTo(-cw*u,ct*u);c.lineTo(cw*u,ct*u);c.lineTo(cw*u+sv*.8,ct*u-dh);c.lineTo(-cw*u+sv*.8,ct*u-dh);c.closePath();c.fill();c.stroke();
      if(G.rack){c.strokeStyle='#5B6E82';c.lineWidth=Math.max(1,u*3);c.beginPath();c.moveTo(-cw*u,(ct-6)*u);c.lineTo(cw*u,(ct-6)*u);c.moveTo(-cw*.7*u,ct*u);c.lineTo(-cw*.7*u,(ct-6)*u);c.moveTo(cw*.7*u,ct*u);c.lineTo(cw*.7*u,(ct-6)*u);c.stroke();
        c.strokeStyle=INK;c.lineWidth=Math.max(1,u*2.6);c.fillStyle='#8B5A3C';rr(c,-18*u,(ct-15)*u,22*u,9*u,2*u);c.fill();c.stroke();c.fillStyle='#62C784';rr(c,6*u,(ct-14)*u,14*u,8*u,2*u);c.fill();c.stroke();}
      c.fillStyle=col;rr(c,-50*u,bt*u,100*u,(-11-bt)*u,9*u);c.fill();c.stroke();
      const m=(bt+3+ct)/2;
      c.fillStyle=G.chrome?'#3A2E36':shade(col,-.05);c.beginPath();c.moveTo(-cb*u,(bt+3)*u);c.lineTo(cb*u,(bt+3)*u);c.quadraticCurveTo((cb-3)*u,m*u,(cw+1)*u,(ct+2)*u);c.quadraticCurveTo(0,(ct-3)*u,-(cw+1)*u,(ct+2)*u);c.quadraticCurveTo(-(cb-3)*u,m*u,-cb*u,(bt+3)*u);c.closePath();c.fill();c.stroke();
      const wb=cb-7,wt=cw-4;
      const win=()=>{c.beginPath();c.moveTo(-wb*u,bt*u);c.lineTo(wb*u,bt*u);c.lineTo(wt*u,(ct+6)*u);c.quadraticCurveTo(0,(ct+3)*u,-wt*u,(ct+6)*u);c.closePath();};
      c.fillStyle=o.night>.5?'#141A30':'#33475E';win();c.fill();
      if(kind==='dooshish'){const k=Math.min(1,(bt-ct-6)/21);c.save();win();c.clip();c.translate(0,bt*u);c.scale(k,k);c.translate(0,49*u);cabinHeads(c,u,o);c.restore();}
      c.save();win();c.clip();c.fillStyle='rgba(200,240,255,.22)';c.beginPath();c.moveTo(-10*u,bt*u);c.lineTo(4*u,bt*u);c.lineTo(22*u,(ct-2)*u);c.lineTo(8*u,(ct-2)*u);c.closePath();c.fill();c.restore();
      win();c.stroke();
      if(G.stripes){c.fillStyle='rgba(255,255,255,.9)';c.fillRect(-9*u,(bt+1)*u,5*u,(-12-bt)*u);c.fillRect(4*u,(bt+1)*u,5*u,(-12-bt)*u);}
      const ty=bt+6,py=Math.min(-31,bt+16),px=G.spare?8:-13;
      tail(c,-48*u,ty*u,15*u,10*u,u,o);tail(c,33*u,ty*u,15*u,10*u,u,o);
      c.fillStyle=kind==='guardcar'?'#FFC531':'#fff';rr(c,px*u,py*u,26*u,10*u,2*u);c.fill();c.stroke();
      c.fillStyle=INK;for(let i=0;i<3;i++)c.fillRect((px+4+i*7)*u,(py+3.5)*u,4*u,3*u);
      c.fillStyle=G.chrome?'#E8EEF2':shade(col,-.4);rr(c,-49*u,-19*u,98*u,9*u,4*u);c.fill();c.stroke();
      c.fillStyle='#555';circ(c,-30*u,-11*u,3*u);c.fill();c.stroke();if(G.twin){circ(c,-22*u,-11*u,3*u);c.fill();c.stroke();circ(c,22*u,-11*u,3*u);c.fill();c.stroke();circ(c,30*u,-11*u,3*u);c.fill();c.stroke();}
      blinkers(c,u,o,ty+5,46);
      if(G.spare){c.fillStyle='#1D232B';circ(c,-22*u,(bt+19)*u,13*u);c.fill();c.stroke();c.fillStyle=SK?SK.door:'#888';circ(c,-22*u,(bt+19)*u,6*u);c.fill();c.stroke();}
      if(G.wing){c.fillStyle=shade(col,-.2);c.fillRect(-30*u,(bt-6)*u,5*u,7*u);c.fillRect(25*u,(bt-6)*u,5*u,7*u);c.fillStyle=col;rr(c,-50*u,(bt-12)*u,100*u,7*u,3*u);c.fill();c.stroke();}
      if(G.chrome){drawCrown(c,0,(bt+5)*u,6*u,0);c.strokeStyle='#FFF4C9';c.lineWidth=Math.max(1,u*1.6);c.beginPath();c.moveTo(-46*u,(bt+3)*u);c.lineTo(46*u,(bt+3)*u);c.stroke();c.strokeStyle=INK;c.lineWidth=Math.max(1,u*2.6);}
      if(sh==='taxi'){c.fillStyle='#fff';rr(c,-14*u,(ct-13)*u,28*u,10*u,3*u);c.fill();c.stroke();c.fillStyle=INK;for(let i=0;i<4;i++)c.fillRect((-11+i*6)*u,(ct-10)*u,3*u,3*u);
        for(let i=0;i<12;i++){c.fillStyle=i&1?INK:'#fff';c.fillRect((-48+i*8)*u,(bt+15)*u,8*u,4*u);}}
      if(SK&&(sh==='hatch')){drawCrown(c,23*u,-26*u,5*u,.2);c.fillStyle=SK.door;rr(c,-40*u,(bt+5)*u,14*u,4*u,2*u);c.fill();}
      if(kind==='taxi'){c.fillStyle='#fff';rr(c,-14*u,-89*u,28*u,10*u,3*u);c.fill();c.stroke();c.fillStyle=INK;for(let i=0;i<4;i++)c.fillRect((-11+i*6)*u,-86*u,3*u,3*u);c.fillStyle='#62C784';c.fillRect(-50*u,-30*u,8*u,4*u);c.fillRect(42*u,-30*u,8*u,4*u);}
      if(kind==='guardcar'){const ph=Math.sin(o.t*12)>0;c.fillStyle='#1E2547';rr(c,-26*u,-86*u,52*u,9*u,3*u);c.fill();c.stroke();
        c.fillStyle=ph?'#FF4F5E':'#7A2030';rr(c,-24*u,-85*u,22*u,7*u,2*u);c.fill();c.fillStyle=ph?'#2A3A7A':'#5EC8F7';rr(c,2*u,-85*u,22*u,7*u,2*u);c.fill();
        c.save();c.globalCompositeOperation='lighter';glow(c,(ph?-13:13)*u,-82*u,40*u,ph?'255,70,90':'90,170,255',.7);c.restore();
        c.fillStyle='#FFC531';starPath(c,0,-58*u,7*u);c.fill();c.stroke();}
      if(kind==='dooshish'&&o.nitro){c.fillStyle='#FFC531';}
    }else if(kind==='pickup'){
      const col=o.col||'#3D7DD8';tyres(c,u,16);
      if(Math.abs(sv)>.5)sideQuad(c,R*50*u,-12*u,R*50*u,-46*u,sv,dh,shade(col,-.25));
      c.fillStyle=shade(col,-.08);rr(c,-38*u,-82*u,76*u,32*u,8*u);c.fill();c.stroke();
      c.fillStyle=o.night>.5?'#141A30':'#33475E';rr(c,-30*u,-78*u,60*u,18*u,4*u);c.fill();c.stroke();
      // watermelons in the bed
      for(let i=0;i<5;i++){const mx=(-34+i*17)*u,my=(-50-(i%2)*6)*u;c.fillStyle='#3FAE6B';ell(c,mx,my,10*u,8*u);c.fill();c.stroke();c.strokeStyle='#2A7A48';c.lineWidth=Math.max(1,u*1.6);c.beginPath();c.moveTo(mx-5*u,my-6*u);c.quadraticCurveTo(mx-7*u,my,mx-5*u,my+6*u);c.moveTo(mx+3*u,my-7*u);c.quadraticCurveTo(mx+5*u,my,mx+3*u,my+7*u);c.stroke();c.strokeStyle=INK;c.lineWidth=Math.max(1,u*2.6);}
      c.fillStyle=col;rr(c,-50*u,-48*u,100*u,36*u,6*u);c.fill();c.stroke();
      c.strokeStyle=shade(col,-.3);c.beginPath();c.moveTo(-40*u,-38*u);c.lineTo(40*u,-38*u);c.stroke();c.strokeStyle=INK;
      tail(c,-48*u,-45*u,10*u,16*u,u,o);tail(c,38*u,-45*u,10*u,16*u,u,o);
      c.fillStyle='#fff';rr(c,-13*u,-30*u,26*u,10*u,2*u);c.fill();c.stroke();
      c.fillStyle='#4A5260';rr(c,-49*u,-17*u,98*u,8*u,3*u);c.fill();c.stroke();blinkers(c,u,o,-36,46);
    }else if(kind==='van'||kind==='teavan'){
      const col=o.col||(kind==='teavan'?'#36A985':'#6C6F8C');tyres(c,u,17);
      if(Math.abs(sv)>.5)sideQuad(c,R*48*u,-12*u,R*48*u,-100*u,sv,dh,shade(col,-.25));
      c.fillStyle=shade(col,.15);c.beginPath();c.moveTo(-44*u,-100*u);c.lineTo(44*u,-100*u);c.lineTo(44*u+sv,-100*u-dh);c.lineTo(-44*u+sv,-100*u-dh);c.closePath();c.fill();c.stroke();
      c.fillStyle=col;rr(c,-48*u,-102*u,96*u,90*u,10*u);c.fill();c.stroke();
      c.beginPath();c.moveTo(0,-98*u);c.lineTo(0,-20*u);c.stroke();
      c.fillStyle=o.night>.5?'#141A30':'#33475E';rr(c,-40*u,-92*u,34*u,22*u,4*u);c.fill();c.stroke();rr(c,6*u,-92*u,34*u,22*u,4*u);c.fill();c.stroke();
      c.fillStyle='rgba(200,240,255,.25)';c.fillRect(-30*u,-92*u,6*u,22*u);c.fillRect(16*u,-92*u,6*u,22*u);
      if(kind==='teavan'){c.fillStyle='#C9524F';c.fillRect(-47*u,-62*u,94*u,9*u);c.strokeRect(-47*u,-62*u,94*u,9*u);miniTeapot(c,-22*u,-38*u,15*u,o.t);miniTeapot(c,22*u,-38*u,15*u,o.t);
        if(o.siren){const ph=Math.sin(o.t*10)>0;c.fillStyle=ph?'#FFC531':'#B8860B';rr(c,-10*u,-112*u,20*u,9*u,4*u);c.fill();c.stroke();if(ph){c.save();c.globalCompositeOperation='lighter';glow(c,0,-108*u,40*u,'255,200,60',.65);c.restore();}}}
      else{c.fillStyle='rgba(255,255,255,.25)';c.font=Math.round(20*u)+'px '+FONT_D;c.textAlign='center';c.fillText('?',-23*u,-40*u);c.fillText('?',23*u,-40*u);
        c.fillStyle='#AAB';c.fillRect(-8*u,-60*u,5*u,14*u);c.fillRect(3*u,-60*u,5*u,14*u);}
      tail(c,-47*u,-66*u,8*u,24*u,u,o);tail(c,39*u,-66*u,8*u,24*u,u,o);
      c.fillStyle='#fff';rr(c,-13*u,-30*u,26*u,10*u,2*u);c.fill();c.stroke();
      c.fillStyle='#3E4652';rr(c,-49*u,-19*u,98*u,9*u,4*u);c.fill();c.stroke();blinkers(c,u,o,-76,44);
    }else if(kind==='mixer'){
      tyres(c,u,18,true);
      const cab='#FFC531';
      if(Math.abs(sv)>.5)sideQuad(c,R*44*u,-20*u,R*44*u,-58*u,sv,dh,'#4A5260');
      c.fillStyle=cab;rr(c,-36*u,-126*u,72*u,26*u,6*u);c.fill();c.stroke();
      c.fillStyle='#4A5260';rr(c,-44*u,-58*u,88*u,40*u,5*u);c.fill();c.stroke();
      // drum (rear view): big rotating circle
      const r=42*u,cy=-86*u,rot=o.t*3;
      if(Math.abs(sv)>.5){c.fillStyle='#D98A2B';ell(c,sv*.7,cy-dh,r,r*.95);c.fill();c.stroke();}
      c.fillStyle='#F2A23A';circ(c,0,cy,r);c.fill();c.stroke();
      c.save();circ(c,0,cy,r);c.clip();c.strokeStyle='#fff';c.lineWidth=7*u;for(let i=0;i<3;i++){const a=rot+i*TAU/3;c.beginPath();c.arc(0,cy,r*.62,a,a+1.3);c.stroke();}c.restore();
      c.strokeStyle=INK;c.lineWidth=Math.max(1,u*2.6);
      c.fillStyle='#6B3E26';circ(c,0,cy,r*.38);c.fill();c.stroke();
      // coffee sacks peeking out
      c.fillStyle='#C8A06A';rr(c,-13*u,cy-12*u,26*u,20*u,6*u);c.fill();c.stroke();c.fillStyle='#6B3E26';ell(c,0,cy-1*u,5*u,3.5*u,.5);c.fill();
      c.beginPath();c.moveTo(0,cy-3.5*u);c.lineTo(0,cy+1.5*u);c.strokeStyle='#C8A06A';c.lineWidth=Math.max(1,u*1.2);c.stroke();c.strokeStyle=INK;c.lineWidth=Math.max(1,u*2.6);
      // chute
      c.fillStyle='#E5484D';c.beginPath();c.moveTo(-14*u,-46*u);c.lineTo(14*u,-46*u);c.lineTo(8*u,-30*u);c.lineTo(-8*u,-30*u);c.closePath();c.fill();c.stroke();
      if(Math.sin(o.t*3+(o.seed||0)*9)>.3){c.fillStyle='#6B3E26';for(let i=0;i<3;i++){const k=((o.t*2+i/3)%1);ell(c,(i-1)*5*u,-28*u+k*22*u,3.5*u,2.5*u,k*6);c.fill();}}
      tail(c,-44*u,-56*u,10*u,12*u,u,o);tail(c,34*u,-56*u,10*u,12*u,u,o);
      c.fillStyle='#FFC531';for(let i=0;i<5;i++){c.fillStyle=i&1?INK:'#FFC531';c.fillRect((-44+i*17.6)*u,-24*u,17.6*u,6*u);}c.strokeRect(-44*u,-24*u,88*u,6*u);
      blinkers(c,u,o,-48,40);
    }else if(kind==='teatruck'){
      tyres(c,u,18,true);const col=o.col||'#36A985';
      if(Math.abs(sv)>.5)sideQuad(c,R*49*u,-20*u,R*49*u,-128*u,sv,dh,shade(col,-.25));
      c.fillStyle=shade(col,.15);c.beginPath();c.moveTo(-46*u,-128*u);c.lineTo(46*u,-128*u);c.lineTo(46*u+sv,-128*u-dh);c.lineTo(-46*u+sv,-128*u-dh);c.closePath();c.fill();c.stroke();
      c.fillStyle=col;rr(c,-49*u,-130*u,98*u,108*u,6*u);c.fill();c.stroke();
      c.strokeStyle='#C9524F';c.lineWidth=Math.max(1,u*4);c.strokeRect(-44*u,-125*u,88*u,98*u);c.strokeStyle=INK;c.lineWidth=Math.max(1,u*2.6);
      c.beginPath();c.moveTo(0,-125*u);c.lineTo(0,-27*u);c.stroke();
      // teacup emblem + sugar-cube crown
      c.fillStyle='#fff';c.beginPath();c.moveTo(-20*u,-82*u);c.lineTo(20*u,-82*u);c.quadraticCurveTo(18*u,-56*u,0,-54*u);c.quadraticCurveTo(-18*u,-56*u,-20*u,-82*u);c.closePath();c.fill();c.stroke();
      c.fillStyle='#B4321F';c.fillRect(-16*u,-80*u,32*u,7*u);c.lineWidth=Math.max(1,u*3);c.beginPath();c.arc(22*u,-72*u,7*u,-P/2,P/2);c.stroke();c.lineWidth=Math.max(1,u*2.6);
      for(let i=0;i<3;i++){c.fillStyle='#fff';rr(c,(-15+i*10)*u,(-102-(i===1?5:0))*u,9*u,9*u,1.5*u);c.fill();c.stroke();}
      c.strokeStyle='rgba(255,255,255,.8)';for(let i=-1;i<=1;i+=2){c.beginPath();c.moveTo(i*6*u,-86*u);c.quadraticCurveTo(i*6*u+Math.sin(o.t*4+i)*4*u,-90*u,i*6*u,-94*u);c.stroke();}c.strokeStyle=INK;
      c.fillStyle='#C8D0D8';c.fillRect(-4*u,-46*u,3*u,12*u);c.fillRect(1*u,-46*u,3*u,12*u);
      tail(c,-48*u,-36*u,12*u,9*u,u,o);tail(c,36*u,-36*u,12*u,9*u,u,o);
      c.fillStyle='#3E4652';rr(c,-49*u,-24*u,98*u,7*u,3*u);c.fill();c.stroke();blinkers(c,u,o,-40,42);
    }
    c.restore();
  }
  const RSHAPE={hatch:{bt:-49,ct:-76,cb:43,cw:33},taxi:{bt:-49,ct:-76,cb:43,cw:33},sport:{bt:-41,ct:-63,cb:41,cw:27,wing:1,stripes:1,twin:1},
    jeep:{bt:-52,ct:-86,cb:45,cw:41,spare:1,rack:1,ty:20},limo:{bt:-46,ct:-71,cb:40,cw:30,chrome:1}};
  function iceRear(c,u,o,sv,dh,R,SK){
    const col=SK.col,t=o.t||0;tyres(c,u,17);
    if(Math.abs(sv)>.5)sideQuad(c,R*48*u,-12*u,R*48*u,-100*u,sv,dh,R>0?SK.door:shade(col,-.12));
    c.fillStyle='#fff';c.beginPath();c.moveTo(-44*u,-100*u);c.lineTo(44*u,-100*u);c.lineTo(44*u+sv,-100*u-dh);c.lineTo(-44*u+sv,-100*u-dh);c.closePath();c.fill();c.stroke();
    // giant cone on the roof
    c.fillStyle='#E8B068';c.beginPath();c.moveTo(-14*u+sv*.5,-120*u);c.lineTo(14*u+sv*.5,-120*u);c.lineTo(sv*.5,-100*u);c.closePath();c.fill();c.stroke();
    c.fillStyle='#FF8FB5';circ(c,sv*.5,-128*u,15*u);c.fill();c.stroke();c.fillStyle='#E5484D';circ(c,sv*.5+3*u,-145*u,4*u);c.fill();c.stroke();
    c.fillStyle=col;rr(c,-48*u,-102*u,96*u,90*u,12*u);c.fill();c.stroke();
    c.fillStyle=SK.door;c.fillRect(-47*u,-46*u,94*u,8*u);c.strokeRect(-47*u,-46*u,94*u,8*u);
    const win=()=>{rr(c,-34*u,-92*u,68*u,28*u,6*u);};c.fillStyle=o.night>.5?'#141A30':'#33475E';win();c.fill();
    c.save();win();c.clip();c.translate(0,-64*u);c.translate(0,49*u);cabinHeads(c,u,o);c.restore();
    c.save();win();c.clip();c.fillStyle='rgba(200,240,255,.22)';c.fillRect(-6*u,-94*u,10*u,32*u);c.restore();win();c.stroke();
    for(let i=0;i<10;i++){c.fillStyle=['#FF8FB5','#5EC8F7','#FFC531','#8BD3B7'][i%4];rr(c,(-40+hsh(i)*80)*u,(-60+hsh(i+5)*12)*u,5*u,2*u,1*u);c.fill();}
    tail(c,-47*u,-66*u,8*u,24*u,u,o);tail(c,39*u,-66*u,8*u,24*u,u,o);
    c.fillStyle='#fff';rr(c,-13*u,-32*u,26*u,10*u,2*u);c.fill();c.stroke();
    c.fillStyle='#8BD3E6';rr(c,-49*u,-19*u,98*u,9*u,4*u);c.fill();c.stroke();blinkers(c,u,o,-76,44);
  }
  function miniTeapot(c,x,y,r,t){c.save();c.translate(x,y);c.fillStyle='#E86A92';c.beginPath();c.moveTo(r*.5,-r*.05);c.quadraticCurveTo(r*.95,-r*.1,r*1.05,-r*.55);c.lineTo(r*1.15,-r*.5);c.quadraticCurveTo(r*1,r*.2,r*.5,r*.25);c.closePath();c.fill();c.stroke();
    ell(c,0,0,r*.65,r*.55);c.fill();c.stroke();c.fillStyle='#FFC531';circ(c,0,-r*.62,r*.15);c.fill();c.stroke();c.restore();}

  function cabinHeads(c,u,o){
    const s=29*u,t=o.t||0;
    const K=Object.assign({},looks('kiana'),{dir:-P/2,t,noShadow:true});
    const rider=o.rider;
    if(rider){const R=Object.assign({},looks(rider),{dir:-P/2,t:t+1.3,noShadow:true});drawPerson(c,17*u,-48.5*u,s,R);
      if(rider==='arsi'||R.glassesUp){c.fillStyle=INK;rr(c,(17-8)*u,-68*u,16*u,3.5*u,1.7*u);c.fill();}}
    drawPerson(c,-16*u,-47.5*u,s*.97,K);
    const hy=-47.5*u-s*.97*.31,hr=s*.97*.33;drawBird(c,-16*u-hr*.55,hy-hr*.95,hr*.42,t,{fly:Math.sin(t*1.3)>.85});
  }
  function rearMoto(c,x,y,w,o){
    const u=w/100,t=o.t||0,SK=VEHICLES[o.skin]||VEHICLES.hiromoto,col=SK.col,sh=SK.shape;c.save();c.translate(x,y);if(o.rot)c.rotate(o.rot*.8);
    c.lineJoin='round';c.lineCap='round';c.lineWidth=Math.max(1,u*2.4);c.strokeStyle=INK;
    c.fillStyle='rgba(10,15,25,.3)';ell(c,0,-u,w*.3,u*6);c.fill();
    if(sh==='neon'){c.save();c.globalCompositeOperation='lighter';c.save();c.scale(1,.25);glow(c,0,-6*u*4,60*u,'94,247,230',.6);c.restore();c.restore();}
    c.fillStyle='#1D232B';rr(c,(sh==='cross'?-10:-8)*u,-36*u,(sh==='cross'?20:16)*u,36*u,7*u);c.fill();c.stroke();
    if(sh==='cross'){c.fillStyle='#3A3F48';for(let i=0;i<5;i++){c.fillRect(-12*u,(-32+i*7)*u,3*u,3*u);c.fillRect(9*u,(-32+i*7)*u,3*u,3*u);}}
    const H=looks('hiroman'),K=looks('kiana'),sH=62*u,sK=60*u,solo=!!o.solo;
    const grips=who=>{for(const sd of[-1,1]){c.fillStyle='#2A2F38';rr(c,(sd>0?40:-50)*u,-78*u,10*u,7*u,3*u);c.fill();c.stroke();
      c.strokeStyle='#5B6E82';c.lineWidth=Math.max(1,u*2);c.beginPath();c.moveTo(sd*40*u,-78*u);c.lineTo(sd*46*u,-96*u);c.stroke();c.strokeStyle=INK;c.lineWidth=Math.max(1,u*2.4);
      c.fillStyle='#BFE8FF';ell(c,sd*47*u,-99*u,6*u,4*u);c.fill();c.stroke();}};
    const legs=(ox,yy)=>{for(const sd of[-1,1]){limb3(c,(ox+sd*8)*u,(yy)*u,(ox+sd*26)*u,(yy+14)*u,(ox+sd*22)*u,-26*u,8*u,K.pants||'#3B3F6B');c.fillStyle=INK;ell(c,(ox+sd*23)*u,-24*u,6*u,3.5*u);c.fill();}};
    const hair=(px,py)=>{const hr=sK*.33,hy=py-sK*.31;c.strokeStyle=K.hairCol||'#4A2A21';c.lineWidth=Math.max(1,u*3.2);for(let i=0;i<3;i++){c.beginPath();c.moveTo(px+hr*.5,hy+hr*(.1+i*.25));
      c.quadraticCurveTo(px+hr*1.4,hy+hr*(i*.25)+Math.sin(t*16+i)*hr*.25,px+hr*(1.9+i*.2),hy+hr*(.2+i*.3)+Math.sin(t*19+i*2)*hr*.3);c.stroke();}c.strokeStyle=INK;c.lineWidth=Math.max(1,u*2.4);
      drawBird(c,px-hr*.5,hy-hr*.95,hr*.42,t,{fly:true});};
    if(solo){
      grips();legs(0,-60);
      for(const sd of[-1,1])limb(c,sd*9*u,-80*u,sd*43*u,-75*u,7*u,K.shirt);
      drawPerson(c,0,-78*u,sK*1.04,Object.assign({},K,{dir:-P/2,t:t*3.2,noShadow:true}));
      hair(0,-78*u);
    }else{
      drawPerson(c,9*u,-80*u,sH,Object.assign({},H,{dir:-P/2,t:t+2,noShadow:true}));
      for(const sd of[-1,1])limb(c,(9+sd*9)*u,-82*u,sd*44*u,-74*u,7*u,H.shirt);
      grips();
      {const f=Math.sin(t*13)*5*u,f2=Math.cos(t*11)*5*u;c.fillStyle='#F4E6C8';c.beginPath();c.moveTo(-14*u,-104*u);
        c.quadraticCurveTo(-40*u+f,-96*u,-50*u+f2,-66*u);for(let i=0;i<7;i++){const xx=lerp(-50,50,i/6)*u+(i%2?f:f2)*.5,yy=-60*u+(i%2?6:-2)*u+Math.sin(t*14+i)*2*u;c.lineTo(xx,yy);}
        c.quadraticCurveTo(40*u+f,-96*u,30*u,-104*u);c.closePath();c.fill();c.stroke();
        c.strokeStyle='rgba(160,120,70,.5)';for(let i=-2;i<=2;i++){c.beginPath();c.moveTo(i*8*u,-100*u);c.lineTo(i*14*u,-66*u);c.stroke();}c.strokeStyle=INK;}
      legs(0,-58);
      drawPerson(c,-3*u,-74*u,sK,Object.assign({},K,{dir:-P/2,t:t*3.2,noShadow:true}));
      hair(-3*u,-74*u);
    }
    // rear body by style
    if(sh==='street'){c.fillStyle='#7A4A2E';rr(c,-20*u,-62*u,40*u,20*u,4*u);c.fill();c.stroke();drawHeld(c,'cup',0,-51*u,34*u,t);}
    else if(sh==='scooter'){c.fillStyle=col;ell(c,0,-50*u,30*u,17*u);c.fill();c.stroke();c.fillStyle='rgba(255,255,255,.45)';ell(c,-10*u,-56*u,9*u,4*u,-.3);c.fill();}
    else if(sh==='cross'){c.fillStyle=col;rr(c,-16*u,-64*u,32*u,14*u,5*u);c.fill();c.stroke();c.fillStyle='#fff';rr(c,-11*u,-58*u,22*u,18*u,4*u);c.fill();c.stroke();txt(c,'۷',0,-49*u,Math.round(15*u),INK,null,FONT_D);}
    else{c.fillStyle=col;rr(c,-18*u,-62*u,36*u,16*u,5*u);c.fill();c.stroke();c.save();c.globalCompositeOperation='lighter';c.strokeStyle=SK.glow||'#5EF7E6';c.lineWidth=Math.max(1,u*3);
      c.beginPath();c.moveTo(-16*u,-54*u);c.lineTo(16*u,-54*u);c.stroke();glow(c,0,-54*u,26*u,'94,247,230',.5);c.restore();c.strokeStyle=INK;c.lineWidth=Math.max(1,u*2.4);}
    c.fillStyle=sh==='neon'?'#3A4060':col;rr(c,-13*u,-44*u,26*u,10*u,5*u);c.fill();c.stroke();
    tail(c,-7*u,-42*u,14*u,6*u,u,{night:o.night,brake:false});
    c.fillStyle='#fff';rr(c,-8*u,-32*u,16*u,7*u,1.5*u);c.fill();c.stroke();
    c.fillStyle='#8E9AA6';rr(c,12*u,-22*u,14*u,6*u,3*u);c.fill();c.stroke();
    c.restore();
  }

  /* ----- overlays: speed lines, HUD, bubbles ----- */
  function speedLines(c){
    const k=S.nitroT>0?1:clamp((S.v/S.vC-1.05)*3,0,1);if(k<=0)return;
    c.save();c.strokeStyle='rgba(255,255,255,'+(.55*k)+')';c.lineCap='round';
    for(let i=0;i<26;i++){const a=hsh(i*3.3)*TAU,ph=(S.clock*2.6+hsh(i))%1,r0=Math.max(V.W,V.H)*(.32+ph*.6),len=V.W*(.12+hsh(i+7)*.18)*k;
      const cx=V.cx,cy=V.hy+20;c.lineWidth=2+hsh(i+2)*3;c.beginPath();c.moveTo(cx+Math.cos(a)*r0,cy+Math.sin(a)*r0*.9);c.lineTo(cx+Math.cos(a)*(r0+len),cy+Math.sin(a)*(r0+len)*.9);c.stroke();}
    c.restore();
  }
  function coinIcon(c,x,y,r){c.fillStyle='#FFC531';c.strokeStyle=INK;c.lineWidth=2;circ(c,x,y,r);c.fill();c.stroke();c.strokeStyle='#D99100';c.lineWidth=1.5;circ(c,x,y,r*.62);c.stroke();}
  function miniVeh(c,kind,x,y,s,col){c.save();c.translate(x,y);c.lineWidth=2;c.strokeStyle=INK;c.fillStyle=col;
    if(kind==='moto'){c.fillStyle='#1D232B';circ(c,-s*.5,0,s*.32);c.fill();circ(c,s*.5,0,s*.32);c.fill();c.fillStyle=col;rr(c,-s*.6,-s*.6,s*1.2,s*.45,s*.15);c.fill();c.stroke();}
    else{rr(c,-s,-s*.75,s*2,s*.62,s*.2);c.fill();c.stroke();rr(c,-s*.6,-s*1.15,s*1.1,s*.45,s*.15);c.fill();c.stroke();c.fillStyle='#1D232B';circ(c,-s*.55,-s*.1,s*.24);c.fill();circ(c,s*.55,-s*.1,s*.24);c.fill();}
    c.restore();}
  function hud(c){
    const W=V.W,top=76+safeIn('--sat'),bx=16,bw=W-32,by=top+12,bh=12;
    const prog=S.endless?0:clamp((S.z+DP+PLEN)/S.D,0,1),X=k=>bx+bw*(1-clamp(k,0,1));
    if(S.endless){const big=fa(S.dist)+' متر';c.save();const pulse=S.rec&&S.t%1<.5?1.06:1;c.translate(W/2,by+4);c.scale(pulse,pulse);txt(c,big,0,0,32,S.rec?'#FFE14D':'#fff',INK);c.restore();}
    else{
    // progress bar (RTL: start at the right, finish at the left)
    c.fillStyle='rgba(255,255,255,.92)';rr(c,bx,by,bw,bh,6);c.fill();c.lineWidth=2.5;c.strokeStyle=INK;c.stroke();
    c.save();rr(c,bx,by,bw,bh,6);c.clip();c.fillStyle='#2BB59A';c.fillRect(X(prog),by,bw*prog,bh);c.restore();rr(c,bx,by,bw,bh,6);c.stroke();
    // finish flag
    c.fillStyle=INK;c.fillRect(bx-2,by-14,2.5,26);for(let i=0;i<3;i++)for(let r=0;r<2;r++){c.fillStyle=(i+r)&1?'#fff':INK;c.fillRect(bx+i*5,by-14+r*5,5,5);}c.strokeRect(bx,by-14,15,10);
    if(S.catchMode&&S.tg){const tp=(S.tg.z)/S.D;for(const d of S.done){miniVeh(c,d.k,X(d.z/S.D),by-2,6,'#9AA3AD');}
      miniVeh(c,S.tg.k,X(tp),by-2,8,S.tg.k==='van'?'#6C6F8C':S.tg.k==='mixer'?'#F2A23A':'#36A985');}
    if(S.purs)for(const q of S.purs){const zp=(S.z+DP+q.rz)/S.D;miniVeh(c,q.k,X(zp),by-2,6,'#36A985');}
    miniVeh(c,S.moto?'moto':'car',X(prog),by-2,9,(VEHICLES[S.skin]||{}).col||'#7FE3C4');
    }
    // hearts (right) + coins (left)
    const ry=top+44;
    for(let i=0;i<3;i++){const hx=W-26-i*28,alive=i<3-S.hits;c.fillStyle=alive?'#FF4F6E':'rgba(255,255,255,.35)';heartPath(c,hx,ry,10);c.fill();c.lineWidth=2.5;c.strokeStyle=INK;c.stroke();
      if(alive){c.fillStyle='rgba(255,255,255,.6)';circ(c,hx-4,ry-3,2.5);c.fill();}}
    const par=S.def&&S.def.par||0,goalC=par&&(!S.def.goals||S.def.goals.includes('chasecoins'));
    const ct=goalC?fa(S.coins)+'/'+fa(par):fa(S.coins);
    c.font='800 17px '+FONT_B;const tw=c.measureText(ct).width;
    c.fillStyle=goalC&&S.coins>=par?'#FFE58A':'rgba(255,255,255,.95)';rr(c,16,ry-14,tw+44,28,14);c.fill();c.lineWidth=2.5;c.strokeStyle=INK;c.stroke();
    coinIcon(c,32,ry,9);c.fillStyle=INK;c.textAlign='left';c.textBaseline='middle';c.direction='ltr';c.fillText(ct,46,ry+1);
    // gap meter / goal chip
    let label='';
    if(S.catchMode&&S.tg&&S.phase!=='end'){label='فاصله: '+fa(Math.max(0,Math.round(S.gap*3.5)))+' متر';if(S.tN>1)label+='  ·  '+fa(Math.min(S.tI+1,S.tN))+'/'+fa(S.tN);}
    else if(S.endless)label=S.rec?'رکورد جدید!':S.best>0?'رکورد: '+fa(S.best)+' متر':'';
    else if(!S.catchMode&&S.phase!=='end')label='تا جای امن: '+fa(Math.max(0,Math.round((S.D-S.z-DP-PLEN)*3.5)))+' متر';
    if(label){const L0=88,R0=W-100;let fz=14;c.font='800 14px '+FONT_B;let lw=c.measureText(label).width+22;
      if(lw>R0-L0){fz=Math.max(10,Math.floor(14*(R0-L0)/lw));c.font='800 '+fz+'px '+FONT_B;lw=c.measureText(label).width+22;}
      const cx=Math.max(L0+lw/2,Math.min(R0-lw/2,W/2)),lx=cx-lw/2;
      const close=(S.catchMode&&S.gap<40)||(S.endless&&S.rec);c.fillStyle=close?'#FFE58A':'rgba(255,255,255,.92)';rr(c,lx,ry-13,lw,26,13);c.fill();c.lineWidth=2.5;c.strokeStyle=INK;c.stroke();
      c.fillStyle=INK;c.textAlign='center';c.direction='rtl';c.fillText(label,cx,ry+1);}
    // nitro button
    const b=nitroBtn(),act=S.nitroT>0,can=S.nitro>0&&S.phase==='go';
    c.save();c.globalAlpha=can||act?1:.55;
    c.fillStyle=INK;circ(c,b.x,b.y+5,b.r);c.fill();
    const g=c.createRadialGradient(b.x-10,b.y-12,4,b.x,b.y,b.r);g.addColorStop(0,act?'#FFF2A8':can?'#FFD25E':'#C9D0D6');g.addColorStop(1,act?'#FF8A2A':can?'#FF7A2F':'#8E9AA6');
    c.fillStyle=g;circ(c,b.x,b.y+(act?3:0),b.r);c.fill();c.lineWidth=3;c.strokeStyle=INK;c.stroke();
    const yy=b.y+(act?3:0);c.fillStyle='#fff';c.beginPath();c.moveTo(b.x+4,yy-24);c.lineTo(b.x-12,yy+2);c.lineTo(b.x-1,yy+2);c.lineTo(b.x-6,yy+22);c.lineTo(b.x+13,yy-6);c.lineTo(b.x+2,yy-6);c.closePath();c.fill();c.lineWidth=2.5;c.stroke();
    if(act){c.strokeStyle='#fff';c.lineWidth=5;c.beginPath();c.arc(b.x,yy,b.r-7,-P/2,-P/2+TAU*(S.nitroT/2.1));c.stroke();}
    c.fillStyle=S.nitro>0?'#FF4F86':'#8E9AA6';circ(c,b.x-b.r*.72,b.y-b.r*.72,13);c.fill();c.lineWidth=2.5;c.strokeStyle=INK;c.stroke();
    txt(c,fa(S.nitro),b.x-b.r*.72,b.y-b.r*.72+1,15,'#fff',null,FONT_B);
    txt(c,'نیترو',b.x,b.y+b.r+12,13,'#fff',INK,FONT_B);
    c.restore();
  }
  function wrapLines(c,text,maxW){const words=String(text).split(' '),out=[];let cur='';for(const w of words){const t2=cur?cur+' '+w:w;if(c.measureText(t2).width>maxW&&cur){out.push(cur);cur=w;}else cur=t2;}if(cur)out.push(cur);return out;}
  function bubble(c){
    const b=S.bub;if(!b)return;
    const W=V.W,k=Math.min(1,b.t/.18),out=b.t>b.dur-.25?clamp((b.dur-b.t)/.25,0,1):1,a=Math.min(k,out);
    const pr=24,px=W-16-pr,top=134+safeIn('--sat'),bw=Math.min(W-32-pr*2-12,460),bxR=px-pr-10;
    c.save();c.globalAlpha=a;c.translate(0,(1-k)*-10);
    c.font=(b.think?'italic ':'')+'600 15px '+FONT_B;const lines=wrapLines(c,b.text,bw-24).slice(0,4);
    const lh=22,bh=lines.length*lh+30,bx=bxR-bw;
    // portrait
    c.fillStyle=b.think?'#E9E2FF':'#FFF4C9';circ(c,px,top+pr,pr);c.fill();c.save();circ(c,px,top+pr,pr-1);c.clip();
    const L=Object.assign({},looks(b.who),{t:S.clock,dir:P/2,noShadow:true,mood:b.think?'normal':'excited'});if(b.who==='kiana')L.bird=false;
    drawPerson(c,px,top+pr+pr*1.55,pr*2.3,L);c.restore();c.lineWidth=3;c.strokeStyle=INK;circ(c,px,top+pr,pr);c.stroke();
    // bubble body
    c.fillStyle=b.think?'#F3EEFF':'#fff';c.strokeStyle=INK;c.lineWidth=3;
    if(b.think){c.setLineDash([7,5]);rr(c,bx,top,bw,bh,18);c.fill();c.stroke();c.setLineDash([]);
      for(let i=0;i<2;i++){circ(c,bxR+4+i*6,top+pr+10-i*10,4-i*1.3);c.fill();c.stroke();}}
    else{rr(c,bx,top,bw,bh,14);c.fill();c.stroke();c.beginPath();c.moveTo(bxR-2,top+12);c.lineTo(bxR+10,top+pr);c.lineTo(bxR-2,top+28);c.closePath();c.fill();c.stroke();
      c.fillStyle='#fff';c.fillRect(bxR-4,top+13,4,14);}
    c.direction='rtl';c.textAlign='right';c.textBaseline='middle';
    c.font='800 12px '+FONT_B;c.fillStyle=b.think?'#7B5FC0':'#E03A72';c.fillText(b.think?nameOf(b.who)+' (فکر)':nameOf(b.who),bxR-12,top+13);
    c.font=(b.think?'italic ':'')+'600 15px '+FONT_B;c.fillStyle=b.think?'#4B3A7A':INK;
    lines.forEach((ln,i)=>c.fillText(ln,bxR-12,top+32+i*lh));
    c.restore();
  }
  function drawBoom(c,b){
    const k=Math.min(1,b.t/.16),sc=(typeof EASE!=='undefined'?EASE.back(k):k)*(S.phase==='end'?1:1-Math.max(0,b.t-1)/.3);if(sc<=0)return;
    const R=Math.min(V.W*.3,150);
    c.save();c.translate(b.x,b.y);c.rotate(-.1+Math.sin(b.t*3)*.03);c.scale(sc,sc);
    c.fillStyle=b.col;starPath(c,0,0,R,12,.72);c.fill();c.lineWidth=4;c.strokeStyle=INK;c.stroke();
    c.fillStyle='#fff';starPath(c,0,0,R*.82,12,.72);c.globalAlpha=.25;c.fill();c.globalAlpha=1;
    txt(c,b.text,0,2,Math.round(Math.min(R*.36,44)),'#E5484D','#fff');c.restore();
  }
  function render(c){
    if(!S)return;
    setView();const W=V.W,H=V.H;
    c.save();c.setTransform&&0;
    c.lineJoin='round';c.lineCap='round';
    c.save();
    if(S.shake>0){const k=S.shake*16;c.translate((Math.random()-.5)*k,(Math.random()-.5)*k);}
    drawSky(c);drawRoad(c);drawWorld(c);
    for(const f of S.fx){const a=1-f.t/f.life;c.globalAlpha=clamp(a,0,1);c.fillStyle=f.col;
      if(f.k==='star'){starPath(c,f.x,f.y,f.r*(.6+a*.4));c.fill();c.lineWidth=1.5;c.strokeStyle=INK;c.stroke();}
      else if(f.k==='puff'){circ(c,f.x,f.y,f.r*(1.6-a*.6));c.fill();}
      else{circ(c,f.x,f.y,f.r);c.fill();}}
    c.globalAlpha=1;
    c.restore();
    speedLines(c);
    if(S.pal.night>.5){const g=c.createRadialGradient(W/2,H*.62,Math.min(W,H)*.35,W/2,H*.62,Math.max(W,H)*.85);g.addColorStop(0,'rgba(5,6,25,0)');g.addColorStop(1,'rgba(5,6,25,.55)');c.fillStyle=g;c.fillRect(0,0,W,H);}
    if(S.flash>0){c.fillStyle='rgba('+S.flashCol+','+(S.flash*.45)+')';c.fillRect(0,0,W,H);}
    // warnings for pursuers coming from behind
    if(S.purs&&S.phase==='go')for(const q of S.purs){if(q.st!=='chase'||q.rz<-20)continue;const k=q.lock?1:clamp((q.rz+20)/18,0,.7),[sx]=P3(q.lock?q.tx:q.x,DP),y=H-34-k*10+Math.sin(S.clock*(8+k*10))*4;
      c.save();c.globalAlpha=.55+k*.45;c.fillStyle=q.lock?'#FF3B4E':'#FF8A3D';if(q.lock){c.translate(sx,y);c.scale(1.35,1.35);c.translate(-sx,-y);};c.strokeStyle=INK;c.lineWidth=3;c.beginPath();c.moveTo(sx,y-26);c.lineTo(sx+20,y+6);c.lineTo(sx-20,y+6);c.closePath();c.fill();c.stroke();
      txt(c,'!',sx,y-6,22,'#fff',null,FONT_D);c.restore();}
    for(const f of S.floats){const a=1-f.t/1.2;c.globalAlpha=clamp(a*1.5,0,1);txt(c,f.text,f.x,f.y-f.t*50,f.size,f.col,INK);}c.globalAlpha=1;
    for(const b of S.booms)drawBoom(c,b);
    hud(c);bubble(c);
    if(S.phase==='count'){const n=3-Math.floor(S.countT/.8),k=(S.countT%.8)/.8,s=1.6-Math.min(1,k*3)*.6;
      c.save();c.translate(W/2,H*.42);c.scale(s,s);c.globalAlpha=k>.8?(1-k)*5:1;txt(c,fa(Math.max(1,n)),0,0,96,'#FFE14D',INK);c.restore();}
    else if(S.t<.8&&S.phase==='go'){const k=S.t/.8;c.save();c.translate(W/2,H*.42);c.scale(1+k*.5,1+k*.5);c.globalAlpha=1-k;txt(c,'برو!',0,0,90,'#8BD3B7',INK);c.restore();}
    if(S.hint&&S.phase!=='end'){const a=S.phase==='count'?1:clamp(4-S.t,0,1);c.save();c.globalAlpha=a*.95;
      c.fillStyle='rgba(34,48,60,.75)';rr(c,W/2-120,H*.53,240,40,20);c.fill();
      txt(c,'انگشتتو چپ و راست بکش',W/2,H*.53+21,17,'#fff',null,FONT_B);c.restore();}
    c.restore();
  }

  /* ============================================================
     CUTSCENE PROPS (side view) + BG road
     ============================================================ */
  function wheelS(c,x,y,r,rot){c.fillStyle='#1D232B';circ(c,x,y,r);c.fill();c.stroke();c.fillStyle='#C9D3DB';circ(c,x,y,r*.52);c.fill();c.stroke();
    c.save();c.translate(x,y);c.rotate(rot);c.strokeStyle='#6B7785';c.lineWidth=Math.max(1,r*.13);for(let i=0;i<3;i++){c.rotate(TAU/3);c.beginPath();c.moveTo(0,0);c.lineTo(r*.47,0);c.stroke();}c.restore();
    c.fillStyle=INK;circ(c,x,y,r*.13);c.fill();}
  function driveFx(c,u,t,xb,ye){
    c.save();for(let i=0;i<3;i++){const k=(t*2.2+i/3)%1;c.globalAlpha=(1-k)*.7;c.fillStyle='rgba(210,210,220,1)';circ(c,(xb-6-k*40)*u,(ye-k*10)*u,(4+k*9)*u);c.fill();}
    c.globalAlpha=.7;c.strokeStyle='#fff';c.lineWidth=Math.max(1.5,u*2.4);for(let i=0;i<3;i++){const k=(t*3+i*.37)%1,x0=(xb-20-k*60)*u,yy=(-30-i*20)*u;c.beginPath();c.moveTo(x0,yy);c.lineTo(x0-(22+i*8)*u,yy);c.stroke();}c.restore();
  }
  function seat(c,who,x,headY,s,t,extra){const L=Object.assign({},looks(who),{dir:0,t,noShadow:true},extra||{});drawPerson(c,x,headY+s*.31,s,L);}
  function propWrap(fn){return(c,a,x,y,s,t)=>{const u=s/100;c.save();c.translate(x,y);if(a.alpha!=null)c.globalAlpha=clamp(a.alpha,0,1);if(a.flip)c.scale(-1,1);if(a.rot)c.rotate(a.rot);
    c.lineJoin='round';c.lineCap='round';c.strokeStyle=INK;c.lineWidth=Math.max(1.2,u*2.2);
    const dr=!!a.driving;c.fillStyle='rgba(15,25,35,.22)';ell(c,0,0,s*.75,u*6);c.fill();
    try{fn(c,a,u,t||0,dr,dr?-Math.abs(Math.sin((t||0)*17))*u*1.6:0);}catch(e){console.error(e);}c.restore();};}
  function moodFor(a,i){return a.moods&&a.moods[i]?{mood:a.moods[i]}:{};}

  // side-view car shapes (facing right). Each: body path, windows, seats [x,headY,size], wheels [x,y,r], door polygon, lights
  const SSHAPE={
    hatch:{body:[[-80,-16],[-83,-46],['q',-82,-58,-72,-62],[-56,-84],['q',-20,-90,16,-86],[46,-60],['q',70,-56,80,-50],['q',86,-44,84,-30],[82,-16]],
      wins:[[[-68,-60],[-53,-79],[-38,-81],[-36,-60]],[[-31,-60],[-32,-82],[-12,-84],[-12,-60]],[[-7,-60],[-7,-84],[13,-83],[38,-60]]],
      seats:[[10,-65,30],[-24,-65,29]],wheels:[[-50,-16,16],[52,-16,16]],door:[[-9,-58],[40,-58],[42,-16],[-9,-16]],head:[78,-46],tail:[-85,-50],len:1.7},
    sport:{body:[[-84,-15],[-88,-34],['q',-86,-44,-78,-46],[-50,-52],['q',-34,-70,-14,-72],['q',10,-73,20,-70],[48,-52],['q',76,-48,88,-42],['q',94,-34,90,-15]],
      wins:[[[-42,-52],[-26,-67],[-6,-68],[-6,-52]],[[0,-52],[0,-68],[16,-67],[38,-52]]],
      seats:[[8,-56,27],[-22,-56,26]],wheels:[[-54,-17,17],[58,-17,17]],head:[84,-40],tail:[-88,-40],len:1.85,stripe:1,wing:1},
    jeep:{body:[[-82,-20],[-84,-82],['q',-84,-90,-76,-90],[30,-90],[46,-64],[84,-60],['q',90,-56,88,-44],[86,-20]],
      wins:[[[-74,-64],[-74,-84],[-30,-84],[-30,-64]],[[-24,-64],[-24,-84],[27,-84],[40,-64]]],
      seats:[[10,-71,30],[-50,-71,29]],wheels:[[-52,-21,21],[58,-21,21]],door:[[-20,-62],[42,-62],[42,-22],[-20,-22]],head:[84,-52],tail:[-86,-56],len:1.8,spare:1,rack:1},
    taxi:null,
    limo:{body:[[-112,-16],[-114,-44],['q',-112,-52,-102,-54],[-74,-56],[-58,-78],[56,-78],[74,-56],['q',100,-52,108,-48],['q',114,-40,112,-16]],
      wins:[[[-66,-58],[-55,-74],[-22,-74],[-22,-58]],[[-16,-58],[-16,-74],[20,-74],[20,-58]],[[26,-58],[26,-74],[52,-74],[66,-58]]],
      seats:[[40,-63,29],[-38,-63,29]],wheels:[[-78,-16,16],[80,-16,16]],head:[106,-46],tail:[-114,-48],len:2.3,chrome:1},
    icecream:{body:[[-86,-16],[-86,-96],['q',-86,-102,-78,-102],[42,-102],[68,-66],[84,-60],['q',90,-54,88,-30],[86,-16]],
      wins:[[[28,-96],[44,-96],[64,-68],[28,-68]]],seats:[[40,-78,30]],wheels:[[-54,-17,17],[56,-17,17]],head:[84,-50],tail:[-89,-60],len:1.75,ice:1}
  };
  SSHAPE.taxi=Object.assign({},SSHAPE.hatch,{taxi:1});
  function poly(c,pts,u){c.beginPath();pts.forEach((q,i)=>{if(q[0]==='q')c.quadraticCurveTo(q[1]*u,q[2]*u,q[3]*u,q[4]*u);else if(i)c.lineTo(q[0]*u,q[1]*u);else c.moveTo(q[0]*u,q[1]*u);});c.closePath();}
  function carSide(c,a,u,t,dr,bo,kind){
    const guard=kind==='guardcar',SK=guard?null:(VEHICLES[a.skin]||VEHICLES.dooshish),G=guard?SSHAPE.hatch:(SSHAPE[SK.shape]||SSHAPE.hatch);
    const col=a.col||(guard?'#2D3A66':SK.col),rot=dr?t*14:0;
    if(dr)driveFx(c,u,t,G.tail[0]+2,-14);
    if(a.preview)bo=-Math.abs(Math.sin(t*3))*u*1.2;
    c.translate(0,bo);
    if(G.spare){c.fillStyle='#1D232B';circ(c,-90*u,-52*u,15*u);c.fill();c.stroke();c.fillStyle=SK.door;circ(c,-90*u,-52*u,7*u);c.fill();c.stroke();}
    if(G.ice){c.fillStyle='#E8B068';c.beginPath();c.moveTo(-34*u,-118*u);c.lineTo(-6*u,-118*u);c.lineTo(-20*u,-100*u);c.closePath();c.fill();c.stroke();
      c.strokeStyle='#B07A3B';c.beginPath();c.moveTo(-28*u,-114*u);c.lineTo(-16*u,-104*u);c.moveTo(-12*u,-114*u);c.lineTo(-24*u,-104*u);c.stroke();c.strokeStyle=INK;
      c.fillStyle='#FF8FB5';circ(c,-20*u,-126*u,15*u);c.fill();c.stroke();c.fillStyle='#E5484D';circ(c,-17*u,-143*u,4*u);c.fill();c.stroke();}
    c.fillStyle=col;poly(c,G.body,u);c.fill();c.stroke();
    const wins=()=>{c.beginPath();for(const w of G.wins){w.forEach((q,i)=>i?c.lineTo(q[0]*u,q[1]*u):c.moveTo(q[0]*u,q[1]*u));c.closePath();}};
    c.fillStyle='#33475E';wins();c.fill();
    const R=a.riders||[];
    c.save();wins();c.clip();
    if(R[1]&&G.seats[1])seat(c,R[1],G.seats[1][0]*u,G.seats[1][1]*u,G.seats[1][2]*u,t+1,moodFor(a,1));
    if(R[0])seat(c,R[0],G.seats[0][0]*u,G.seats[0][1]*u,G.seats[0][2]*u,t,Object.assign(moodFor(a,0),R[0]==='kiana'?{bird:true}:{}));
    c.fillStyle='rgba(200,240,255,.22)';c.fillRect(-120*u,-100*u,240*u,50*u);c.restore();
    if(G.chrome){c.fillStyle='#3A2E36';c.beginPath();c.moveTo(-58*u,-78*u);c.lineTo(56*u,-78*u);c.lineTo(58*u,-75*u);c.lineTo(-60*u,-75*u);c.closePath();c.fill();c.stroke();}
    wins();c.stroke();
    if(G.door&&!guard&&SK.door!==col){c.save();poly(c,G.body,u);c.clip();c.fillStyle=SK.door;c.beginPath();G.door.forEach((q,i)=>i?c.lineTo(q[0]*u,q[1]*u):c.moveTo(q[0]*u,q[1]*u));c.closePath();c.fill();c.restore();}
    if(G.door){const d=G.door;c.beginPath();c.moveTo(d[0][0]*u,d[0][1]*u-2*u);c.lineTo(d[3][0]*u,d[3][1]*u-2*u);c.moveTo(d[1][0]*u,d[1][1]*u);c.lineTo(d[2][0]*u,d[2][1]*u-2*u);c.stroke();
      c.fillStyle=INK;rr(c,(d[0][0]+7)*u,(d[0][1]+8)*u,9*u,3*u,1.5*u);c.fill();}
    if(G===SSHAPE.hatch||G.taxi){c.beginPath();c.moveTo(-34*u,-60*u);c.lineTo(-36*u,-18*u);c.moveTo(-68*u,-58*u);c.lineTo(42*u,-58*u);c.stroke();c.fillStyle=INK;rr(c,-29*u,-50*u,9*u,3*u,1.5*u);c.fill();
      c.fillStyle=col;rr(c,36*u,-66*u,9*u,7*u,2*u);c.fill();c.stroke();}
    if(G.stripe){c.fillStyle=SK.door;c.fillRect(-86*u,-38*u,176*u,6*u);c.strokeRect(-86*u,-38*u,176*u,6*u);}
    if(G.wing){c.fillStyle=shade(col,-.2);c.fillRect(-84*u,-56*u,4*u,10*u);c.fillStyle=col;rr(c,-96*u,-62*u,26*u,6*u,3*u);c.fill();c.stroke();}
    if(G.rack){c.strokeStyle='#5B6E82';c.lineWidth=Math.max(1.2,u*3);c.beginPath();c.moveTo(-74*u,-98*u);c.lineTo(26*u,-98*u);c.moveTo(-60*u,-90*u);c.lineTo(-60*u,-98*u);c.moveTo(14*u,-90*u);c.lineTo(14*u,-98*u);c.stroke();c.strokeStyle=INK;c.lineWidth=Math.max(1.2,u*2.2);
      c.fillStyle='#8B5A3C';rr(c,-50*u,-108*u,30*u,10*u,2*u);c.fill();c.stroke();}
    if(G.chrome){c.strokeStyle='#FFF4C9';c.lineWidth=Math.max(1.2,u*3);c.beginPath();c.moveTo(-110*u,-36*u);c.lineTo(110*u,-36*u);c.stroke();c.strokeStyle=INK;c.lineWidth=Math.max(1.2,u*2.2);drawCrown(c,98*u,-56*u,6*u,.2);
      for(const xx of[-50,-19,23])c.beginPath(),c.moveTo(xx*u,-56*u),c.lineTo(xx*u,-20*u),c.stroke();}
    if(G.taxi){c.fillStyle='#fff';rr(c,-24*u,-98*u,30*u,11*u,3*u);c.fill();c.stroke();txt(c,'تاکسی',-9*u,-92*u,Math.max(6,Math.round(8*u)),INK,null,FONT_B);
      for(let i=0;i<16;i++){c.fillStyle=i&1?INK:'#fff';c.fillRect((-78+i*10)*u,-42*u,10*u,5*u);}}
    if(G.ice){c.fillStyle='#33475E';rr(c,-74*u,-88*u,74*u,34*u,4*u);c.fill();c.stroke();
      for(let i=0;i<8;i++){c.fillStyle=i&1?'#fff':'#FF8FB5';c.beginPath();c.moveTo((-78+i*10)*u,-100*u);c.lineTo((-68+i*10)*u,-100*u);c.lineTo((-68+i*10)*u,-90*u);c.quadraticCurveTo((-73+i*10)*u,-84*u,(-78+i*10)*u,-90*u);c.closePath();c.fill();c.stroke();}
      c.fillStyle=SK.door;c.fillRect(-85*u,-46*u,170*u,8*u);c.strokeRect(-85*u,-46*u,170*u,8*u);
      for(let i=0;i<14;i++){c.fillStyle=['#FF8FB5','#5EC8F7','#FFC531','#8BD3B7'][i%4];rr(c,(-80+hsh(i)*120)*u,(-36+hsh(i+5)*14)*u,6*u,2.4*u,1*u);c.fill();}
      txt(c,'بستنی',-38*u,-70*u,Math.max(7,Math.round(14*u)),'#FFE58A',INK,FONT_D);}
    if(!guard&&G===SSHAPE.hatch)drawCrown(c,-60*u,-48*u,5*u,-.15);
    c.fillStyle='#FFF4C9';ell(c,G.head[0]*u,G.head[1]*u,6*u,4*u,-.3);c.fill();c.stroke();
    c.fillStyle='#E5484D';rr(c,G.tail[0]*u,G.tail[1]*u,6*u,11*u,2*u);c.fill();c.stroke();
    const L=G.body[0][0],Rx=G.body[G.body.length-1];const rx=Rx[0]==='q'?Rx[3]:Rx[0];
    c.fillStyle=G.chrome?'#E8EEF2':'#3E4652';rr(c,(L-6)*u,-24*u,14*u,8*u,3*u);c.fill();c.stroke();rr(c,(rx-10)*u,-24*u,14*u,8*u,3*u);c.fill();c.stroke();
    c.fillStyle='rgba(255,255,255,.3)';c.fillRect((L+10)*u,-50*u,(rx-L-30)*u*.5,2.5*u);
    if(guard){c.fillStyle='#FFC531';starPath(c,16*u,-38*u,8*u);c.fill();c.stroke();c.fillStyle='#fff';c.fillRect(-60*u,-34*u,120*u,5*u);
      const ph=Math.sin(t*12)>0||!(a.siren||dr);c.fillStyle='#1E2547';rr(c,-30*u,-95*u,40*u,8*u,3*u);c.fill();c.stroke();
      c.fillStyle=ph?'#FF4F5E':'#7A2030';rr(c,-28*u,-94*u,17*u,6*u,2*u);c.fill();c.fillStyle=!ph?'#5EC8F7':'#2A3A7A';rr(c,-9*u,-94*u,17*u,6*u,2*u);c.fill();
      if(a.siren||dr){c.save();c.globalCompositeOperation='lighter';glow(c,ph?-20*u:0,-92*u,30*u,ph?'255,70,90':'90,170,255',.7);c.restore();}}
    for(const w of G.wheels){c.fillStyle='rgba(0,0,0,.35)';circ(c,w[0]*u,w[1]*u,(w[2]+3)*u);c.fill();}
    for(const w of G.wheels)wheelS(c,w[0]*u,w[1]*u,w[2]*u,rot);
  }
  PROP_EXT.car=propWrap((c,a,u,t,dr,bo)=>carSide(c,a,u,t,dr,bo,'car'));
  PROP_EXT.guardcar=propWrap((c,a,u,t,dr,bo)=>carSide(c,a,u,t,dr,bo,'guardcar'));

  PROP_EXT.moto=propWrap((c,a,u,t,dr,bo)=>{
    const SK=VEHICLES[a.skin]||VEHICLES.hiromoto,col=a.col||SK.col,sh=SK.shape,rot=dr?t*16:0,R=a.riders||[],wr=sh==='scooter'?13:sh==='cross'?19:17;
    if(dr)driveFx(c,u,t,-62,-20);
    if(a.preview)bo=-Math.abs(Math.sin(t*3))*u*1.2;
    c.translate(0,bo);
    if(sh==='neon'){c.save();c.globalCompositeOperation='lighter';c.save();c.scale(1,.25);glow(c,0,-14*u*4,80*u,'94,247,230',.55);c.restore();c.restore();}
    if(sh==='street'){c.fillStyle='#7A4A2E';rr(c,-66*u,-74*u,26*u,20*u,4*u);c.fill();c.stroke();drawHeld(c,'cup',-53*u,-63*u,30*u,t);}
    const H=R[0]?looks(R[0]):null,K=R[1]?looks(R[1]):null;
    if(R[0]==='hiroman'){const f=Math.sin(t*12)*4*u;c.fillStyle='#F4E6C8';c.beginPath();c.moveTo(6*u,-96*u);c.quadraticCurveTo(-24*u,-100*u+f,-56*u,-92*u+f*1.5);
      for(let i=0;i<5;i++)c.lineTo((-56+i*10)*u,(-80+(i%2?6:0))*u+f*(1-i/5));c.quadraticCurveTo(-4*u,-74*u,6*u,-84*u);c.closePath();c.fill();c.stroke();}
    c.save();c.beginPath();c.rect(-120*u,-200*u,240*u,148*u);c.clip();
    const dy=sh==='cross'?-4:0;
    if(R[0])seat(c,R[0],12*u,(-92+dy)*u,48*u,t,Object.assign({arms:'point'},moodFor(a,0),R[0]==='kiana'?{bird:true}:{}));
    if(R[1])seat(c,R[1],-20*u,(-90+dy)*u,46*u,t*(dr?3:1),Object.assign({arms:'hold'},moodFor(a,1),R[1]==='kiana'?{bird:true}:{}));
    c.restore();
    if(sh==='scooter'){
      c.fillStyle='#2A2F38';rr(c,-44*u,-60*u,46*u,9*u,4*u);c.fill();c.stroke();
      c.fillStyle=col;c.beginPath();c.moveTo(-60*u,-30*u);c.quadraticCurveTo(-66*u,-60*u,-30*u,-54*u);c.lineTo(0,-52*u);c.lineTo(8*u,-30*u);c.closePath();c.fill();c.stroke();
      c.beginPath();c.moveTo(8*u,-30*u);c.lineTo(38*u,-30*u);c.lineTo(30*u,-80*u);c.quadraticCurveTo(22*u,-64*u,14*u,-44*u);c.closePath();c.fill();c.stroke();
      c.fillStyle='rgba(255,255,255,.45)';ell(c,-44*u,-48*u,9*u,4*u,-.4);c.fill();
    }else{
      c.fillStyle='#2A2F38';rr(c,-44*u,(-58+dy)*u,52*u,9*u,4*u);c.fill();c.stroke();
      c.fillStyle=col;c.beginPath();c.moveTo(-50*u,(-50+dy)*u);c.lineTo(-10*u,(-50+dy)*u);c.lineTo(4*u,(-62+dy)*u);c.quadraticCurveTo(22*u,(-68+dy)*u,32*u,(-58+dy)*u);c.lineTo(30*u,-40*u);c.lineTo(-6*u,-30*u);c.lineTo(-40*u,-36*u);c.closePath();c.fill();c.stroke();
      if(sh==='street')c.fillStyle='#FFF4C9',c.fillRect(0,-57*u,26*u,4*u);
      if(sh==='neon'){c.save();c.globalCompositeOperation='lighter';c.strokeStyle=SK.glow;c.lineWidth=Math.max(1.5,u*3);c.beginPath();c.moveTo(-46*u,-46*u);c.lineTo(-8*u,-46*u);c.lineTo(4*u,-56*u);c.lineTo(28*u,-56*u);c.stroke();c.restore();c.strokeStyle=INK;c.lineWidth=Math.max(1.2,u*2.2);}
      if(sh==='cross'){c.fillStyle='#fff';ell(c,36*u,-72*u,9*u,8*u);c.fill();c.stroke();txt(c,'۷',36*u,-71*u,Math.max(6,Math.round(11*u)),INK,null,FONT_D);
        c.fillStyle=col;c.beginPath();c.moveTo(-60*u,-50*u);c.lineTo(-30*u,-44*u);c.lineTo(-36*u,-40*u);c.closePath();c.fill();c.stroke();}
    }
    c.lineWidth=Math.max(1.2,u*3.5);c.beginPath();c.moveTo(42*u,-wr*u);c.lineTo(30*u,-70*u);c.stroke();c.lineWidth=Math.max(1.2,u*2.2);
    c.fillStyle='#2A2F38';rr(c,22*u,-76*u,16*u,6*u,3*u);c.fill();c.stroke();
    c.fillStyle='#FFF4C9';ell(c,40*u,-60*u,6*u,7*u);c.fill();c.stroke();
    if(dr){c.save();c.globalCompositeOperation='lighter';glow(c,50*u,-60*u,30*u,'255,240,170',.5);c.restore();}
    if(sh!=='scooter'){c.fillStyle='#8E9AA6';rr(c,-48*u,-28*u,30*u,7*u,3*u);c.fill();c.stroke();}
    if(H){limb3(c,10*u,-58*u,26*u,-48*u,22*u,-28*u,7*u,H.pants||'#2E3440');c.fillStyle=INK;ell(c,25*u,-26*u,6*u,3*u);c.fill();}
    if(K){limb3(c,-20*u,-58*u,-6*u,-46*u,-12*u,-28*u,7*u,K.pants||'#3B3F6B');c.fillStyle=INK;ell(c,-9*u,-26*u,6*u,3*u);c.fill();}
    for(const wx of[-40,42]){wheelS(c,wx*u,-wr*u,wr*u,rot);if(sh==='cross'){c.fillStyle=INK;for(let i=0;i<12;i++){const an=rot+i*TAU/12;c.fillRect(wx*u+Math.cos(an)*wr*u-1.5*u,-wr*u+Math.sin(an)*wr*u-1.5*u,3*u,3*u);}}}
    if(sh!=='scooter'){c.fillStyle=col;c.beginPath();c.arc(-40*u,-wr*u,(wr+5)*u,P*1.1,P*1.75);c.lineTo(-40*u,-(wr+19)*u);c.closePath();c.fill();c.stroke();}
  });

  function boxTruck(c,a,u,t,dr,bo,kind){
    const rot=dr?t*13:0,R=a.riders||[];
    if(dr)driveFx(c,u,t,kind==='van'||kind==='teavan'?-88:-108,-16);
    c.translate(0,bo);
    if(kind==='van'||kind==='teavan'){
      const col=a.col||(kind==='teavan'?'#36A985':'#6C6F8C');
      const body=()=>{c.beginPath();c.moveTo(-86*u,-16*u);c.lineTo(-86*u,-96*u);c.quadraticCurveTo(-86*u,-102*u,-78*u,-102*u);c.lineTo(42*u,-102*u);c.lineTo(68*u,-66*u);c.lineTo(84*u,-60*u);c.quadraticCurveTo(90*u,-54*u,88*u,-30*u);c.lineTo(86*u,-16*u);c.closePath();};
      c.fillStyle=col;body();c.fill();c.stroke();
      const win=()=>{c.beginPath();c.moveTo(28*u,-96*u);c.lineTo(44*u,-96*u);c.lineTo(64*u,-68*u);c.lineTo(28*u,-68*u);c.closePath();};
      c.fillStyle='#33475E';win();c.fill();if(R[0]){c.save();win();c.clip();seat(c,R[0],40*u,-80*u,32*u,t,moodFor(a,0));c.restore();}
      c.fillStyle='rgba(200,240,255,.22)';win();c.fill();win();c.stroke();
      c.beginPath();c.moveTo(24*u,-100*u);c.lineTo(24*u,-18*u);c.moveTo(-20*u,-98*u);c.lineTo(-20*u,-18*u);c.stroke();
      c.fillStyle=INK;rr(c,14*u,-62*u,7*u,3*u,1.5*u);c.fill();
      if(kind==='teavan'){c.fillStyle='#C9524F';c.fillRect(-85*u,-56*u,170*u,9*u);c.strokeRect(-85*u,-56*u,170*u,9*u);miniTeapot(c,-50*u,-76*u,16*u,t);
        txt(c,'چای',-6*u,-80*u,Math.round(18*u),'#fff',INK);
        const ph=Math.sin(t*10)>0;c.fillStyle=ph?'#FFC531':'#B8860B';rr(c,-30*u,-112*u,24*u,10*u,4*u);c.fill();c.stroke();}
      else{c.fillStyle=shade(col,-.15);rr(c,-78*u,-92*u,48*u,22*u,4*u);c.fill();c.stroke();}
      c.fillStyle='#FFF4C9';ell(c,84*u,-50*u,5*u,5*u);c.fill();c.stroke();c.fillStyle='#E5484D';rr(c,-89*u,-60*u,5*u,18*u,2*u);c.fill();c.stroke();
      c.fillStyle='#3E4652';rr(c,-90*u,-24*u,16*u,8*u,3*u);c.fill();c.stroke();rr(c,76*u,-24*u,14*u,8*u,3*u);c.fill();c.stroke();
      c.fillStyle='rgba(0,0,0,.35)';circ(c,-54*u,-17*u,20*u);c.fill();circ(c,56*u,-17*u,20*u);c.fill();
      wheelS(c,-54*u,-17*u,17*u,rot);wheelS(c,56*u,-17*u,17*u,rot);
      return;}
    // trucks: cab on the right, cargo on the left
    const cab=kind==='mixer'?'#FFC531':'#C9524F';
    c.fillStyle='#4A5260';rr(c,-104*u,-34*u,170*u,12*u,3*u);c.fill();c.stroke();
    c.fillStyle=cab;c.beginPath();c.moveTo(62*u,-22*u);c.lineTo(62*u,-104*u);c.lineTo(88*u,-104*u);c.lineTo(104*u,-70*u);c.lineTo(106*u,-22*u);c.closePath();c.fill();c.stroke();
    const win=()=>{c.beginPath();c.moveTo(70*u,-98*u);c.lineTo(86*u,-98*u);c.lineTo(99*u,-72*u);c.lineTo(70*u,-72*u);c.closePath();};
    c.fillStyle='#33475E';win();c.fill();if(R[0]){c.save();win();c.clip();seat(c,R[0],82*u,-84*u,30*u,t,moodFor(a,0));c.restore();}
    c.fillStyle='rgba(200,240,255,.22)';win();c.fill();win();c.stroke();
    c.fillStyle='#FFF4C9';ell(c,104*u,-44*u,4*u,6*u);c.fill();c.stroke();
    if(kind==='mixer'){
      c.save();c.translate(-22*u,-74*u);c.rotate(-.12);
      const drum=()=>{ell(c,0,0,74*u,40*u);};c.fillStyle='#F2A23A';drum();c.fill();c.save();drum();c.clip();
      c.strokeStyle='#fff';c.lineWidth=9*u;const off=dr?(t*40%40):0;for(let i=-5;i<6;i++){const x0=i*26*u+off*u;c.beginPath();c.moveTo(x0-14*u,-44*u);c.quadraticCurveTo(x0+6*u,0,x0-14*u,44*u);c.stroke();}c.restore();
      c.strokeStyle=INK;c.lineWidth=Math.max(1.2,u*2.2);drum();c.stroke();
      c.fillStyle='#C8A06A';rr(c,-90*u,-30*u,22*u,18*u,6*u);c.fill();c.stroke();rr(c,-86*u,-12*u,20*u,16*u,6*u);c.fill();c.stroke();
      c.restore();
      c.fillStyle='#E5484D';c.beginPath();c.moveTo(-100*u,-62*u);c.lineTo(-116*u,-48*u);c.lineTo(-108*u,-42*u);c.lineTo(-94*u,-54*u);c.closePath();c.fill();c.stroke();
      if(dr){c.fillStyle='#6B3E26';for(let i=0;i<4;i++){const k=(t*1.8+i/4)%1;ell(c,(-112-k*20)*u,(-40+k*24)*u,3.5*u,2.5*u,k*8);c.fill();}}
      c.strokeStyle='#5B6E82';c.lineWidth=Math.max(1,u*3);c.beginPath();c.moveTo(-60*u,-34*u);c.lineTo(-60*u,-110*u);c.moveTo(20*u,-34*u);c.lineTo(20*u,-108*u);c.stroke();c.strokeStyle=INK;c.lineWidth=Math.max(1.2,u*2.2);
    }else{
      const col=a.col||'#36A985';c.fillStyle=col;rr(c,-110*u,-132*u,166*u,100*u,6*u);c.fill();c.stroke();
      c.strokeStyle='#C9524F';c.lineWidth=Math.max(1.2,u*4);c.strokeRect(-104*u,-126*u,154*u,88*u);c.strokeStyle=INK;c.lineWidth=Math.max(1.2,u*2.2);
      c.save();c.translate(-50*u,-84*u);c.fillStyle='#fff';c.beginPath();c.moveTo(-22*u,-16*u);c.lineTo(22*u,-16*u);c.quadraticCurveTo(20*u,14*u,0,16*u);c.quadraticCurveTo(-20*u,14*u,-22*u,-16*u);c.closePath();c.fill();c.stroke();
      c.lineWidth=Math.max(1.2,u*3);c.beginPath();c.arc(24*u,-4*u,8*u,-P/2,P/2);c.stroke();c.fillStyle='#B4321F';c.fillRect(-18*u,-14*u,36*u,7*u);
      for(let i=0;i<3;i++){c.fillStyle='#fff';c.lineWidth=Math.max(1,u*1.8);rr(c,(-15+i*10)*u,(-36-(i===1?5:0))*u,9*u,9*u,1.5*u);c.fill();c.stroke();}c.restore();
      txt(c,'چای ملکه',10*u,-84*u,Math.round(20*u),'#FFF4C9',INK);
    }
    c.fillStyle='rgba(0,0,0,.35)';for(const wx of[-76,-46,74])circ(c,wx*u,-18*u,21*u),c.fill();
    for(const wx of[-76,-46,74])wheelS(c,wx*u,-18*u,18*u,rot);
  }
  PROP_EXT.van=propWrap((c,a,u,t,dr,bo)=>boxTruck(c,a,u,t,dr,bo,'van'));
  PROP_EXT.teavan=propWrap((c,a,u,t,dr,bo)=>boxTruck(c,a,u,t,dr,bo,'teavan'));
  PROP_EXT.mixer=propWrap((c,a,u,t,dr,bo)=>boxTruck(c,a,u,t,dr,bo,'mixer'));
  PROP_EXT.teatruck=propWrap((c,a,u,t,dr,bo)=>boxTruck(c,a,u,t,dr,bo,'teatruck'));

  BG_EXT.road=(c,W,H,st,t,o)=>{
    o=o||{};const pal=PAL[o.night?'night':o.dawn?'dawn':'day'],night=pal.night;
    const off=t*(o.speed||0)*(o.dir||1)*st.w*1.1,fy=st.y+st.h*.74;
    const g=c.createLinearGradient(0,0,0,fy);pal.sky.forEach((s,i)=>g.addColorStop(i/(pal.sky.length-1),s));c.fillStyle=g;c.fillRect(0,0,W,fy+2);
    const md=(v,m)=>((v%m)+m)%m;
    if(night>.9){c.fillStyle='#fff';for(let i=0;i<50;i++){c.globalAlpha=.4+hsh(i)*.6;circ(c,hsh(i)*W,hsh(i+40)*fy*.6,1+hsh(i+3));c.fill();}c.globalAlpha=1;c.fillStyle='#FFF4C9';circ(c,W*.8,fy*.18,Math.min(W,H)*.045);c.fill();}
    else if(o.dawn){glow(c,W*.5,fy*.62,W*.5,'255,210,140',.6);c.fillStyle='#FFE08A';circ(c,W*.5,fy*.62,st.w*.12);c.fill();}
    else{c.fillStyle='#FFE58A';circ(c,W*.85,fy*.15,st.w*.06);c.fill();for(let i=0;i<4;i++)cloud(c,md(hsh(i)*W*1.4-off*.05,W*1.4)-W*.2,fy*(.12+hsh(i+3)*.25),12+hsh(i+5)*12);}
    // far skyline
    const s1=st.w*.18;c.fillStyle=pal.far;for(let i=-1;i<W/s1+2;i++){const j=i+Math.floor(off*.15/s1),x=i*s1-md(off*.15,s1),bh=st.h*(.1+hsh(j*1.3)*.14);c.fillRect(x,fy-st.h*.12-bh,s1*.86,bh+st.h*.12);}
    // mid buildings
    const s2=st.w*.34;for(let i=-1;i<W/s2+2;i++){const j=i+Math.floor(off*.5/s2),x=i*s2-md(off*.5,s2),bh=st.h*(.2+hsh(j*2.7+1)*.2),col=pal.bld[Math.floor(hsh(j*5.1+2)*pal.bld.length)];
      c.fillStyle=col;c.fillRect(x,fy-st.h*.06-bh,s2*.9,bh);c.lineWidth=3;c.strokeStyle=INK;c.strokeRect(x,fy-st.h*.06-bh,s2*.9,bh);
      for(let wy=fy-st.h*.06-bh+10;wy<fy-st.h*.12;wy+=st.h*.06)for(let wx=x+8;wx<x+s2*.9-14;wx+=s2*.2){c.fillStyle=hsh(wx*.1+wy+j)>.45?pal.lit:pal.win;c.fillRect(wx,wy,s2*.1,st.h*.035);}
      c.fillStyle=hsh(j)>.5?'#FF6B6E':'#2BB59A';c.fillRect(x,fy-st.h*.075,s2*.9,st.h*.018);}
    // sidewalk
    c.fillStyle=pal.side;c.fillRect(0,fy-st.h*.06,W,st.h*.06);c.fillStyle=pal.kerbB;c.fillRect(0,fy-4,W,6);
    // lamps / trees
    const s3=st.w*.62;for(let i=-1;i<W/s3+2;i++){const x=i*s3-md(off,s3)+s3*.3,j=i+Math.floor(off/s3);
      if(!night&&hsh(j*3.1)>.4){c.fillStyle='#8B5A3C';c.fillRect(x+s3*.45,fy-st.h*.16,8,st.h*.12);c.lineWidth=2.5;c.strokeStyle=INK;c.strokeRect(x+s3*.45,fy-st.h*.16,8,st.h*.12);c.fillStyle='#62C784';circ(c,x+s3*.45+4,fy-st.h*.19,st.w*.06);c.fill();c.stroke();}
      c.fillStyle=INK;c.fillRect(x-3,fy-st.h*.3,6,st.h*.3);c.fillRect(x-3,fy-st.h*.3,st.w*.07,5);
      c.fillStyle=night>.3?'#FFE58A':'#E6E6E6';ell(c,x+st.w*.07,fy-st.h*.29,st.w*.03,st.w*.015);c.fill();c.lineWidth=2;c.strokeStyle=INK;c.stroke();
      if(night>.3){c.save();c.globalCompositeOperation='lighter';glow(c,x+st.w*.07,fy-st.h*.27,st.w*.22,'255,220,130',.35*night);c.restore();}}
    // road
    c.fillStyle=pal.road;c.fillRect(0,fy,W,H-fy);
    c.fillStyle=pal.line;const dl=st.w*.16,yl=fy+(H-fy)*.42;for(let i=-1;i<W/(dl*2)+2;i++){c.fillRect(i*dl*2-md(off*1.2,dl*2),yl,dl,Math.max(4,st.h*.012));}
    c.fillStyle=pal.kerbA;c.fillRect(0,fy,W,4);
    if(night>.5){c.fillStyle='rgba(10,10,40,.25)';c.fillRect(0,0,W,H);}
  };

  function state(){return S?{phase:S.phase,t:S.t,p:S.p,z:S.z,v:S.v,vC:S.vC,lane:S.lane,px:S.px,hits:S.hits,coins:S.coins,coinsTotal:S.coinsTotal,coinsPlaced:S.coinsPlaced,
    nitro:S.nitro,gap:S.gap,tI:S.tI,tN:S.tN,objs:S.objs.length,reason:S.reason,result:S.result,ended:S.ended,purs:S.purs&&S.purs.map(q=>q.st+':'+q.rz.toFixed(1)),log:S.log}:null;}
  return{start,update,render,pointer,key,pause,stop,state,auto(on){autoOn=!!on;},
    rearPreview(c,key,x,y,w,t){const v=VEHICLES[key]||VEHICLES.dooshish;if(v.type==='moto')rearMoto(c,x,y,w*.8,{t:t||0,skin:key,solo:true,night:0});else rearVeh(c,'dooshish',x,y,w,{t:t||0,skin:key,sv:6,night:0});}};
})();
/* Garage preview: side view, Kiana driving. x,y = ground centre; the drawing is ≈ s*1.7 wide for every vehicle. */
function VEH_DRAW(c,key,x,y,s,t){
  const v=VEHICLES[key]||VEHICLES.dooshish,moto=v.type==='moto';
  const len={hatch:1.7,taxi:1.7,sport:1.85,jeep:1.8,limo:2.3,icecream:1.75}[v.shape]||1.7;
  const a={prop:moto?'moto':'car',skin:key,riders:['kiana'],preview:true,moods:['happy']};
  const ss=moto?s*1.15:s*1.7/len;
  c.save();try{PROP_EXT[a.prop](c,a,x,y,ss,t||0);}catch(e){console.error(e);}c.restore();
}
