'use strict';
/* ============================================================
   Kiana Queen — pure level simulation (no DOM).
   Shared by the game and by the offline level checker.
   Map legend:
   #  wall            .  floor             K  Kiana's desk (start + return)
   S  document        c  coin              B  golden coffee bean
   T  clock (+10s)    E  espresso shot     *  hidden secret (invisible)
   d desk  p plant  f cabinet  x crate  o sofa  v vending machine   (solid)
   h  hiding closet (walk in, stand still = invisible)
   n  squeaky tile (noise: nearby people turn around)
   ~  laser beam (blinks on/off)
   1/!  pink keycard / pink door      2/@  blue keycard / blue door
   u  air vent: vents are linked in PAIRS in reading order (1st<->2nd, 3rd<->4th...).
      Kiana's pathfinding may crawl from a vent to its partner (cost VENT_COST); workers never do.
   m  copy machine (solid). Tap it: Kiana walks next to it and switches it on; the nearest
      worker walks over to look at it for a few seconds (a free, reusable distraction).
   ============================================================ */
const SIM_TAU=Math.PI*2,SIM_P=Math.PI;
const SOLID_CH='#dpfxovm';
const VENT_COST=2.2;
const DOOR_OF={'!':'1','@':'2'};

function parseLevel(def){
  const rows=def.map,H=rows.length,W=rows[0].length,solid=[],items=[],doors=[];let start=null;
  const noise=new Set(),hide=new Set(),laser=new Set(),vents=[],printers=[];
  for(let y=0;y<H;y++){solid.push([]);for(let x=0;x<W;x++){const ch=rows[y][x];solid[y].push(SOLID_CH.includes(ch));
    if(ch==='K')start={x,y};
    if(DOOR_OF[ch])doors.push({x,y,key:DOOR_OF[ch]});
    if(ch==='u')vents.push(y*W+x);if(ch==='m')printers.push({x,y});if(ch==='n')noise.add(y*W+x);if(ch==='h')hide.add(y*W+x);if(ch==='~')laser.add(y*W+x);
    const kind={S:'doc',c:'coin',B:'bean',T:'clock',E:'shot','*':'secret','1':'key','2':'key'}[ch];
    if(kind)items.push({kind,x,y,key:(ch==='1'||ch==='2')?ch:null});}}
  if(rows.some(r=>r.length!==W))throw new Error('ragged map: '+def.name);
  for(const f of def.friends||[])solid[f.y][f.x]=true;
  if(vents.length%2)throw new Error('odd number of vents: '+def.name);
  const vent=new Map();for(let i=0;i<vents.length;i+=2){vent.set(vents[i],vents[i+1]);vent.set(vents[i+1],vents[i]);}
  return{W,H,rows,solid,items,start,doors,noise,hide,laser,vent,printers};
}
function doorAt(G,x,y){const ch=G.L.rows[y][x];return DOOR_OF[ch]||null;}
function walk(G,x,y){const L=G.L;if(x<0||y<0||x>=L.W||y>=L.H||L.solid[y][x])return false;const d=doorAt(G,x,y);return !d||!!(G.keys&&G.keys[d]);}
function blocksSight(G,x,y){return !walk(G,x,y)&&!(G.L.laser.has(y*G.L.W+x));}
const SIM_DIRS=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
function findPath(G,sx,sy,tx,ty,vents){
  if(!walk(G,tx,ty)||!walk(G,sx,sy))return null;
  const L=G.L,W=L.W,N=W*L.H,dist=new Float32Array(N).fill(Infinity),prev=new Int32Array(N).fill(-1),done=new Uint8Array(N);
  const s=sy*W+sx,t=ty*W+tx;dist[s]=0;
  for(;;){let c=-1,b=Infinity;for(let i=0;i<N;i++)if(!done[i]&&dist[i]<b){b=dist[i];c=i;}
    if(c<0||c===t)break;done[c]=1;const cx=c%W,cy=(c/W)|0;
    for(const[dx,dy]of SIM_DIRS){const nx=cx+dx,ny=cy+dy;if(!walk(G,nx,ny))continue;if(dx&&dy&&(!walk(G,cx+dx,cy)||!walk(G,cx,cy+dy)))continue;
      const n=ny*W+nx,nd=dist[c]+(dx&&dy?1.414:1)+(G.avoid&&G.avoid(nx,ny)?2.5:0);if(nd<dist[n]){dist[n]=nd;prev[n]=c;}}
    if(vents&&L.vent.has(c)){const n=L.vent.get(c),nd=dist[c]+VENT_COST;if(nd<dist[n]){dist[n]=nd;prev[n]=c;}}}
  if(dist[t]===Infinity)return null;
  const path=[];let c=t;while(c!==-1){path.push({x:c%W+.5,y:((c/W)|0)+.5});c=prev[c];}
  path.reverse();return{path,dist:dist[t]};
}
function lineClear(G,x0,y0,x1,y1){const d=Math.hypot(x1-x0,y1-y0),n=Math.ceil(d*8),ox=Math.floor(x0),oy=Math.floor(y0);
  for(let i=1;i<n;i++){const k=i/n,tx=Math.floor(x0+(x1-x0)*k),ty=Math.floor(y0+(y1-y0)*k);if(tx===ox&&ty===oy)continue;if(blocksSight(G,tx,ty))return false;}return true;}
function angDiff(a,b){let d=(b-a)%SIM_TAU;if(d>SIM_P)d-=SIM_TAU;if(d<-SIM_P)d+=SIM_TAU;return d;}
function turnToward(cur,tgt,step){const d=angDiff(cur,tgt);return Math.abs(d)<=step?tgt:cur+Math.sign(d)*step;}
/* boss gets sharper with every document Kiana steals */
function bossBoost(G,w){return w.boss?(G.docsGot||0):0;}
function visionRange(G,w){if(w.asleep)return 0;return (w.range+bossBoost(G,w)*.55)*(w.state==='eating'&&!(w.donut&&w.donut.inspect)?.35:1);}
function visionFov(G,w){return w.fov+bossBoost(G,w)*.07;}
function canSee(G,w,x,y){const r=visionRange(G,w);if(r<=0)return false;const dx=x-w.x,dy=y-w.y,d=Math.hypot(dx,dy);
  if(d>r)return false;if(d>.4&&Math.abs(angDiff(w.dir,Math.atan2(dy,dx)))>visionFov(G,w))return false;return lineClear(G,w.x,w.y,x,y);}
function conePoly(G,w){const r=visionRange(G,w),f=visionFov(G,w),N=28,pts=[[w.x,w.y]],ox=Math.floor(w.x),oy=Math.floor(w.y);
  if(r<=0)return pts;
  for(let i=0;i<=N;i++){const a=w.dir-f+2*f*i/N,ca=Math.cos(a),sa=Math.sin(a);let d=0;
    while(d<r){const nd=d+.08,tx=Math.floor(w.x+ca*nd),ty=Math.floor(w.y+sa*nd);if(!(tx===ox&&ty===oy)&&blocksSight(G,tx,ty))break;d=nd;}
    pts.push([w.x+ca*d,w.y+sa*d]);}
  return pts;}
function laserOn(G,x,y,t){const lz=G.def.laser||{on:1.6,off:1.6};const per=lz.on+lz.off,ph=((t+y*(lz.step==null?.8:lz.step))%per+per)%per;return ph<lz.on;}

function makeWorker(G,d){
  const w=Object.assign({},d);w.state='routine';w.path=[];w.lookT=0;w.hearCD=0;w.t=0;w.seed=(d.x||d.wps&&d.wps[0][0]||0)*1.7;
  if(d.type==='patrol'){w.x=d.wps[0][0]+.5;w.y=d.wps[0][1]+.5;w.wp=0;w.waitBase=d.wait||1;w.wait=.4;w.dir=d.dir0||0;
    w.loop=[];for(let i=0;i<d.wps.length;i++){const a=d.wps[i],b=d.wps[(i+1)%d.wps.length];const r=findPath(G,a[0],a[1],b[0],b[1]);if(r)w.loop.push(r.path);else w.broken=true;}}
  else{w.x=d.x+.5;w.y=d.y+.5;w.x0=w.x;w.y0=w.y;w.ai=0;w.dir=d.angles[0];w.wait=d.pause;}
  if(d.radar)w.radar={t:0,p:-1,hit:false,every:d.radar.every,range:d.radar.range};
  if(d.nap){w.napT=0;w.asleep=false;}
  return w;
}
function makeCam(d){return{cam:true,x:d.x+.5,y:d.y+.5,angles:d.angles,ai:0,dir:d.angles[0],wait:d.pause,pause:d.pause,range:d.range,fov:d.fov,state:'routine',t:0,turn:d.turn||.9};}
function wPathTo(G,e,tx,ty){const r=findPath(G,Math.floor(e.x),Math.floor(e.y),tx,ty);return r?r.path.slice(1):[];}
function moveAlong(e,dt,speed,turnRate){
  let st=speed*dt,first=true; // carry the leftover step past path nodes (same speed at 30/60/120 Hz); never across a vent jump
  while(e.path.length&&st>0){const p=e.path[0],dx=p.x-e.x,dy=p.y-e.y,d=Math.hypot(dx,dy);
    if(d>1.6&&!first)break;first=false;
    if(d>.001)e.dir=turnToward(e.dir,Math.atan2(dy,dx),turnRate*dt);
    if(d<=st){e.x=p.x;e.y=p.y;e.path.shift();st-=d;}else{e.x+=dx/d*st;e.y+=dy/d*st;st=0;}}
  e.walking=true;
}
function wArrived(G,w){
  if(w.state==='toDonut'){w.state='eating';w.eatT=(w.donut&&w.donut.dur)||5;}
  else if(w.state==='returning'){w.state='routine';if(w.saved)w.dir=w.saved.dir;w.wait=.6;}
  else w.wait=w.type==='patrol'?w.waitBase:w.pause;
}
function updWorker(G,w,dt){
  w.walking=false;w.t+=dt;w.hearCD-=dt;
  if(w.cam){if(G.camsOff>0)return;const tgt=w.angles[w.ai];w.dir=turnToward(w.dir,tgt,w.turn*dt);if(Math.abs(angDiff(w.dir,tgt))<.01){w.wait-=dt;if(w.wait<=0){w.ai=(w.ai+1)%w.angles.length;w.wait=w.pause;}}return;}
  if(w.nap&&w.state==='routine'&&w.lookT<=0){w.napT+=dt;const per=w.nap.awake+w.nap.sleep,ph=(w.napT+(w.nap.offset||0))%per;const was=w.asleep;w.asleep=ph>=w.nap.awake;
    if(w.asleep)return;if(was&&!w.asleep)w.justWoke=1;}
  if(w.radar&&w.state!=='eating'){const r=w.radar;r.t+=dt;if(r.p<0&&r.t>=r.every){r.p=0;r.t=0;r.hit=false;r.fired=true;}if(r.p>=0){r.p+=dt/1.15;if(r.p>=1)r.p=-1;}}
  if(w.state==='eating'){w.eatT-=dt;w.donut.t=1-w.eatT/(w.donut.dur||5);if(w.donut.inspect)w.dir+=dt*2.4;
    if(w.eatT<=0){G.donuts=G.donuts.filter(d=>d!==w.donut);w.donut=null;
      if(w.type==='turn'){w.state='returning';w.path=wPathTo(G,w,Math.floor(w.saved.x),Math.floor(w.saved.y));if(!w.path.length)wArrived(G,w);}
      else{w.state='returning';const[tx,ty]=w.wps[w.wp];w.path=wPathTo(G,w,tx,ty);if(!w.path.length)wArrived(G,w);}}
    return;}
  if(w.lookT>0&&w.state!=='toDonut'){w.lookT-=dt;w.dir=turnToward(w.dir,w.lookDir,6*dt);return;}
  if(w.path.length){moveAlong(w,dt,w.state==='toDonut'?(w.donut&&w.donut.inspect?1.8:2.3):(w.speed||1.5),7);if(!w.path.length)wArrived(G,w);return;}
  if(w.state!=='routine'){wArrived(G,w);return;}
  if(w.type==='turn'){const tgt=w.angles[w.ai];w.dir=turnToward(w.dir,tgt,(w.turnRate||2.3)*dt);
    if(Math.abs(angDiff(w.dir,tgt))<.01){w.wait-=dt;if(w.wait<=0){w.ai=(w.ai+1)%w.angles.length;w.wait=w.pause;}}}
  else{if(w.wait>0)w.wait-=dt;else{w.wp=(w.wp+1)%w.wps.length;const[tx,ty]=w.wps[w.wp];w.path=wPathTo(G,w,tx,ty);if(!w.path.length)w.wait=w.waitBase;}}
}
/* A fresh world (no Kiana) for a level — used by the game and the checker */
function makeWorld(def){
  const G={def,keys:{},donuts:[],docsGot:0,camsOff:0};G.L=parseLevel(def);
  G.workers=def.workers.map(d=>makeWorker(G,d));G.cams=(def.cams||[]).map(makeCam);
  return G;
}
if(typeof module!=='undefined')module.exports={VENT_COST,parseLevel,walk,findPath,lineClear,canSee,conePoly,laserOn,makeWorker,makeCam,updWorker,makeWorld,visionRange,angDiff,turnToward,moveAlong,blocksSight,DOOR_OF};
