'use strict';
/* ============================================================
   Art: characters, props, backgrounds (all procedural canvas)
   ============================================================ */
const TAU=Math.PI*2,P=Math.PI,INK='#22303C';
const FONT_D="'Lalezar','Vazirmatn',Tahoma,sans-serif",FONT_B="'Vazirmatn',Tahoma,sans-serif";

function rr(c,x,y,w,h,r){r=Math.max(0,Math.min(r,w/2,h/2));c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
function circ(c,x,y,r){c.beginPath();c.arc(x,y,Math.max(0,r),0,TAU);}
function ell(c,x,y,rx,ry,rot){c.beginPath();c.ellipse(x,y,Math.max(0,rx),Math.max(0,ry),rot||0,0,TAU);}
function hsh(i){const v=Math.sin(i*127.1+311.7)*43758.5453;return v-Math.floor(v);}
function shade(hex,a){let n=parseInt(hex.slice(1),16),r=n>>16,g=n>>8&255,b=n&255;const f=a<0?0:255,p=Math.abs(a);
  r=Math.round(r+(f-r)*p);g=Math.round(g+(f-g)*p);b=Math.round(b+(f-b)*p);return'#'+((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1);}
function heartPath(c,x,y,r){c.beginPath();c.moveTo(x,y+r*.9);c.bezierCurveTo(x-r*1.6,y-r*.1,x-r*.7,y-r*1.3,x,y-r*.45);c.bezierCurveTo(x+r*.7,y-r*1.3,x+r*1.6,y-r*.1,x,y+r*.9);c.closePath();}
function starPath(c,x,y,r,n,ir){n=n||5;ir=ir||.45;c.beginPath();for(let i=0;i<n*2;i++){const a=-P/2+i*P/n,q=i%2?r*ir:r;c.lineTo(x+Math.cos(a)*q,y+Math.sin(a)*q);}c.closePath();}
function txt(c,s,x,y,size,col,stroke,font){c.save();c.font=size+'px '+(font||FONT_D);c.textAlign='center';c.textBaseline='middle';c.direction='rtl';
  if(stroke){c.lineJoin='round';c.lineWidth=size*.22;c.strokeStyle=stroke;c.strokeText(s,x,y);}c.fillStyle=col;c.fillText(s,x,y);c.restore();}

/* ---------------- Cast ----------------
   Generic person features (any PEOPLE entry, scene actor or costume may use them):
   jacket:'#col' + jstyle:'open'|'vest'|'suit'|'cardigan'|'coat'|'fur' (leather/shiny/studs = finish), tvest:'#col' (bank-teller vest + name tag),
   belly, scarf2:'#col' (big knitted scarf; scarfSmall = neckerchief), watch:'#col', shades:'eyes'|'heart'|'head' (pushed up on the head),
   glasses:'round'|'cat'|'big' (+glassCol), cocky (one raised brow), droopy (sleepy kind lids), grin (big toothy grin), rosy, mustache:'thick'|'gold'|'thin',
   cape:'#col' (+capeIn, capeEdge:'plain'|'filter'|'ermine'), gown, coat (long coat skirt), belt, sleeve, glove, boot (+bootH tall boots), shorts, flare,
   hat:'beret'|'pirate'|'wizard'|'chef'|'fedora'|'capback'|'helmet'|'viking'|'crown2' (+hatCol), hood:'ninja'|'cat'|'panda'|'astro' (+hoodCol),
   band:'#col' (headband, +bandDot), phones:'#col', catears, flower, bowtie:'#col', pocket:'#col', tail:'#col', pack, guitar, mask:'#col', emblem:'k'|'cup' */
const PEOPLE={
  kiana:{name:'کیانا',skin:'#FCDCC8',hairCol:'#4A2A21',hair:'kiana',shirt:'#FF5A8C',shirt2:'#E03A72',pants:'#3B3F6B',crown:true,lashes:true,eyeCol:'#5A3426'},
  hiroman:{name:'هیرومن',skin:'#F4D3B5',hairCol:'#2A2230',hair:'spiky',hstyle:'swoop',shirt:'#FFFFFF',shirt2:'#DCE2E8',apron:'#7A4A2E',pants:'#2E3440',eyeCol:'#2A2A35'},
  gossip:{name:'خانم غیبت‌چی',skin:'#F1C8A8',hairCol:'#A0522D',hair:'bun',shirt:'#A274E0',shirt2:'#8456C6',pants:'#4B3A6B',lashes:true,glasses:'cat',earrings:true,lips:true},
  intern:{name:'بهراد کارآموز',skin:'#F4D1B3',hairCol:'#2E2A28',hair:'short',shirt:'#4CC38A',shirt2:'#36A06E',glasses:'round',tie:'#F2C94C'},
  accountant:{name:'آقای حسابدار',skin:'#E4B591',hairCol:'#6F747B',hair:'bald',shirt:'#8FA0B2',shirt2:'#73859A',tie:'#E0483E',mustache:'thick'},
  lenz:{name:'بازرس لنز',skin:'#EAC4A3',hairCol:'#3B3F46',hair:'slick',shirt:'#33415A',shirt2:'#232E42',monocle:true,tie:'#5EC8F7',big:1.08},
  builder:{name:'کارگر ساختمون',skin:'#DCA680',hairCol:'#3A2A20',hair:'helmet',helmet:'#FFC531',shirt:'#FF8A3D',shirt2:'#E5702A',vest:true,pants:'#3C4A63'},
  foreman:{name:'اوستا بتن',skin:'#CC9068',hairCol:'#2B211B',hair:'helmet',helmet:'#FFFFFF',shirt:'#5B6E82',shirt2:'#46586B',mustache:'thick',vest:true,big:1.15},
  guard:{name:'نگهبان شب',skin:'#E2B18D',hairCol:'#222',hair:'cap',cap:'#2D3A66',shirt:'#33427A',shirt2:'#25315C',badge:true,pants:'#1E2547'},
  zarrin:{name:'آقای زرین‌سبیل',skin:'#F1C4A0',hairCol:'#3A2A1E',hair:'slick',shirt:'#252E3F',shirt2:'#151B27',tie:'#FFC531',mustache:'gold',big:1.15,pants:'#151B27'},
  nokhod:{name:'نخود',skin:'#F6D2B6',hairCol:'#D9772B',hair:'kiana',hstyle:'buns',tie2:'#5EC8F7',shirt:'#FFFFFF',shirt2:'#E6EBF0',overall:'#3D7DD8',pants:'#3D7DD8',goggles:true,kid:true,lashes:true,eyeCol:'#3A2A1E'},
  golab:{name:'خاله گلاب',skin:'#EBC09D',hairCol:'#6B4A3A',hair:'scarf',scarf:'#FF8FB5',lips:true,earrings:true,shirt:'#7FD1F0',shirt2:'#5FB7E0',apron:'#FFFFFF',pants:'#3B5B7A',lashes:true},
  katy:{name:'عمه کتی',skin:'#F0C8AA',hairCol:'#BDB8C6',hair:'scarf',scarf:'#36A985',shirt:'#C9524F',shirt2:'#A63E3C',glasses:'round',lashes:true,big:1.05,pants:'#5B2B33'},
  arsi:{name:'نور',skin:'#EBC3A0',hairCol:'#3A2C3E',hair:'spiky',hstyle:'quiff',shirt:'#FFD23F',shirt2:'#F2B705',jacket:'#34343F',jstyle:'open',leather:true,noCollar:true,
    shades:'head',watch:'#F5B700',pants:'#35507E',boot:'#F4F6F8',cocky:true,eyeCol:'#2A1E18'},
  saadi:{name:'سعدی',skin:'#E8B892',hairCol:'#B9B4AE',hair:'cap',cap:'#2D3A66',capBadge:'moon',capHair:true,shirt:'#3A4C86',shirt2:'#2C3B6E',jacket:'#C98B3A',jstyle:'cardigan',
    scarf2:'#D9483B',belly:true,mustache:'thick',droopy:true,pants:'#26305A',boot:'#4A3020',big:1.06,eyeCol:'#4A3426'},
  anis:{name:'انیس',skin:'#F6D5BE',hairCol:'#3A2620',hair:'scarf',scarf:'#9B7BE8',glasses:'big',glassCol:'#3A2A55',tvest:'#2B5D8A',shirt:'#FFFFFF',shirt2:'#E3E8EE',
    rosy:true,lashes:true,pants:'#2B3A55',eyeCol:'#4A2E22'},
  javid:{name:'آقا جاوید',skin:'#E9BC96',hairCol:'#3A2A26',hair:'slick',shirt:'#FFFFFF',shirt2:'#E3E8EE',jacket:'#1E9BFF',jstyle:'suit',shiny:true,tie:'#FF3D7F',tiePat:'dots',
    pocket:'#FFE14D',mustache:'thin',grin:true,pants:'#1A7FD4',boot:'#5A2E1A',big:1.1,eyeCol:'#2A1E18'}
};

/* ---------------- Costumes ----------------
   COSTUME[key](o,T) → features merged over the person (T = the chosen outfit colour: Kiana's `shirt`, Hiroman's `apron`). */
const COSTUME={
  hoodie:(o,T)=>Object.assign({hoodie:true},o.tint?{shirt:T,shirt2:shade(T,-.15),pants:'#3B4A6B'}:{}),
  cathood:(o,T)=>({shirt:T,shirt2:shade(T,-.15),hoodie:true,hood:'cat',hoodCol:T,tail:T,pants:'#3B4A6B',boot:'#F4F6F8',deco:'paw'}),
  panda:()=>({shirt:'#FAFAFA',shirt2:'#E2E5EA',sleeve:'#2B2D42',pants:'#2B2D42',boot:'#2B2D42',hood:'panda',hoodCol:'#FAFAFA',tail:'#2B2D42',tailShort:1,noCollar:1,deco:'panda'}),
  skater:(o,T)=>({shirt:T,shirt2:shade(T,-.12),pants:'#5B6E82',shorts:1,kneepads:'#2B2D42',boot:'#F4F6F8',noCollar:1,deco:'skate',hat:'capback',hatCol:shade(T,-.4)}),
  chef:()=>({shirt:'#FFFFFF',shirt2:'#E3E8EE',pants:'#4A5160',check:1,hat:'chef',scarf2:'#E5484D',scarfSmall:1,noCollar:1,deco:'chef'}),
  detective:()=>({shirt:'#F4F6F8',shirt2:'#DDE3E9',jacket:'#C9A66B',jstyle:'coat',coat:'#C9A66B',belt:'#8A6A3B',pants:'#3A3A48',boot:'#4A3426',hat:'fedora',hatCol:'#6E5038',tie:'#7A2E2E'}),
  pirate:()=>({shirt:'#FFFFFF',shirt2:'#E9EDF2',stripes:'#E5484D',jacket:'#2B2D42',jstyle:'vest',sleeve:'#FFFFFF',belt:'#E5484D',sash:1,pants:'#4A3A32',boot:'#3A2418',bootH:1,hat:'pirate',noCollar:1}),
  ninja:()=>({shirt:'#2F3247',shirt2:'#1F2133',pants:'#2F3247',boot:'#1A1B26',belt:'#E5484D',hood:'ninja',hoodCol:'#2F3247',band:'#E5484D',noCollar:1,deco:'ninja'}),
  rock:(o,T)=>({shirt:T,shirt2:shade(T,-.12),jacket:'#26262E',jstyle:'open',leather:1,studs:1,pants:'#1E1E28',ripped:1,boot:'#1E1E28',bootH:1,guitar:1,noCollar:1,deco:'bolt'}),
  disco:(o,T)=>({shirt:T,shirt2:shade(T,-.25),sparkle:1,sequins:1,pants:'#FFFFFF',flare:1,boot:'#F5B700',noCollar:1,deco:'disco'}),
  astro:()=>({shirt:'#F4F6F8',shirt2:'#D5DCE3',pants:'#F4F6F8',glove:'#9AA5B1',boot:'#9AA5B1',bootH:1,hood:'astro',pack:1,noCollar:1,deco:'astro'}),
  witch:()=>({shirt:'#6B4FC8',shirt2:'#55399F',gown:'#6B4FC8',gownTrim:'#FFC531',stars:1,belt:'#FFC531',hat:'wizard',hatCol:'#6B4FC8',noCollar:1,deco:'robe'}),
  wizard:()=>({shirt:'#2D4F9E',shirt2:'#1F3B7A',gown:'#2D4F9E',gownTrim:'#FFC531',stars:1,belt:'#FFC531',hat:'wizard',hatCol:'#2D4F9E',noCollar:1,deco:'robe'}),
  hero:(o,T)=>{const k=o.hair==='kiana',cp=k?'#FFC531':'#F6EEDC';return{shirt:T,shirt2:shade(T,-.18),pants:shade(T,-.3),belt:'#FFC531',boot:cp,bootH:1,glove:cp,
    cape:cp,capeIn:k?'#FF8A3D':'#E2D3B4',capeEdge:k?'plain':'filter',emblem:k?'k':'cup',mask:shade(T,-.45),noCollar:1};},
  queen:()=>({shirt:'#7B4FB0',shirt2:'#5E3794',gown:'#7B4FB0',gownTrim:'#FFC531',cape:'#C2185B',capeIn:'#8E0F45',capeEdge:'ermine',noCollar:1,deco:'queen'}),
  samurai:()=>({shirt:'#2C3E7A',shirt2:'#1F2D5C',pants:'#3A3F4B',flare:1,boot:'#5A3A2A',belt:'#C9A227',band:'#FFFFFF',bandDot:'#E5484D',noCollar:1,deco:'samurai',over:'pauldron'}),
  viking:()=>({shirt:'#5B7FA0',shirt2:'#4A6A88',jacket:'#8B5E3C',jstyle:'fur',pants:'#6B4A32',wraps:1,boot:'#4A3020',belt:'#5A3A22',buckle:1,hat:'viking',noCollar:1}),
  suit:()=>({shirt:'#FFFFFF',shirt2:'#E3E8EE',jacket:'#23272F',jstyle:'suit',pants:'#23272F',boot:'#111111',bowtie:'#23272F',pocket:'#E5484D'}),
  bat:()=>({shirt:'#4A5162',shirt2:'#3A4050',pants:'#343A48',boot:'#1E1E28',bootH:1,glove:'#1E1E28',belt:'#FFC531',deco:'utility',emblem:'bat',
    cape:'#262A35',capeIn:'#4A5162',capeEdge:'scallop',hood:'bat',hoodCol:'#343A48',mask:'#343A48',noCollar:1}),
  bolt:()=>({shirt:'#D7263D',shirt2:'#B01E33',pants:'#C42236',boot:'#FFC531',bootH:1,belt:'#FFC531',deco:'zap',goggles:true,scarf2:'#FFC531',scarfSmallRoll:1,scarfFly:'#FFC531',noCollar:1}),
  star:()=>({shirt:'#2C3566',shirt2:'#1F2650',pants:'#2C3566',boot:'#C9D3DB',bootH:1,glove:'#C9D3DB',belt:'#C9A227',deco:'plate',over:'pauldron',pauldron:'#C9D3DB',
    cape:'#4B2D8A',capeIn:'#2B1B5A',capeStars:1,hat:'knight',noCollar:1}),
  web:()=>({shirt:'#7B4FB0',shirt2:'#61399A',pants:'#2BB59A',boot:'#1F8F79',bootH:1,glove:'#2BB59A',mask:'#4B2D8A',deco:'web',belt:'#2BB59A',noCollar:1}),
  gold:()=>({shirt:'#FFFFFF',shirt2:'#E9E3D0',apron:'#F5B700',goldApron:1,bowtie:'#F5B700',sparkle:1,pants:'#2E3440'})
};
/* accessory value → features */
const ACC={
  glasses:o=>o.glasses?{}:{glasses:'round'},
  sun:o=>({shades:o.hair==='kiana'?'heart':'eyes'}),
  phones:o=>({phones:o.hair==='kiana'?'#FF5A8C':'#2B2D42'}),
  beret:()=>({hat:'beret',hatCol:'#D7263D'}),
  catears:()=>({catears:1}),
  flower:()=>({flower:1}),
  crown2:o=>o.crown?{realCrown:1}:{hat:'crown2'},
  wizhat:()=>({hat:'wizard',hatCol:'#6B4FC8'}),
  pirhat:()=>({hat:'pirate'}),
  helmet:()=>({hat:'helmet',hatCol:'#5EC8F7'}),
  capback:o=>({hat:'capback',hatCol:o.hair==='kiana'?'#FF5A8C':'#E5484D'}),
  bandana:()=>({band:'#E5484D'}),
  bowtie:()=>({bowtie:'#E5484D'})
};

/* ---------------- Wardrobe (customizable looks) ----------------
   each option: [value, label, starsNeeded, priceCoins]  (price 0/omitted = free once the stars are reached)
   two-tone hair colours are CSS gradients (they work as the swatch background, drawPerson reads the two hex colours) */
const TT=(a,b)=>'linear-gradient(135deg,'+a+' 50%,'+b+' 50%)';
const LOOKS={
  kiana:{
    hstyle:{label:'مدل مو',opts:[['long','دم‌اسبی',0],['bob','کوتاه',4],['buns','گوجه‌ای',10],['twin','خرگوشی',6,15],['loose','موی باز',12,20],['braid','بافت بلند',20,25],['top','گوجه‌ی بالای سر',30,30]]},
    hairCol:{label:'رنگ مو',swatch:true,opts:[['#4A2A21','قهوه‌ای',0],['#1E1E28','مشکی',0],['#B5562E','حنایی',6],['#7B4FB0','بنفش',16],['#E05A8C','صورتی',24],
      ['#E8C46A','طلایی',8,10],['#F7A8C8','صورتی پاستلی',18,20],['#8EE3C8','نعنایی',22,25],['#C3A6F0','یاسی پاستلی',26,25],['#D8DDE6','نقره‌ای',28,25],
      ['#3FC8FF','آبی نئونی',34,35],['#B6F03B','سبز نئونی',42,40],
      [TT('#4A2A21','#FF5A8C'),'قهوه‌ای و صورتی',14,30],[TT('#1E1E28','#3FC8FF'),'مشکی و آبی نئونی',38,40],[TT('#E8C46A','#C3A6F0'),'طلایی و یاسی',50,45],[TT('#7B4FB0','#7FE0D0'),'کهکشانی',60,50]]},
    outfit:{label:'لباس و کاستوم',opts:[['shirt','پیرهن',0],['hoodie','هودی',8],['dress','پیرهن دامن‌دار',14],
      ['cathood','هودی گربه‌ای',5,15],['panda','لباس سرهمی پاندا',10,20],['skater','اسکیت‌سوار',15,20],['chef','آشپز',20,25],['detective','کارآگاه بارونی‌پوش',26,30],
      ['pirate','دزد دریایی',32,35],['ninja','نینجا',38,35],['rock','راک‌استار',44,40],['disco','دیسکو',50,40],['astro','فضانورد',58,45],
      ['witch','جادوگر مهربون',66,50],['hero','ابرقهرمان با شنل',75,55],['queen','ملکه با شنل سلطنتی',90,60],
      ['bolt','قهرمان صاعقه',12,30],['web','قهرمان تار',24,40],['star','جنگجوی ستاره‌ای',40,50],['bat','دختر خفاشی',55,60]]},
    shirt:{label:'رنگ لباس',swatch:true,opts:[['#FF5A8C','صورتی',0],['#5EC8F7','آبی',2],['#FFC531','زرد',5],['#62C784','سبز',12],['#9B7BE8','یاسی',20],
      ['#FF7A3D','نارنجی',7,10],['#2BB59A','فیروزه‌ای',10,10],['#E5484D','قرمز',16,15],['#1E1E28','مشکی',24,15],['#F4F6F8','سفید',30,15]]},
    acc:{label:'زینت و کلاه',opts:[['none','هیچی',0],['bow','پاپیون',3],['glasses','عینک',9],['star','گیره‌ی ستاره',18],
      ['flower','گل سر',4,10],['catears','گوش گربه‌ای',8,15],['sun','عینک آفتابی قلبی',12,15],['phones','هدفون',16,20],['beret','کلاه بره',22,20],
      ['capback','کپ برعکس',28,25],['helmet','کلاه اسکیت',34,25],['pirhat','کلاه دزد دریایی',40,30],['wizhat','کلاه جادوگری',48,35],['crown2','تاج طلای واقعی',80,60]]}},
  hiroman:{
    hstyle:{label:'مدل مو',opts:[['swoop','کج',0],['neat','مرتب',5],['curly','فرفری',12],['buzz','کوتاه',3,10],['quiff','کاکل ژله‌ای',8,15],['topknot','گوجه‌ی سامورایی',18,20],['mohawk','تاج خروسی',30,30]]},
    hairCol:{label:'رنگ مو',swatch:true,opts:[['#2A2230','مشکی',0],['#6B4430','قهوه‌ای',4],['#D9A441','بلوند',15],
      ['#C9524F','قرمز',10,15],['#D8DDE6','نقره‌ای',20,20],['#8EE3C8','نعنایی',26,25],['#3FC8FF','آبی نئونی',34,35],['#9B7BE8','بنفش',40,30],
      [TT('#2A2230','#F5D76E'),'نوک طلایی',14,30],[TT('#2A2230','#3FC8FF'),'مشکی و آبی نئونی',44,40],[TT('#6B4430','#FF8A3D'),'قهوه‌ای و نارنجی',54,45]]},
    outfit:{label:'لباس و کاستوم',opts:[['barista','باریستا',0],['hoodie','هودی',4,10],['chef','آشپز',10,20],['pirate','دزد دریایی',18,30],['suit','کت‌وشلوار رسمی',24,30],
      ['ninja','نینجا',32,35],['rock','راک‌استار',40,40],['viking','وایکینگ',48,40],['samurai','سامورایی',56,45],['astro','فضانورد',62,45],
      ['wizard','جادوگر',70,50],['gold','باریستای طلایی',80,55],['hero','ابرقهرمان با شنل فیلتر قهوه',95,60],
      ['bolt','قهرمان صاعقه',14,30],['web','قهرمان تار',26,40],['star','جنگجوی ستاره‌ای',42,50],['bat','شوالیه‌ی خفاشی',58,60]]},
    apron:{label:'رنگ پیش‌بند و لباس',swatch:true,opts:[['#7A4A2E','قهوه‌ای',0],['#2E3440','زغالی',3],['#2BB59A','سبز',10],['#C9524F','قرمز',22],
      ['#33427A','سرمه‌ای',6,10],['#7B4FB0','بنفش',14,15],['#FF7A3D','نارنجی',20,15],['#FF8FB5','صورتی',28,15],['#1E1E28','مشکی',36,20]]},
    acc:{label:'زینت و کلاه',opts:[['none','هیچی',0],['glasses','عینک',7],['bowtie','پاپیون',4,10],['sun','عینک آفتابی',10,15],['helmet','کلاه ایمنی',12,15],
      ['phones','هدفون',14,20],['bandana','سربند',20,20],['beret','کلاه بره',24,20],['capback','کپ برعکس',30,25],['pirhat','کلاه دزد دریایی',38,30],
      ['wizhat','کلاه جادوگری',46,35],['crown2','تاج پادشاهی',85,60]]}}
};
let LOOK_CHOICE={kiana:{},hiroman:{}};
function lookOf(who){const b=PEOPLE[who];if(!b)return b;const ch=LOOK_CHOICE&&LOOK_CHOICE[who];const o=Object.assign({},b,ch||{});
  if(ch&&ch.shirt&&ch.shirt[0]==='#')o.shirt2=shade(ch.shirt,-.15);if(who==='hiroman')o.tint=o.apron||'#7A4A2E';return o;}
/* option lookup for the wardrobe UI → {label,stars,price} or null */
function lookOpt(who,cat,val){const C=LOOKS[who]&&LOOKS[who][cat];if(!C)return null;const op=C.opts.find(q=>q[0]===val);return op?{label:op[1],stars:op[2]||0,price:op[3]||0}:null;}

/* ---------------- Limbs & held items ---------------- */
function limb(c,x1,y1,x2,y2,w,col){c.lineCap='round';c.strokeStyle=INK;c.lineWidth=w+Math.max(2,w*.45);c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.strokeStyle=col;c.lineWidth=w;c.stroke();}
function limb3(c,x1,y1,xm,ym,x2,y2,w,col){c.lineCap='round';c.lineJoin='round';c.strokeStyle=INK;c.lineWidth=w+Math.max(2,w*.45);c.beginPath();c.moveTo(x1,y1);c.lineTo(xm,ym);c.lineTo(x2,y2);c.stroke();c.strokeStyle=col;c.lineWidth=w;c.stroke();}
function handAt(c,x,y,r,skin){c.fillStyle=skin;circ(c,x,y,r);c.fill();c.lineWidth=Math.max(1,r*.45);c.strokeStyle=INK;c.stroke();}

function drawHeld(c,kind,x,y,s,t){
  c.save();c.translate(x,y);c.lineWidth=Math.max(1,s*.025);c.strokeStyle=INK;
  if(kind==='cup'||kind==='coffee'){
    c.fillStyle='#fff';c.beginPath();c.moveTo(-s*.08,-s*.08);c.lineTo(s*.08,-s*.08);c.lineTo(s*.065,s*.08);c.lineTo(-s*.065,s*.08);c.closePath();c.fill();c.stroke();
    c.fillStyle='#FF5A8C';c.fillRect(-s*.075,-s*.02,s*.15,s*.05);c.strokeRect(-s*.075,-s*.02,s*.15,s*.05);
    c.fillStyle='#6B3E26';ell(c,0,-s*.08,s*.08,s*.02);c.fill();c.stroke();
    c.strokeStyle='rgba(255,255,255,.85)';c.lineWidth=s*.02;for(let i=-1;i<=1;i+=2){c.beginPath();c.moveTo(i*s*.03,-s*.12);c.quadraticCurveTo(i*s*.03+Math.sin(t*4+i)*s*.03,-s*.18,i*s*.03,-s*.24);c.stroke();}
  }else if(kind==='teacup'){
    c.fillStyle='rgba(255,255,255,.7)';c.beginPath();c.moveTo(-s*.05,-s*.07);c.lineTo(s*.05,-s*.07);c.quadraticCurveTo(s*.03,0,s*.045,s*.06);c.lineTo(-s*.045,s*.06);c.quadraticCurveTo(-s*.03,0,-s*.05,-s*.07);c.closePath();c.fill();c.stroke();
    c.fillStyle='#B4321F';c.fillRect(-s*.04,-s*.03,s*.08,s*.08);ell(c,0,s*.08,s*.08,s*.02);c.fillStyle='#D9C9A3';c.fill();c.stroke();
  }else if(kind==='letter'||kind==='note'){
    c.rotate(-.15);c.fillStyle=kind==='note'?'#FFF6DA':'#fff';rr(c,-s*.1,-s*.07,s*.2,s*.14,s*.01);c.fill();c.stroke();
    c.beginPath();if(kind==='letter'){c.moveTo(-s*.1,-s*.07);c.lineTo(0,s*.01);c.lineTo(s*.1,-s*.07);}else{for(let i=0;i<3;i++){c.moveTo(-s*.07,-s*.03+i*s*.035);c.lineTo(s*.07,-s*.03+i*s*.035);}}c.stroke();
    if(kind==='letter'){c.fillStyle='#E5484D';circ(c,0,s*.01,s*.025);c.fill();}
  }else if(kind==='card'||kind==='key'){
    c.rotate(.2);c.fillStyle='#FFC531';rr(c,-s*.09,-s*.055,s*.18,s*.11,s*.02);c.fill();c.stroke();c.fillStyle='#fff';c.fillRect(-s*.06,-s*.02,s*.06,s*.03);
  }else if(kind==='phone'){
    c.fillStyle='#2D3748';rr(c,-s*.045,-s*.08,s*.09,s*.16,s*.02);c.fill();c.stroke();c.fillStyle='#7FD1F0';c.fillRect(-s*.033,-s*.06,s*.066,s*.11);
  }else if(kind==='tray'){
    c.fillStyle='#C0C7CF';ell(c,0,0,s*.2,s*.05);c.fill();c.stroke();for(let i=-1;i<=1;i++){c.save();c.translate(i*s*.1,-s*.05);drawHeld(c,'teacup',0,0,s*.7,t);c.restore();}
  }else if(kind==='doc'){
    c.fillStyle='#F5B841';rr(c,-s*.1,-s*.07,s*.2,s*.14,s*.015);c.fill();c.stroke();c.fillStyle='#E5484D';circ(c,s*.04,s*.01,s*.022);c.fill();
  }else if(kind==='mop'){
    c.strokeStyle='#B07A3B';c.lineWidth=s*.025;c.beginPath();c.moveTo(0,-s*.25);c.lineTo(0,s*.3);c.stroke();c.lineWidth=Math.max(1,s*.02);c.strokeStyle=INK;
    c.fillStyle='#EDEFF2';for(let i=-3;i<=3;i++){rr(c,i*s*.022-s*.012,s*.28,s*.024,s*.1,s*.01);c.fill();c.stroke();}
  }else if(kind==='wrench'){
    c.rotate(-.6);c.fillStyle='#B9C2C9';rr(c,-s*.015,-s*.1,s*.03,s*.16,s*.01);c.fill();c.stroke();circ(c,0,-s*.11,s*.04);c.fill();c.stroke();c.fillStyle=INK;rr(c,-s*.012,-s*.16,s*.024,s*.05,0);c.fill();
  }else if(kind==='flashlight'){
    c.fillStyle='#444';rr(c,-s*.03,-s*.02,s*.12,s*.05,s*.01);c.fill();c.stroke();
  }
  c.restore();
}

/* ---------------- Hair ----------------
   Hair is drawn as a UNION of shapes: one ink pass (fat stroke) then one colour pass,
   so only the outer silhouette gets an outline — no stray inner lines. */
/* hair is outlined with a dark shade of its own colour (never the bluish INK) */
function hex6(h){if(typeof h!=='string'||h[0]!=='#')return'#4A2A21';return h.length===4?'#'+h[1]+h[1]+h[2]+h[2]+h[3]+h[3]:h;}
function hairInk(o){return shade(hex6(o.hairCol),-.45);}
function hairUnion(c,lw,col,shapes,ink){const hair=!!ink;ink=ink||INK;
  c.save();c.lineJoin='round';c.lineCap='round';c.strokeStyle=ink;c.fillStyle=ink;c.lineWidth=lw*(hair?1.6:2);
  for(const p of shapes){p(c);c.fill();c.stroke();}
  c.fillStyle=col;for(const p of shapes){p(c);c.fill();}
  c.restore();
}
/* hair colour (or a two-tone gradient: ombre down for long hair, frosted tips up for short hair) */
function hairPaint(c,o,hr,hy,up){
  if(!o.hairTip)return o.hairCol;
  const g=up?c.createLinearGradient(0,hy-hr*1.6,0,hy-hr*.3):c.createLinearGradient(0,hy-hr*.3,0,hy+hr*1.6);
  if(up){g.addColorStop(0,o.hairTip);g.addColorStop(.42,o.hairTip);g.addColorStop(.72,o.hairCol);g.addColorStop(1,o.hairCol);}
  else{g.addColorStop(0,o.hairCol);g.addColorStop(.3,o.hairCol);g.addColorStop(.7,o.hairTip);g.addColorStop(1,o.hairTip);}
  return g;
}
function tuft(c,bx,by,a,len,w,bend){ // tapered curl from base (bx,by) pointing at angle a
  const nx=Math.cos(a+P/2)*w,ny=Math.sin(a+P/2)*w,tx=bx+Math.cos(a)*len+Math.cos(a+P/2)*bend,ty=by+Math.sin(a)*len+Math.sin(a+P/2)*bend;
  const mx=bx+Math.cos(a)*len*.55,my=by+Math.sin(a)*len*.55;
  c.beginPath();c.moveTo(bx+nx,by+ny);c.quadraticCurveTo(mx+nx*.8+Math.cos(a+P/2)*bend*.5,my+ny*.8+Math.sin(a+P/2)*bend*.5,tx,ty);c.quadraticCurveTo(mx-nx*.6,my-ny*.6,bx-nx,by-ny);c.closePath();
}
function hairShine(c,clipPath,hr,hy){c.save();clipPath(c);c.clip();c.strokeStyle='rgba(255,255,255,.28)';c.lineWidth=hr*.11;c.beginPath();c.arc(-hr*.08,hy-hr*.2,hr*.68,P*1.2,P*1.45);c.stroke();
  c.lineWidth=hr*.07;c.beginPath();c.arc(-hr*.08,hy-hr*.2,hr*.68,P*1.52,P*1.6);c.stroke();c.restore();}
function girlBack(c,o,hr,hy,t,lw,back){
  const m=o.mess||0,H=hairPaint(c,o,hr,hy),st=o.hstyle||'long',S=[];
  S.push(c=>ell(c,0,hy-hr*.04,hr*1.09,hr*1.07));
  if(st==='long')S.push(c=>{c.beginPath();c.moveTo(-hr*1.07,hy-hr*.1);c.quadraticCurveTo(-hr*1.24,hy+hr*.95,-hr*.82,hy+hr*1.22);c.quadraticCurveTo(0,hy+hr*1.36,hr*.82,hy+hr*1.22);c.quadraticCurveTo(hr*1.24,hy+hr*.95,hr*1.07,hy-hr*.1);c.closePath();});
  if(st==='bob')S.push(c=>{c.beginPath();c.moveTo(-hr*1.12,hy-hr*.15);c.quadraticCurveTo(-hr*1.25,hy+hr*.66,-hr*1.0,hy+hr*.82);c.quadraticCurveTo(0,hy+hr*.9,hr*1.0,hy+hr*.82);c.quadraticCurveTo(hr*1.25,hy+hr*.66,hr*1.12,hy-hr*.15);c.closePath();});
  if(st==='loose'){const w=Math.sin(t*2)*hr*.03;S.push(c=>{c.beginPath();c.moveTo(-hr*1.08,hy-hr*.2);c.bezierCurveTo(-hr*1.42,hy+hr*.8,-hr*1.3+w,hy+hr*1.45,-hr*.98+w,hy+hr*1.74);
    if(back)c.quadraticCurveTo(0,hy+hr*1.95,hr*.98+w,hy+hr*1.74);else{c.quadraticCurveTo(-hr*.74,hy+hr*1.5,-hr*.62,hy+hr*.9);c.lineTo(hr*.62,hy+hr*.9);c.quadraticCurveTo(hr*.74,hy+hr*1.5,hr*.98+w,hy+hr*1.74);}
    c.bezierCurveTo(hr*1.3+w,hy+hr*1.45,hr*1.42,hy+hr*.8,hr*1.08,hy-hr*.2);c.closePath();});}
  if(m<.55){
    if(st==='long'){const sw=Math.sin(t*2.2)*.12;S.push(c=>{c.save();c.translate(hr*.74,hy-hr*.6);c.rotate(.75+sw);c.beginPath();c.moveTo(-hr*.05,0);c.bezierCurveTo(hr*.85,hr*.05,hr*.78,hr*.92,hr*.46,hr*1.18);c.bezierCurveTo(hr*.44,hr*.62,hr*.2,hr*.36,-hr*.12,hr*.3);c.closePath();c.restore();});}
    if(st==='buns'){S.push(c=>circ(c,-hr*.74,hy-hr*.8,hr*.4));S.push(c=>circ(c,hr*.74,hy-hr*.8,hr*.4));}
    if(st==='twin')for(const sd of[-1,1]){const sw=Math.sin(t*2.2+sd)*.08;S.push(c=>{c.save();c.translate(sd*hr*.92,hy-hr*.2);c.rotate(-sd*(.2+sw));c.beginPath();c.moveTo(-hr*.18,0);
      c.bezierCurveTo(-hr*.46,hr*.6,-hr*.3,hr*1.2,sd*hr*.08,hr*1.45);c.bezierCurveTo(hr*.3,hr*1.15,hr*.44,hr*.6,hr*.18,0);c.closePath();c.restore();});}
    if(st==='braid'){const sw=Math.sin(t*2)*hr*.05;for(let i=0;i<6;i++){const bx=hr*(.8+i*.025)+sw*i*.25,by=hy+hr*(.22+i*.23),r=hr*(.2-i*.014);S.push(c=>ell(c,bx,by,r,r*1.12));}
      S.push(c=>tuft(c,hr*.94+sw*1.5,hy+hr*1.48,P/2,hr*.32,hr*.11,0));}
    if(st==='top')S.push(c=>circ(c,-hr*.1,hy-hr*1.12,hr*.42));
  }
  // bed-head: bubbly lumps + tapered tufts that grow with "mess"
  if(m>.04){const n=8;for(let i=0;i<n;i++){const a=P*1.02+i/(n-1)*P*.96,j=hsh(i*3.7+2),rr2=hr*(.2+.3*m*(.55+.45*j)),d=hr*(.86+.12*m)+Math.sin(t*2.4+i)*hr*.02*m;
      S.push(c=>circ(c,Math.cos(a)*d,hy-hr*.04+Math.sin(a)*d,rr2));}}
  if(m>.3){const k=Math.round(2+m*5);for(let i=0;i<k;i++){const a=P*1.05+hsh(i+11)*P*.9,d=hr*(1.08+m*.22),len=hr*(.22+.38*m*(.5+.5*hsh(i+4))),bend=(hsh(i+7)-.5)*hr*.35+Math.sin(t*3+i)*hr*.04;
      S.push(c=>tuft(c,Math.cos(a)*d*.92,hy-hr*.04+Math.sin(a)*d*.92,a,len,hr*.1,bend));}}
  // ahoge (antenna lock)
  if(o.crown||o.ahoge){const ah=hr*(.32+m*.5),sw=Math.sin(t*3)*hr*.06;S.push(c=>tuft(c,-hr*.02,hy-hr*.98,-P/2+.35+m*.5,ah,hr*.09,hr*.22+sw));}
  hairUnion(c,lw,H,S,hairInk(o));
  const tie=o.tie2||'#FF5A8C';c.lineWidth=lw;c.strokeStyle=INK;
  if(m<.55&&st==='long'){c.save();c.translate(hr*.74,hy-hr*.6);c.rotate(.75);c.fillStyle=tie;ell(c,0,hr*.1,hr*.14,hr*.12);c.fill();c.stroke();c.restore();}
  if(m<.55&&st==='buns'){c.fillStyle=tie;for(const sd of[-1,1]){rr(c,sd*hr*.74-hr*.17,hy-hr*.5,hr*.34,hr*.12,hr*.05);c.fill();c.stroke();}}
  if(m<.55&&st==='twin'){c.fillStyle=tie;for(const sd of[-1,1]){c.save();c.translate(sd*hr*.92,hy-hr*.2);c.rotate(-sd*.2);ell(c,0,hr*.16,hr*.16,hr*.1);c.fill();c.stroke();c.restore();}}
  if(m<.55&&st==='braid'){const sw=Math.sin(t*2)*hr*.05;c.strokeStyle='rgba(0,0,0,.2)';c.lineWidth=lw*.8;
    for(let i=0;i<6;i++){const bx=hr*(.8+i*.025)+sw*i*.25,by=hy+hr*(.22+i*.23),r=hr*(.2-i*.014);c.beginPath();c.moveTo(bx-r*.6,by-r*.35);c.quadraticCurveTo(bx,by+r*.25,bx+r*.6,by-r*.35);c.stroke();}
    c.strokeStyle=INK;c.lineWidth=lw;c.fillStyle=tie;circ(c,hr*.93+sw*1.4,hy+hr*1.47,hr*.09);c.fill();c.stroke();}
  if(m<.55&&st==='top'){c.fillStyle=tie;rr(c,-hr*.36,hy-hr*.82,hr*.52,hr*.13,hr*.06);c.fill();c.stroke();}
}
function girlFront(c,o,hr,hy,t,lw){
  const m=o.mess||0,H=hairPaint(c,o,hr,hy),fr=hy-hr*.28,jag=m*hr*.18;
  const edge=(c,cont)=>{if(!cont)c.moveTo(hr*1.05,hy+hr*.4);
    c.quadraticCurveTo(hr*.88,hy-hr*.08,hr*.64,fr+hr*.04);c.quadraticCurveTo(hr*.47,fr+hr*.26+jag,hr*.3,fr-hr*.02);
    c.quadraticCurveTo(hr*.12,fr+hr*.3+jag*.6,-hr*.08,fr-hr*.05);c.quadraticCurveTo(-hr*.3,fr+hr*.28+jag,-hr*.52,fr);c.quadraticCurveTo(-hr*.88,hy-hr*.04,-hr*1.05,hy+hr*.4);};
  const shape=c=>{c.beginPath();c.moveTo(-hr*1.05,hy+hr*.4);c.bezierCurveTo(-hr*1.16,hy-hr*1.28,hr*1.16,hy-hr*1.28,hr*1.05,hy+hr*.4);edge(c,true);c.closePath();};
  c.fillStyle=H;shape(c);c.fill();
  hairShine(c,shape,hr,hy);
  c.strokeStyle=hairInk(o);c.lineWidth=lw*.8;c.lineJoin='round';c.beginPath();edge(c);c.stroke();
  if(m>.6){c.save();tuft(c,hr*.12,fr,P*.42,hr*.62,hr*.08,-hr*.12);c.fillStyle=H;c.fill();c.lineWidth=lw*.75;c.stroke();c.restore();}
  c.strokeStyle=INK;
  if(o.acc==='bow'){c.save();c.translate(-hr*.72,hy-hr*.72);c.rotate(-.4);c.fillStyle='#FF4F86';c.lineWidth=lw;c.strokeStyle=INK;
    for(const sd of[-1,1]){c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(sd*hr*.32,-hr*.28,sd*hr*.36,0);c.quadraticCurveTo(sd*hr*.32,hr*.28,0,0);c.fill();c.stroke();}circ(c,0,0,hr*.08);c.fill();c.stroke();c.restore();}
  if(o.acc==='star'){c.fillStyle='#FFC531';c.strokeStyle=INK;c.lineWidth=lw;starPath(c,-hr*.62,hy-hr*.58,hr*.17);c.fill();c.stroke();}
}
function boyBack(c,o,hr,hy,t,lw){
  const st=o.hstyle||'swoop',S=[c=>ell(c,0,hy-hr*.05,hr*1.07,hr*1.04)];
  if(st==='swoop')[-2.45,-2.05,-1.65,-1.25,-.85].forEach((a,i)=>{const len=hr*(.42+.12*hsh(i+3)),bend=hr*(.22-.08*i);S.push(c=>tuft(c,Math.cos(a)*hr*.88,hy+Math.sin(a)*hr*.88,a+.25,len,hr*.2,bend));});
  if(st==='curly'){for(let i=0;i<11;i++){const a=P*.9+i/10*P*1.2,d=hr*1.0;S.push(c=>circ(c,Math.cos(a)*d,hy-hr*.06+Math.sin(a)*d,hr*.3));}}
  if(st==='quiff'){S.push(c=>ell(c,hr*.02,hy-hr*.9,hr*.86,hr*.46,-.12));
    [-1.95,-1.6,-1.25].forEach((a,i)=>{const len=hr*(.5+.12*i),bx=hr*(-.3+i*.32),by=hy-hr*1.15-i*hr*.06;S.push(c=>tuft(c,bx,by,a+.5,len,hr*.18,-hr*.14));});}
  if(st==='mohawk'){for(let i=0;i<5;i++){const a=-P/2+(i-2)*.3,bx=Math.cos(a)*hr*.88,by=hy-hr*.05+Math.sin(a)*hr*.88;S.push(c=>tuft(c,bx,by,a,hr*(.58-.08*Math.abs(i-2)),hr*.16,0));}}
  if(st==='topknot')S.push(c=>circ(c,0,hy-hr*1.2,hr*.32));
  hairUnion(c,lw,hairPaint(c,o,hr,hy,true),S,hairInk(o));
  if(st==='topknot'){c.fillStyle='#E5484D';c.lineWidth=lw;c.strokeStyle=INK;rr(c,-hr*.2,hy-hr*.98,hr*.4,hr*.12,hr*.05);c.fill();c.stroke();}
}
function boyFront(c,o,hr,hy,t,lw){
  const st=o.hstyle||'swoop',H=hairPaint(c,o,hr,hy,true),fr=hy-hr*.3;
  if(st==='buzz'){capFront(c,H,hr,hy,lw,'short',hairInk(o));return;}
  if(st==='curly'){const S=[];for(let i=0;i<6;i++){const x=-hr*.75+i*hr*.3;S.push(c=>circ(c,x,fr-hr*.06+(i%2)*hr*.05,hr*.22));}
    S.push(c=>{c.beginPath();c.arc(0,hy-hr*.05,hr*1.05,P*1.08,P*1.92);c.lineTo(hr*.7,fr);c.lineTo(-hr*.7,fr);c.closePath();});hairUnion(c,lw,H,S,hairInk(o));return;}
  const kind=st==='topknot'?'neat':st;
  const edge=(c,cont)=>{if(!cont)c.moveTo(hr*1.03,hy+hr*.15);
    if(kind==='neat'){c.quadraticCurveTo(hr*.9,fr+hr*.05,hr*.4,fr-hr*.02);c.quadraticCurveTo(-hr*.2,fr+hr*.05,-hr*.55,fr+hr*.28);c.quadraticCurveTo(-hr*.85,fr+hr*.2,-hr*1.03,hy+hr*.15);}
    else if(kind==='quiff'){c.quadraticCurveTo(hr*.92,fr-hr*.02,hr*.55,fr-hr*.1);c.quadraticCurveTo(hr*.1,fr-hr*.02,-hr*.3,fr-hr*.2);c.quadraticCurveTo(-hr*.72,fr-hr*.08,-hr*.86,fr+hr*.14);c.quadraticCurveTo(-hr*.95,hy,-hr*1.03,hy+hr*.15);}
    else if(kind==='mohawk'){c.quadraticCurveTo(hr*.85,fr-hr*.16,0,fr-hr*.24);c.quadraticCurveTo(-hr*.85,fr-hr*.16,-hr*1.03,hy+hr*.15);}
    else{c.quadraticCurveTo(hr*.88,fr,hr*.62,fr+hr*.26);c.quadraticCurveTo(hr*.55,fr+hr*.02,hr*.36,fr-hr*.04);c.quadraticCurveTo(hr*.2,fr+hr*.18,-hr*.08,fr+hr*.36);
      c.quadraticCurveTo(-hr*.12,fr+hr*.06,-hr*.28,fr-hr*.02);c.quadraticCurveTo(-hr*.5,fr+hr*.14,-hr*.74,fr+hr*.3);c.quadraticCurveTo(-hr*.8,fr+hr*.08,-hr*1.03,hy+hr*.15);}};
  const shape=c=>{c.beginPath();c.moveTo(-hr*1.03,hy+hr*.15);c.bezierCurveTo(-hr*1.12,hy-hr*1.3,hr*1.12,hy-hr*1.3,hr*1.03,hy+hr*.15);edge(c,true);c.closePath();};
  c.fillStyle=H;shape(c);c.fill();hairShine(c,shape,hr,hy);
  c.strokeStyle=hairInk(o);c.lineWidth=lw*.8;c.lineJoin='round';c.beginPath();edge(c);c.stroke();c.strokeStyle=INK;
}
function capFront(c,H,hr,hy,lw,kind,ink){
  const fr=hy-hr*.32;
  const edge=(c,cont)=>{if(!cont)c.moveTo(hr*1.03,hy+hr*.15);
    if(kind==='slick'){c.quadraticCurveTo(hr*.7,fr-hr*.05,hr*.2,fr-hr*.12);c.quadraticCurveTo(-hr*.5,fr-hr*.05,-hr*.9,fr+hr*.15);c.lineTo(-hr*1.03,hy+hr*.15);}
    else if(kind==='bun'){c.quadraticCurveTo(hr*.85,fr+hr*.15,hr*.4,fr-hr*.05);c.quadraticCurveTo(-hr*.2,fr+hr*.35,-hr*.85,fr+hr*.2);c.lineTo(-hr*1.03,hy+hr*.15);}
    else{c.quadraticCurveTo(hr*.7,fr+hr*.15,hr*.3,fr);c.quadraticCurveTo(0,fr+hr*.18,-hr*.35,fr);c.quadraticCurveTo(-hr*.75,fr+hr*.15,-hr*1.03,hy+hr*.15);}};
  const shape=c=>{c.beginPath();c.moveTo(-hr*1.03,hy+hr*.15);c.bezierCurveTo(-hr*1.12,hy-hr*1.3,hr*1.12,hy-hr*1.3,hr*1.03,hy+hr*.15);edge(c,true);c.closePath();};
  c.fillStyle=H;shape(c);c.fill();hairShine(c,shape,hr,hy);
  c.strokeStyle=ink||INK;c.lineWidth=lw*.8;c.beginPath();edge(c);c.stroke();c.strokeStyle=INK;c.lineWidth=lw;
}
function drawCrown(c,x,y,r,rot,real){
  c.save();c.translate(x,y);c.rotate(rot);c.lineWidth=Math.max(1,r*.12);c.strokeStyle=INK;
  if(real){const g=c.createLinearGradient(0,-r*.9,0,r*.45);g.addColorStop(0,'#FFF3A8');g.addColorStop(.55,'#FFC531');g.addColorStop(1,'#D08A00');c.fillStyle=g;
    c.beginPath();c.moveTo(-r*1.05,r*.45);c.lineTo(-r*1.18,-r*.5);c.lineTo(-r*.55,-r*.06);c.lineTo(0,-r*.9);c.lineTo(r*.55,-r*.06);c.lineTo(r*1.18,-r*.5);c.lineTo(r*1.05,r*.45);c.closePath();c.fill();c.stroke();
    c.fillStyle='#D99100';rr(c,-r*1.08,r*.12,r*2.16,r*.34,r*.1);c.fill();c.stroke();
    c.fillStyle='#E5484D';circ(c,0,r*.29,r*.15);c.fill();c.stroke();c.fillStyle='#2BB59A';circ(c,-r*.62,r*.29,r*.11);c.fill();c.stroke();c.fillStyle='#5EC8F7';circ(c,r*.62,r*.29,r*.11);c.fill();c.stroke();
    c.fillStyle='#fff';for(const[px,py]of[[-r*1.18,-r*.5],[0,-r*.9],[r*1.18,-r*.5]]){circ(c,px,py,r*.14);c.fill();c.stroke();}
    starPath(c,-r*.35,-r*.25,r*.16,4,.3);c.fill();c.restore();return;}
  c.fillStyle='#FFC531';
  c.beginPath();c.moveTo(-r,r*.4);c.lineTo(-r,-r*.35);c.lineTo(-r*.5,r*.02);c.lineTo(0,-r*.62);c.lineTo(r*.5,r*.02);c.lineTo(r,-r*.35);c.lineTo(r,r*.4);c.closePath();c.fill();c.stroke();
  c.fillStyle='#FFE58A';c.fillRect(-r*.85,r*.12,r*1.7,r*.12);
  c.fillStyle='#FF4F86';circ(c,0,r*.15,r*.16);c.fill();c.stroke();c.fillStyle='#5EC8F7';circ(c,-r*.6,r*.18,r*.1);c.fill();circ(c,r*.6,r*.18,r*.1);c.fill();
  c.fillStyle='#FFC531';for(const[px,py]of[[-r,-r*.35],[0,-r*.62],[r,-r*.35]]){circ(c,px,py,r*.11);c.fill();c.stroke();}
  c.restore();
}
function drawBird(c,x,y,s,t,o){
  o=o||{};c.save();c.translate(x,y);if(o.flip)c.scale(-1,1);c.lineWidth=Math.max(1,s*.06);c.strokeStyle=INK;
  const flap=o.fly?Math.sin(t*28)*.8:0;
  c.fillStyle='#9C6B45';ell(c,0,0,s*.5,s*.42);c.fill();c.stroke();
  c.fillStyle='#F2DDBF';ell(c,s*.08,s*.12,s*.28,s*.22);c.fill();
  c.fillStyle='#7A5034';c.save();c.translate(-s*.12,-s*.02);c.rotate(-.3+flap);ell(c,-s*.1,0,s*.3,s*.16);c.fill();c.stroke();c.restore();
  c.fillStyle='#FFB23F';c.beginPath();c.moveTo(s*.45,-s*.08);c.lineTo(s*.7,0);c.lineTo(s*.45,s*.06);c.closePath();c.fill();c.stroke();
  c.fillStyle=INK;circ(c,s*.25,-s*.12,s*.07);c.fill();c.fillStyle='#fff';circ(c,s*.27,-s*.14,s*.025);c.fill();
  c.fillStyle='rgba(255,110,140,.5)';circ(c,s*.2,s*.04,s*.07);c.fill();
  c.restore();
}

/* ---------------- Headwear & head accessories ---------------- */
/* returns an anchor {x,y,r,sc,top}: where Kiana's crown sits and where the bird nest goes */
function drawHat(c,o,hr,hy,lw,t,back){
  const k=o.hat,col=o.hatCol;let A={x:hr*.28,y:hy-hr*1.08,r:.25,sc:1,top:hy-hr*1.2};
  c.save();c.lineWidth=lw;c.strokeStyle=INK;c.lineJoin='round';c.lineCap='round';
  if(k==='beret'){c.fillStyle=col||'#D7263D';circ(c,-hr*.26,hy-hr*1.17,hr*.09);c.fill();c.stroke();
    ell(c,-hr*.12,hy-hr*.85,hr*.98,hr*.36,-.14);c.fill();c.stroke();c.fillStyle='rgba(255,255,255,.25)';ell(c,-hr*.42,hy-hr*.99,hr*.34,hr*.08,-.3);c.fill();
    A={x:hr*.62,y:hy-hr*.98,r:.55,sc:.8,top:hy-hr*1.25};}
  else if(k==='pirate'){c.fillStyle='#262838';c.beginPath();c.moveTo(-hr*1.25,hy-hr*.6);c.quadraticCurveTo(-hr*1.22,hy-hr*1.32,-hr*.62,hy-hr*1.3);c.quadraticCurveTo(0,hy-hr*1.8,hr*.62,hy-hr*1.3);
    c.quadraticCurveTo(hr*1.22,hy-hr*1.32,hr*1.25,hy-hr*.6);c.quadraticCurveTo(0,hy-hr*1.0,-hr*1.25,hy-hr*.6);c.closePath();c.fill();c.stroke();
    c.strokeStyle='#FFC531';c.lineWidth=Math.max(1,lw*1.3);c.beginPath();c.moveTo(-hr*1.12,hy-hr*.7);c.quadraticCurveTo(0,hy-hr*1.08,hr*1.12,hy-hr*.7);c.stroke();
    if(!back){c.strokeStyle='#fff';c.lineWidth=hr*.07;c.beginPath();c.moveTo(-hr*.24,hy-hr*1.08);c.lineTo(hr*.24,hy-hr*1.42);c.moveTo(hr*.24,hy-hr*1.08);c.lineTo(-hr*.24,hy-hr*1.42);c.stroke();
      c.fillStyle='#fff';circ(c,0,hy-hr*1.3,hr*.16);c.fill();rr(c,-hr*.09,hy-hr*1.24,hr*.18,hr*.12,hr*.04);c.fill();c.fillStyle='#262838';circ(c,-hr*.06,hy-hr*1.31,hr*.045);c.fill();circ(c,hr*.06,hy-hr*1.31,hr*.045);c.fill();}
    A={x:hr*.62,y:hy-hr*1.36,r:.4,sc:.72,top:hy-hr*1.6};}
  else if(k==='wizard'){const cl=col||'#6B4FC8',tw=Math.sin(t*2)*hr*.06;c.fillStyle=cl;ell(c,0,hy-hr*.8,hr*1.32,hr*.3);c.fill();c.stroke();
    c.beginPath();c.moveTo(-hr*.72,hy-hr*.86);c.quadraticCurveTo(-hr*.35,hy-hr*1.6,hr*.05+tw,hy-hr*2.25);c.quadraticCurveTo(hr*.38+tw,hy-hr*2.36,hr*.64+tw,hy-hr*2.08);
    c.quadraticCurveTo(hr*.36,hy-hr*1.86,hr*.32,hy-hr*1.55);c.quadraticCurveTo(hr*.5,hy-hr*1.1,hr*.72,hy-hr*.86);c.quadraticCurveTo(0,hy-hr*.7,-hr*.72,hy-hr*.86);c.closePath();c.fill();c.stroke();
    c.fillStyle='#FFC531';c.beginPath();c.moveTo(-hr*.68,hy-hr*.94);c.quadraticCurveTo(0,hy-hr*.8,hr*.67,hy-hr*.94);c.lineTo(hr*.6,hy-hr*1.1);c.quadraticCurveTo(0,hy-hr*.97,-hr*.62,hy-hr*1.1);c.closePath();c.fill();c.stroke();
    if(!back){c.fillStyle='#FFE14D';starPath(c,-hr*.14,hy-hr*1.42,hr*.14);c.fill();c.stroke();starPath(c,hr*.16,hy-hr*1.78,hr*.08);c.fill();
      crescent(c,hr*.2,hy-hr*1.22,hr*.11,'#FFE14D');}
    A={x:-hr*.42,y:hy-hr*1.02,r:-.3,sc:.68,top:hy-hr*2.15};}
  else if(k==='chef'){hairUnion(c,lw,'#FFFFFF',[c=>circ(c,-hr*.5,hy-hr*1.32,hr*.38),c=>circ(c,0,hy-hr*1.56,hr*.46),c=>circ(c,hr*.5,hy-hr*1.32,hr*.38),c=>rr(c,-hr*.72,hy-hr*1.42,hr*1.44,hr*.45,hr*.1)]);
    c.fillStyle='#fff';rr(c,-hr*.76,hy-hr*1.08,hr*1.52,hr*.34,hr*.08);c.fill();c.stroke();
    c.strokeStyle='rgba(34,48,60,.15)';c.lineWidth=lw*.8;for(let i=-2;i<=2;i++){c.beginPath();c.moveTo(i*hr*.28,hy-hr*1.05);c.lineTo(i*hr*.28,hy-hr*.78);c.stroke();}
    A={x:hr*.0,y:hy-hr*.95,r:0,sc:.6,top:hy-hr*2.0};}
  else if(k==='fedora'){c.fillStyle=col||'#6E5038';ell(c,0,hy-hr*.74,hr*1.36,hr*.28,-.04);c.fill();c.stroke();
    c.beginPath();c.moveTo(-hr*.8,hy-hr*.8);c.lineTo(-hr*.68,hy-hr*1.35);c.quadraticCurveTo(-hr*.3,hy-hr*1.52,0,hy-hr*1.32);c.quadraticCurveTo(hr*.3,hy-hr*1.52,hr*.68,hy-hr*1.35);c.lineTo(hr*.8,hy-hr*.8);c.quadraticCurveTo(0,hy-hr*.66,-hr*.8,hy-hr*.8);c.closePath();c.fill();c.stroke();
    c.fillStyle='#2B2230';c.beginPath();c.moveTo(-hr*.79,hy-hr*.9);c.quadraticCurveTo(0,hy-hr*.78,hr*.79,hy-hr*.9);c.lineTo(hr*.76,hy-hr*1.06);c.quadraticCurveTo(0,hy-hr*.95,-hr*.76,hy-hr*1.06);c.closePath();c.fill();
    A={x:hr*.45,y:hy-hr*1.45,r:.25,sc:.68,top:hy-hr*1.52};}
  else if(k==='capback'){const cl=col||'#E5484D';
    if(!back){c.fillStyle=shade(cl,-.18);ell(c,-hr*.98,hy-hr*.98,hr*.42,hr*.13,.55);c.fill();c.stroke();}
    c.fillStyle=cl;c.beginPath();c.arc(0,hy-hr*.3,hr*1.04,P*1.02,P*1.98);c.quadraticCurveTo(0,hy-hr*.6,-hr*1.04,hy-hr*.36);c.closePath();c.fill();c.stroke();
    c.fillStyle='rgba(255,255,255,.3)';ell(c,-hr*.45,hy-hr*.98,hr*.25,hr*.1,-.5);c.fill();
    if(!back){c.fillStyle='#fff';rr(c,-hr*.22,hy-hr*.66,hr*.44,hr*.14,hr*.06);c.fill();c.stroke();}
    else{c.fillStyle=shade(cl,-.18);ell(c,0,hy-hr*.44,hr*.78,hr*.2);c.fill();c.stroke();}
    c.fillStyle=cl;circ(c,0,hy-hr*1.33,hr*.07);c.fill();c.stroke();
    A={x:hr*.38,y:hy-hr*1.22,r:.25,sc:.85,top:hy-hr*1.38};}
  else if(k==='helmet'){c.fillStyle=col||'#5EC8F7';c.beginPath();c.arc(0,hy-hr*.18,hr*1.1,P,TAU);c.quadraticCurveTo(0,hy-hr*.36,-hr*1.1,hy-hr*.18);c.closePath();c.fill();c.stroke();
    c.fillStyle='#2B2D42';for(let i=-1;i<=1;i++){rr(c,i*hr*.42-hr*.08,hy-hr*1.14+Math.abs(i)*hr*.14,hr*.16,hr*.34,hr*.07);c.fill();}
    c.fillStyle='#FFE14D';c.beginPath();c.moveTo(-hr*1.06,hy-hr*.42);c.quadraticCurveTo(0,hy-hr*.62,hr*1.06,hy-hr*.42);c.lineTo(hr*1.08,hy-hr*.3);c.quadraticCurveTo(0,hy-hr*.48,-hr*1.08,hy-hr*.3);c.closePath();c.fill();
    c.fillStyle='rgba(255,255,255,.4)';ell(c,-hr*.6,hy-hr*.85,hr*.2,hr*.1,-.6);c.fill();
    A={x:hr*.36,y:hy-hr*1.3,r:.25,sc:.85,top:hy-hr*1.36};}
  else if(k==='viking'){for(const sd of[-1,1]){c.fillStyle='#FFF1D0';c.beginPath();c.moveTo(sd*hr*.82,hy-hr*.6);c.quadraticCurveTo(sd*hr*1.48,hy-hr*.85,sd*hr*1.38,hy-hr*1.62);c.quadraticCurveTo(sd*hr*1.15,hy-hr*1.1,sd*hr*.74,hy-hr*.96);c.closePath();c.fill();c.stroke();}
    c.fillStyle='#A9B4BF';c.beginPath();c.arc(0,hy-hr*.32,hr*1.0,P,TAU);c.closePath();c.fill();c.stroke();
    c.fillStyle='rgba(255,255,255,.38)';ell(c,-hr*.42,hy-hr*.95,hr*.25,hr*.1,-.5);c.fill();
    c.fillStyle='#C9A227';rr(c,-hr*1.04,hy-hr*.46,hr*2.08,hr*.2,hr*.07);c.fill();c.stroke();c.fillStyle='#FFE58A';for(let i=-3;i<=3;i++){circ(c,i*hr*.28,hy-hr*.36,hr*.04);c.fill();}
    A={x:0,y:hy-hr*1.4,r:0,sc:.7,top:hy-hr*1.4};}
  else if(k==='knight'){const sw2=Math.sin(t*3)*hr*.04;c.fillStyle='#5EC8F7';c.beginPath();c.moveTo(-hr*.18,hy-hr*1.05);c.quadraticCurveTo(-hr*.1,hy-hr*1.7,hr*.35+sw2,hy-hr*1.82);
      c.quadraticCurveTo(hr*.2,hy-hr*1.45,hr*.42,hy-hr*1.0);c.closePath();c.fill();c.stroke();
    c.fillStyle='#C9D3DB';c.beginPath();c.arc(0,hy-hr*.12,hr*1.08,P,TAU);c.lineTo(hr*1.08,hy+hr*.25);c.lineTo(hr*.86,hy+hr*.25);c.lineTo(hr*.86,hy-hr*.3);c.quadraticCurveTo(0,hy-hr*.5,-hr*.86,hy-hr*.3);c.lineTo(-hr*.86,hy+hr*.25);c.lineTo(-hr*1.08,hy+hr*.25);c.closePath();c.fill();c.stroke();
    c.fillStyle='rgba(255,255,255,.5)';ell(c,-hr*.5,hy-hr*.85,hr*.22,hr*.09,-.5);c.fill();
    if(!back){c.fillStyle='#FFE14D';starPath(c,0,hy-hr*.62,hr*.15);c.fill();c.stroke();}
    A={x:-hr*.55,y:hy-hr*1.02,r:-.4,sc:.7,top:hy-hr*1.3};}
  else if(k==='crown2'){drawCrown(c,0,hy-hr*1.02,hr*.46,0,true);A={x:0,y:hy-hr*1.6,r:0,sc:0,top:hy-hr*1.45};}
  c.restore();return A;
}
function hoodBack(c,o,hr,hy,lw,t){
  const S=[c=>circ(c,0,hy,hr*1.12)];
  if(o.hood==='panda'){c.save();c.fillStyle='#2B2D42';c.lineWidth=lw;c.strokeStyle=INK;for(const sd of[-1,1]){circ(c,sd*hr*.82,hy-hr*.84,hr*.32);c.fill();c.stroke();}c.restore();}
  if(o.hood==='bat')for(const sd of[-1,1])S.push(c=>{c.beginPath();c.moveTo(sd*hr*.3,hy-hr*.98);c.lineTo(sd*hr*.52,hy-hr*1.5);c.quadraticCurveTo(sd*hr*.62,hy-hr*1.15,sd*hr*.8,hy-hr*.82);c.closePath();});
  if(o.hood==='cat')for(const sd of[-1,1])S.push(c=>{c.beginPath();c.moveTo(sd*hr*.26,hy-hr*1.0);c.quadraticCurveTo(sd*hr*.66,hy-hr*1.3,sd*hr*.9,hy-hr*1.55);c.quadraticCurveTo(sd*hr*1.08,hy-hr*1.05,sd*hr*1.08,hy-hr*.48);c.closePath();});
  hairUnion(c,lw,o.hoodCol,S);
}
function hoodFront(c,o,hr,hy,lw,t){
  c.save();c.lineWidth=lw;c.strokeStyle=INK;
  const ninja=o.hood==='ninja',bat=o.hood==='bat',oy=ninja?hy+hr*.13:bat?hy+hr*.38:hy+hr*.24,orx=ninja?hr*.82:bat?hr*.84:hr*.8,ory=ninja?hr*.3:bat?hr*.66:hr*.72;
  c.beginPath();c.arc(0,hy,hr*1.12,0,TAU);c.ellipse(0,oy,orx,ory,0,0,TAU);c.fillStyle=o.hoodCol;c.fill('evenodd');
  if(!ninja&&!bat){c.save();ell(c,0,oy,orx,ory);c.clip();c.fillStyle=hairPaint(c,o,hr,hy);ell(c,0,oy-ory*1.0,orx*.86,hr*.25);c.fill();c.lineWidth=lw*.75;c.strokeStyle=hairInk(o);c.stroke();c.restore();}
  else if(ninja){c.strokeStyle='rgba(255,255,255,.12)';c.lineWidth=lw;c.beginPath();c.arc(0,hy+hr*1.0,hr*.55,P*1.2,P*1.8);c.stroke();c.strokeStyle=INK;}
  ell(c,0,oy,orx,ory);c.stroke();
  if(o.hood==='cat'){c.fillStyle='#FF9FC0';for(const sd of[-1,1]){c.beginPath();c.moveTo(sd*hr*.5,hy-hr*1.06);c.quadraticCurveTo(sd*hr*.72,hy-hr*1.24,sd*hr*.86,hy-hr*1.38);c.quadraticCurveTo(sd*hr*.96,hy-hr*1.08,sd*hr*.98,hy-hr*.82);c.closePath();c.fill();}}
  if(o.hood==='panda'){c.fillStyle='rgba(43,45,66,.85)';for(const sd of[-1,1]){ell(c,sd*hr*.86,hy-hr*.2,hr*.12,hr*.2,sd*.3);c.fill();}}
  c.restore();
}
function drawBubble(c,hr,hy,lw,t){
  c.save();c.lineWidth=lw;c.strokeStyle=INK;
  c.fillStyle='#C9D3DB';rr(c,-hr*.78,hy+hr*.84,hr*1.56,hr*.3,hr*.12);c.fill();c.stroke();
  const g=c.createRadialGradient(-hr*.4,hy-hr*.6,hr*.1,0,hy-hr*.1,hr*1.5);g.addColorStop(0,'rgba(255,255,255,.38)');g.addColorStop(1,'rgba(150,215,255,.24)');
  c.fillStyle=g;circ(c,0,hy-hr*.1,hr*1.48);c.fill();c.lineWidth=lw*1.3;c.stroke();
  c.strokeStyle='rgba(255,255,255,.9)';c.lineWidth=hr*.1;c.beginPath();c.arc(0,hy-hr*.1,hr*1.25,P*1.15,P*1.4);c.stroke();
  c.lineWidth=hr*.06;c.beginPath();c.arc(0,hy-hr*.1,hr*1.25,P*1.47,P*1.54);c.stroke();
  c.restore();
}
function drawBand(c,o,hr,hy,lw,t,back){
  const col=o.band;c.save();c.lineWidth=lw;c.strokeStyle=INK;
  c.save();circ(c,0,hy,hr*(o.hood&&o.hood!=='astro'?1.13:1.05));c.clip();c.fillStyle=col;
  const y1=hy-hr*.52,y2=hy-hr*.3;c.beginPath();c.moveTo(-hr*1.2,y1+hr*.14);c.quadraticCurveTo(0,y1-hr*.1,hr*1.2,y1+hr*.14);c.lineTo(hr*1.2,y2+hr*.14);c.quadraticCurveTo(0,y2-hr*.1,-hr*1.2,y2+hr*.14);c.closePath();c.fill();c.stroke();
  if(o.bandDot&&!back){c.fillStyle=o.bandDot;circ(c,0,hy-hr*.42,hr*.09);c.fill();}
  c.restore();
  const kx=back?0:hr*.96,ky=hy-hr*.36,fl=Math.sin(t*6)*hr*.06;c.fillStyle=col;
  for(const[ax,ay]of back?[[.25,.7],[-.2,.65]]:[[.5,.32],[.58,.62]]){c.beginPath();c.moveTo(kx,ky-hr*.05);c.quadraticCurveTo(kx+hr*ax*.6,ky+hr*ay*.3+fl,kx+hr*ax+fl,ky+hr*ay);c.lineTo(kx+hr*ax-hr*.1+fl,ky+hr*ay+hr*.06);c.quadraticCurveTo(kx+hr*ax*.35,ky+hr*ay*.45,kx,ky+hr*.06);c.closePath();c.fill();c.stroke();}
  circ(c,kx,ky,hr*.1);c.fill();c.stroke();c.restore();
}
function drawPhones(c,col,hr,hy,lw){
  c.save();c.lineCap='round';c.strokeStyle=INK;c.lineWidth=hr*.2;c.beginPath();c.arc(0,hy-hr*.02,hr*1.12,P*1.07,P*1.93);c.stroke();c.strokeStyle=col;c.lineWidth=hr*.11;c.stroke();
  c.fillStyle=col;c.lineWidth=lw;c.strokeStyle=INK;for(const sd of[-1,1]){rr(c,sd*hr*1.06-hr*.16,hy-hr*.2,hr*.32,hr*.48,hr*.13);c.fill();c.stroke();c.fillStyle='rgba(255,255,255,.35)';rr(c,sd*hr*1.06-hr*.08,hy-hr*.12,hr*.1,hr*.22,hr*.05);c.fill();c.fillStyle=col;}
  c.restore();
}
function drawCatEars(c,hr,hy,lw){
  c.save();c.lineWidth=lw;c.strokeStyle=INK;c.lineJoin='round';
  c.strokeStyle=INK;c.lineWidth=hr*.12;c.beginPath();c.arc(0,hy,hr*1.02,P*1.15,P*1.85);c.stroke();c.strokeStyle='#2B2D42';c.lineWidth=hr*.06;c.stroke();c.strokeStyle=INK;c.lineWidth=lw;
  for(const sd of[-1,1]){c.fillStyle='#2B2D42';c.beginPath();c.moveTo(sd*hr*.3,hy-hr*.95);c.lineTo(sd*hr*.62,hy-hr*1.48);c.lineTo(sd*hr*.88,hy-hr*.72);c.closePath();c.fill();c.stroke();
    c.fillStyle='#FF9FC0';c.beginPath();c.moveTo(sd*hr*.42,hy-hr*.95);c.lineTo(sd*hr*.6,hy-hr*1.3);c.lineTo(sd*hr*.76,hy-hr*.82);c.closePath();c.fill();}
  c.restore();
}
function drawFlower(c,x,y,r,lw){
  c.save();c.lineWidth=lw;c.strokeStyle=INK;c.fillStyle='#FF8FB5';for(let i=0;i<5;i++){const a=i/5*TAU-P/2;circ(c,x+Math.cos(a)*r*.62,y+Math.sin(a)*r*.62,r*.48);c.fill();c.stroke();}
  c.fillStyle='#FFE14D';circ(c,x,y,r*.4);c.fill();c.stroke();c.restore();
}
function shadesOnHead(c,hr,hy,lw){
  c.save();c.translate(0,hy-hr*.66);c.lineWidth=lw;c.strokeStyle=INK;
  c.beginPath();c.moveTo(-hr*1.0,hr*.16);c.quadraticCurveTo(-hr*.7,-hr*.02,-hr*.5,0);c.moveTo(hr*1.0,hr*.16);c.quadraticCurveTo(hr*.7,-hr*.02,hr*.5,0);c.stroke();
  c.fillStyle='#1E2230';for(const sd of[-1,1]){rr(c,sd*hr*.3-hr*.21,-hr*.12,hr*.42,hr*.25,hr*.11);c.fill();c.stroke();}
  c.beginPath();c.moveTo(-hr*.09,-hr*.03);c.quadraticCurveTo(0,-hr*.1,hr*.09,-hr*.03);c.stroke();
  c.strokeStyle='rgba(255,255,255,.65)';c.lineWidth=Math.max(1,hr*.05);for(const sd of[-1,1]){c.beginPath();c.moveTo(sd*hr*.3-hr*.12,-hr*.04);c.lineTo(sd*hr*.3-hr*.02,-hr*.09);c.stroke();}
  c.restore();
}

/* ---------------- Face ---------------- */
function drawFace(c,o,hr,hy,fx,fy,t,lw){
  const mood=o.mood||'normal',ex=fx*hr*.2,ey=hy+hr*.17+fy*hr*.05,sp=hr*.37;
  c.lineWidth=lw;c.strokeStyle=INK;c.lineCap='round';c.lineJoin='round';
  c.fillStyle=(mood==='love'||mood==='blush')?'rgba(255,80,125,.62)':o.rosy?'rgba(255,90,125,.5)':'rgba(255,110,140,.36)';
  const ck=o.rosy?1.2:1;ell(c,ex-sp*1.32,ey+hr*.33,hr*.16*ck,hr*.09*ck);c.fill();ell(c,ex+sp*1.32,ey+hr*.33,hr*.16*ck,hr*.09*ck);c.fill();
  if(o.mask){c.fillStyle=o.mask;c.beginPath();c.moveTo(ex-sp-hr*.36,ey-hr*.12);c.quadraticCurveTo(ex,ey-hr*.36,ex+sp+hr*.36,ey-hr*.12);c.quadraticCurveTo(ex+sp+hr*.3,ey+hr*.26,ex+hr*.08,ey+hr*.14);
    c.quadraticCurveTo(ex,ey+hr*.06,ex-hr*.08,ey+hr*.14);c.quadraticCurveTo(ex-sp-hr*.3,ey+hr*.26,ex-sp-hr*.36,ey-hr*.12);c.closePath();c.fill();c.stroke();
    c.fillStyle='#fff';for(const sd of[-1,1]){ell(c,ex+sd*sp,ey,hr*.17,hr*.21);c.fill();}}
  const blink=['normal','angry','sad','excited','sweat'].includes(mood)&&((t+(o.seed||0))%3.9)<.13;
  const types={happy:'arc',blush:'arc',sleepy:'sleepy',shock:'shock',dizzy:'dizzy',love:'heart',evil:'evil',smug:'half',cry:'cry'};
  let type=blink?'blink':(types[mood]||'open');
  if(type==='open'&&o.droopy&&mood==='normal')type='half';
  const eyeCol=o.eyeCol||'#2B1D17';
  for(const sd of[-1,1]){const cx=ex+sd*sp,cy=ey;
    if(type==='open'||type==='evil'||type==='half'){
      const g=c.createLinearGradient(0,cy-hr*.17,0,cy+hr*.17);g.addColorStop(0,eyeCol);g.addColorStop(1,shade(eyeCol,.35));
      c.fillStyle=g;ell(c,cx,cy,hr*.135,hr*.175);c.fill();
      c.fillStyle='#fff';circ(c,cx-hr*.045,cy-hr*.06,hr*.058);c.fill();circ(c,cx+hr*.045,cy+hr*.06,hr*.028);c.fill();
      if(mood==='excited'){c.fillStyle='#fff';starPath(c,cx,cy,hr*.1,4,.35);c.fill();}
      if(type!=='open'){const outer=cx+sd*hr*.17,inner=cx-sd*hr*.17,oy=type==='evil'?cy-hr*.12:cy-hr*.02,iy=type==='evil'?cy+hr*.02:cy-hr*.02;
        c.fillStyle=o.mask?'#fff':o.skin;c.beginPath();c.moveTo(outer+sd*hr*.04,cy-hr*.24);c.lineTo(inner-sd*hr*.04,cy-hr*.24);c.lineTo(inner-sd*hr*.04,iy);c.lineTo(outer+sd*hr*.04,oy);c.closePath();c.fill();
        c.beginPath();c.moveTo(outer,oy);c.lineTo(inner,iy);c.stroke();}
    }else if(type==='arc'){c.lineWidth=lw*1.3;c.beginPath();c.arc(cx,cy+hr*.06,hr*.12,P*1.12,P*1.88);c.stroke();c.lineWidth=lw;}
    else if(type==='blink'){c.lineWidth=lw*1.2;c.beginPath();c.moveTo(cx-hr*.12,cy+hr*.02);c.quadraticCurveTo(cx,cy+hr*.08,cx+hr*.12,cy+hr*.02);c.stroke();c.lineWidth=lw;}
    else if(type==='sleepy'){
      c.save();c.beginPath();c.rect(cx-hr*.2,cy+hr*.03,hr*.4,hr*.3);c.clip();c.fillStyle=eyeCol;ell(c,cx,cy,hr*.135,hr*.175);c.fill();c.fillStyle='#fff';circ(c,cx+hr*.04,cy+hr*.09,hr*.025);c.fill();c.restore();
      c.lineWidth=lw*1.5;c.beginPath();c.moveTo(cx-hr*.16,cy+hr*.04-sd*hr*.02);c.lineTo(cx+hr*.16,cy+hr*.04+sd*hr*.02);c.stroke();
      c.strokeStyle='rgba(115,60,140,.55)';c.lineWidth=lw*1.1;c.beginPath();c.arc(cx,cy+hr*.12,hr*.13,P*.15,P*.85);c.stroke();c.beginPath();c.arc(cx,cy+hr*.16,hr*.1,P*.25,P*.75);c.stroke();
      c.strokeStyle=INK;c.lineWidth=lw;
    }else if(type==='shock'){c.fillStyle='#fff';ell(c,cx,cy,hr*.17,hr*.21);c.fill();c.stroke();c.fillStyle=INK;circ(c,cx,cy,hr*.05);c.fill();}
    else if(type==='dizzy'){c.beginPath();for(let a=0;a<TAU*2.2;a+=.3){const q=hr*.02+a*hr*.016;c.lineTo(cx+Math.cos(a*sd+t*8)*q,cy+Math.sin(a*sd+t*8)*q);}c.stroke();}
    else if(type==='heart'){c.fillStyle='#FF3B6B';const hb=1+Math.sin(t*10)*.1;heartPath(c,cx,cy,hr*.14*hb);c.fill();c.lineWidth=lw*.7;c.stroke();c.lineWidth=lw;}
    else if(type==='cry'){c.lineWidth=lw*1.3;c.beginPath();c.moveTo(cx-hr*.13,cy-hr*.02);c.lineTo(cx,cy+hr*.06);c.lineTo(cx+hr*.13,cy-hr*.02);c.stroke();c.lineWidth=lw;
      c.fillStyle='rgba(94,200,247,.85)';const k=(t*2+sd)%1;rr(c,cx-hr*.05,cy+hr*.08,hr*.1,hr*(.3+k*.25),hr*.05);c.fill();}
    if(o.lashes&&['open','evil','half','sleepy','shock'].includes(type)){c.beginPath();c.moveTo(cx+sd*hr*.1,cy-hr*.13);c.lineTo(cx+sd*hr*.21,cy-hr*.2);c.moveTo(cx+sd*hr*.13,cy-hr*.05);c.lineTo(cx+sd*hr*.24,cy-hr*.07);c.stroke();}
    // brows
    {const by=cy-hr*.31;let iy=0,oy2=0;
      if(mood==='angry'||mood==='evil'){iy=hr*.09;oy2=-hr*.04;}else if(mood==='sad'||mood==='cry'||mood==='sweat'){iy=-hr*.08;oy2=hr*.03;}else if(mood==='shock'){iy=-hr*.1;oy2=-hr*.1;}else if(mood==='sleepy'){iy=hr*.04;oy2=hr*.06;}
      if(o.cocky&&sd===1&&(mood==='normal'||mood==='smug'||mood==='happy')){iy=-hr*.07;oy2=-hr*.13;}
      if(o.droopy&&mood==='normal'){iy=-hr*.03;oy2=hr*.05;}
      c.strokeStyle=shade(o.hairCol==='#BDB8C6'?'#8A8494':o.hairCol,-.1);c.lineWidth=lw*(o.capHair?1.9:1.4);c.beginPath();c.moveTo(cx-sd*hr*.12,by+iy);c.quadraticCurveTo(cx,by-hr*.04+(iy+oy2)/2,cx+sd*hr*.15,by+oy2);c.stroke();c.strokeStyle=INK;c.lineWidth=lw;}
  }
  // mouth
  const mx=ex*.8,my=ey+hr*.43;
  if(o.mustache){
    if(o.mustache==='gold'){c.fillStyle='#F5B700';const up=mood==='excited'||mood==='happy'?-.35:0;
      for(const sd of[-1,1]){c.beginPath();c.moveTo(mx,my-hr*.08);c.quadraticCurveTo(mx+sd*hr*.25,my+hr*.02,mx+sd*hr*.42,my-hr*(.1-up*.3));c.quadraticCurveTo(mx+sd*hr*.5,my-hr*(.28-up*.3),mx+sd*hr*.38,my-hr*(.22-up*.3));c.quadraticCurveTo(mx+sd*hr*.3,my-hr*.08,mx,my-hr*.02);c.fill();c.stroke();}}
    else if(o.mustache==='thin'){c.strokeStyle=o.hairCol;c.lineWidth=lw*1.5;for(const sd of[-1,1]){c.beginPath();c.moveTo(mx+sd*hr*.03,my-hr*.15);c.quadraticCurveTo(mx+sd*hr*.2,my-hr*.2,mx+sd*hr*.3,my-hr*.3);c.stroke();}c.strokeStyle=INK;c.lineWidth=lw;}
    else{c.fillStyle=o.hairCol;c.strokeStyle=hairInk(o);c.beginPath();c.moveTo(mx-hr*.3,my);c.quadraticCurveTo(mx,my-hr*.22,mx+hr*.3,my);c.quadraticCurveTo(mx+hr*.15,my+hr*.03,mx,my-hr*.03);c.quadraticCurveTo(mx-hr*.15,my+hr*.03,mx-hr*.3,my);c.fill();c.stroke();}
  }
  const open=(col)=>{c.fillStyle='#7A2533';c.fill();c.stroke();c.save();c.clip();c.fillStyle='#FF8FA6';ell(c,mx,my+hr*.15,hr*.09,hr*.06);c.fill();c.restore();};
  const mo=o.mustache&&o.mustache!=='thin'?hr*.06:0;
  if(o.grin&&['normal','happy','smug','excited'].includes(mood)){const gp=()=>{c.beginPath();c.moveTo(mx-hr*.27,my-hr*.08+mo);c.quadraticCurveTo(mx,my+hr*.36+mo,mx+hr*.27,my-hr*.08+mo);c.closePath();};
    gp();c.fillStyle='#7A2533';c.fill();c.save();gp();c.clip();c.fillStyle='#fff';c.fillRect(mx-hr*.3,my-hr*.1+mo,hr*.6,hr*.13);c.fillStyle='#FF8FA6';ell(c,mx,my+hr*.2+mo,hr*.1,hr*.06);c.fill();c.restore();gp();c.stroke();}
  else switch(mood){
    case 'happy':case 'excited':case 'love':c.beginPath();c.moveTo(mx-hr*.15,my-hr*.03+mo);c.quadraticCurveTo(mx,my+hr*.25+mo,mx+hr*.15,my-hr*.03+mo);c.closePath();open();break;
    case 'sleepy':c.fillStyle='#7A2533';ell(c,mx,my+hr*.02,hr*.05,hr*.07);c.fill();c.stroke();
      if((o.mess||0)>.6){const k=(Math.sin(t*1.8)+1)/2;c.fillStyle='rgba(120,200,255,.9)';c.beginPath();c.moveTo(mx+hr*.06,my+hr*.05);c.quadraticCurveTo(mx+hr*.13,my+hr*(.15+k*.15),mx+hr*.08,my+hr*(.2+k*.15));c.quadraticCurveTo(mx+hr*.03,my+hr*.15,mx+hr*.06,my+hr*.05);c.fill();}break;
    case 'shock':c.fillStyle='#7A2533';ell(c,mx,my+hr*.04+mo,hr*.1,hr*.14);c.fill();c.stroke();break;
    case 'angry':c.beginPath();c.moveTo(mx-hr*.14,my+hr*.06+mo);c.lineTo(mx-hr*.07,my+mo);c.lineTo(mx,my+hr*.06+mo);c.lineTo(mx+hr*.07,my+mo);c.lineTo(mx+hr*.14,my+hr*.06+mo);c.stroke();break;
    case 'sad':case 'sweat':c.beginPath();c.arc(mx,my+hr*.12+mo,hr*.1,P*1.2,P*1.8);c.stroke();break;
    case 'cry':c.beginPath();c.moveTo(mx-hr*.15,my+mo);c.quadraticCurveTo(mx,my-hr*.08+mo,mx+hr*.15,my+mo);c.quadraticCurveTo(mx,my+hr*.22+mo,mx-hr*.15,my+mo);open();break;
    case 'evil':c.fillStyle='#fff';c.beginPath();c.moveTo(mx-hr*.22,my-hr*.05+mo);c.quadraticCurveTo(mx,my+hr*.22+mo,mx+hr*.22,my-hr*.05+mo);c.closePath();c.fill();c.stroke();c.beginPath();c.moveTo(mx-hr*.18,my+mo);c.lineTo(mx+hr*.18,my+mo);c.stroke();break;
    case 'smug':c.beginPath();c.moveTo(mx-hr*.11,my+hr*.02+mo);c.quadraticCurveTo(mx+hr*.02,my+hr*.08+mo,mx+hr*.13,my-hr*.05+mo);c.stroke();break;
    case 'dizzy':c.beginPath();for(let i=0;i<=8;i++){c.lineTo(mx-hr*.14+i*hr*.035,my+Math.sin(i*1.6)*hr*.03+mo);}c.stroke();break;
    default:c.beginPath();c.arc(mx,my-hr*.05+mo,hr*.1,P*.22,P*.78);c.stroke();
  }
  if(o.lips&&!['shock','happy','excited','cry','evil','love'].includes(mood)){c.fillStyle='#E0457B';ell(c,mx,my+hr*.03,hr*.07,hr*.035);c.fill();}
  // glasses / monocle / sunglasses
  if(o.glasses){c.lineWidth=lw*1.1;
    if(o.glasses==='cat'){c.strokeStyle='#C2185B';for(const sd of[-1,1]){const cx=ex+sd*sp;c.beginPath();c.moveTo(cx-hr*.2,ey-hr*.12);c.lineTo(cx+sd*hr*.26,ey-hr*.2);c.quadraticCurveTo(cx+sd*hr*.24,ey+hr*.18,cx,ey+hr*.18);c.quadraticCurveTo(cx-sd*hr*.22,ey+hr*.16,cx-sd*hr*.2,ey-hr*.1);c.stroke();}
      c.beginPath();c.moveTo(ex-hr*.15,ey-hr*.05);c.lineTo(ex+hr*.15,ey-hr*.05);c.stroke();}
    else if(o.glasses==='big'){c.strokeStyle=o.glassCol||INK;c.lineWidth=lw*1.8;c.fillStyle='rgba(210,240,255,.28)';
      for(const sd of[-1,1]){circ(c,ex+sd*sp,ey,hr*.27);c.fill();c.stroke();}
      c.beginPath();c.moveTo(ex-sp+hr*.25,ey-hr*.06);c.quadraticCurveTo(ex,ey-hr*.14,ex+sp-hr*.25,ey-hr*.06);c.stroke();
      c.strokeStyle='rgba(255,255,255,.75)';c.lineWidth=lw;for(const sd of[-1,1]){c.beginPath();c.arc(ex+sd*sp,ey,hr*.2,P*1.15,P*1.4);c.stroke();}}
    else{c.strokeStyle=INK;c.beginPath();c.arc(ex-sp,ey,hr*.22,0,TAU);c.moveTo(ex+sp+hr*.22,ey);c.arc(ex+sp,ey,hr*.22,0,TAU);c.moveTo(ex-sp+hr*.22,ey);c.lineTo(ex+sp-hr*.22,ey);c.stroke();
      c.fillStyle='rgba(255,255,255,.25)';circ(c,ex-sp,ey,hr*.21);c.fill();circ(c,ex+sp,ey,hr*.21);c.fill();}
    c.strokeStyle=INK;c.lineWidth=lw;}
  if(o.shades==='eyes'||o.shades==='heart'){const ht=o.shades==='heart';c.lineWidth=lw*1.2;c.strokeStyle=ht?'#C2185B':INK;
    c.beginPath();c.moveTo(ex-sp+hr*.2,ey-hr*.06);c.quadraticCurveTo(ex,ey-hr*.14,ex+sp-hr*.2,ey-hr*.06);c.stroke();
    for(const sd of[-1,1]){const cx=ex+sd*sp;c.fillStyle=ht?'#3A1530':'#1E2230';if(ht)heartPath(c,cx,ey-hr*.06,hr*.24);else rr(c,cx-hr*.25,ey-hr*.17,hr*.5,hr*.33,hr*.13);c.fill();c.stroke();
      c.strokeStyle='rgba(255,255,255,.7)';c.lineWidth=Math.max(1,hr*.05);c.beginPath();c.moveTo(cx-hr*.13,ey-hr*.02);c.lineTo(cx-hr*.03,ey-hr*.1);c.stroke();c.strokeStyle=ht?'#C2185B':INK;c.lineWidth=lw*1.2;}
    c.strokeStyle=INK;c.lineWidth=lw;}
  if(o.monocle){const cx=ex+sp,cy=ey;c.lineWidth=lw*1.6;c.strokeStyle='#C9A227';circ(c,cx,cy,hr*.27);c.stroke();
    c.fillStyle='rgba(94,200,247,.35)';c.fill();c.fillStyle='rgba(255,255,255,.8)';ell(c,cx-hr*.08,cy-hr*.1,hr*.07,hr*.04,-.6);c.fill();
    c.strokeStyle='#C9A227';c.lineWidth=lw*.8;c.beginPath();c.moveTo(cx+hr*.2,cy+hr*.18);c.quadraticCurveTo(cx+hr*.4,cy+hr*.6,cx+hr*.15,cy+hr*.9);c.stroke();c.strokeStyle=INK;c.lineWidth=lw;}
}

/* ---------------- Clothes pieces ---------------- */
function drawCape(c,o,s,sway,inner){
  const b=s*.37,col=inner?(o.capeIn||shade(o.cape,-.2)):o.cape;
  const path=()=>{c.beginPath();c.moveTo(-s*.12,-s*.08);c.quadraticCurveTo(-s*.3,s*.1,-s*.34+sway,b);
    if(o.capeEdge==='filter'){const n=7,w=s*.68/n;for(let i=1;i<=n;i++){const xx=-s*.34+sway+i*w;c.quadraticCurveTo(xx-w/2,b+s*.055,xx,b);}}
    else if(o.capeEdge==='scallop'){const n=5,w=s*.68/n;for(let i=1;i<=n;i++){const xx=-s*.34+sway+i*w;c.quadraticCurveTo(xx-w/2,b-s*.07,xx,b+s*.01);}}
    else c.quadraticCurveTo(sway,b+s*.05,s*.34+sway,b);
    c.quadraticCurveTo(s*.3,s*.1,s*.12,-s*.08);c.closePath();};
  c.fillStyle=col;path();c.fill();c.stroke();
  if(!inner&&o.capeEdge==='filter'){c.save();path();c.clip();c.strokeStyle='rgba(140,100,50,.3)';c.lineWidth=Math.max(1,s*.012);for(let i=-3;i<=3;i++){c.beginPath();c.moveTo(i*s*.03,-s*.04);c.lineTo(i*s*.095+sway,b);c.stroke();}c.restore();}
  if(!inner&&o.capeStars){c.save();path();c.clip();c.fillStyle='#FFE14D';for(let i=0;i<7;i++){starPath(c,(hsh(i+40)-.5)*s*.6+sway*.5,s*(.0+hsh(i+50)*.33),s*(.012+hsh(i)*.012),4,.4);c.fill();}c.restore();}
  if(o.capeEdge==='ermine'){c.save();path();c.clip();c.fillStyle='#FFFFFF';c.fillRect(-s*.5,b-s*.05,s,s*.1);c.fillStyle=INK;for(let i=-4;i<=4;i++){ell(c,i*s*.075+sway,b-s*.022,s*.008,s*.016);c.fill();}c.restore();
    c.strokeStyle=INK;path();c.stroke();}
}
function drawTail(c,o,s,t,back){
  if(o.tailShort){if(back){c.fillStyle=o.tail;circ(c,0,s*.22,s*.055);c.fill();c.stroke();}return;}
  const w=Math.sin(t*3)*s*.04,sd=back?-1:1;limb3(c,sd*s*.1,s*.24,sd*s*.3,s*.2+w*.5,sd*(s*.3+w),-s*.02,s*.05,o.tail);
}
function drawGuitar(c,s,lw,back){
  c.save();const sd=back?-1:1;c.lineWidth=lw;c.strokeStyle=INK;
  limb(c,-sd*s*.1,s*.16,sd*s*.38,-s*.3,s*.045,'#8B5A2B');
  c.fillStyle='#3A2418';c.save();c.translate(sd*s*.4,-s*.33);c.rotate(sd*-.9);rr(c,-s*.04,-s*.035,s*.08,s*.07,s*.015);c.fill();c.stroke();c.restore();
  c.fillStyle='#E5484D';circ(c,-sd*s*.2,s*.22,s*.1);c.fill();c.stroke();circ(c,-sd*s*.12,s*.13,s*.075);c.fill();c.stroke();
  c.fillStyle='#E5484D';circ(c,-sd*s*.2,s*.22,s*.096);c.fill();
  if(back){c.fillStyle=INK;circ(c,-sd*s*.17,s*.19,s*.03);c.fill();c.strokeStyle='#C9D3DB';c.lineWidth=Math.max(1,s*.01);c.beginPath();c.moveTo(-sd*s*.17,s*.19);c.lineTo(sd*s*.36,-s*.28);c.stroke();}
  c.restore();
}
function drawPack(c,s,back){
  c.fillStyle='#DDE3E9';
  if(back){rr(c,-s*.16,-s*.06,s*.32,s*.3,s*.05);c.fill();c.stroke();c.fillStyle='#5EC8F7';rr(c,-s*.1,0,s*.2,s*.07,s*.02);c.fill();c.stroke();
    ['#E5484D','#FFC531','#62C784'].forEach((q,i)=>{c.fillStyle=q;circ(c,(i-1)*s*.06,s*.15,s*.022);c.fill();c.stroke();});}
  else{rr(c,-s*.245,-s*.08,s*.49,s*.27,s*.06);c.fill();c.stroke();}
}
function drawJacket(c,o,s,lw,bodyP,t){
  const J=o.jacket,st=o.jstyle||'open';c.save();bodyP();c.clip();c.lineWidth=lw;c.strokeStyle=INK;
  const poly=(sd,pts,col)=>{c.fillStyle=col;c.beginPath();pts.forEach((p,i)=>i?c.lineTo(sd*p[0]*s,p[1]*s):c.moveTo(sd*p[0]*s,p[1]*s));c.closePath();c.fill();c.stroke();};
  if(st==='suit'||st==='coat'){for(const sd of[-1,1])poly(sd,[[.4,-.12],[.12,-.12],[0,.15],[0,.4],[.4,.4]],J);
    for(const sd of[-1,1])poly(sd,[[.105,-.08],[.18,-.08],[.13,.02],[.03,.1]],shade(J,-.12));
    if(st==='coat'){c.fillStyle=shade(J,-.3);for(const sd of[-1,1])for(let i=0;i<2;i++){circ(c,sd*s*.055,s*(.13+i*.07),s*.014);c.fill();}}
    else{c.fillStyle=shade(J,-.35);circ(c,-s*.02,s*.2,s*.013);c.fill();}
  }else{const gap=st==='fur'?.075:.052;for(const sd of[-1,1])poly(sd,[[.4,-.12],[gap,-.12],[gap+.01,.4],[.4,.4]],J);
    if(st==='open'||st==='vest')for(const sd of[-1,1])poly(sd,[[gap,-.075],[.15,-.075],[.12,.02]],shade(J,.12));
    if(st==='cardigan'){c.strokeStyle='rgba(0,0,0,.12)';c.lineWidth=Math.max(1,s*.008);for(let x=.08;x<.3;x+=.035)for(const sd of[-1,1]){c.beginPath();c.moveTo(sd*x*s,-s*.08);c.lineTo(sd*x*s,s*.32);c.stroke();}
      c.strokeStyle=INK;c.lineWidth=lw;c.fillStyle=shade(J,-.25);for(let i=0;i<3;i++){circ(c,-s*.075,s*(.0+i*.08),s*.016);c.fill();}
      c.fillStyle=shade(J,-.08);for(const sd of[-1,1]){rr(c,sd*s*.15-s*.045,s*.15,s*.09,s*.07,s*.015);c.fill();c.stroke();}}
    if(st==='fur'){c.fillStyle='#E8D6B5';for(const sd of[-1,1])for(let y=-.08;y<.3;y+=.045){circ(c,sd*(gap+.005)*s,y*s,s*.03);c.fill();}}
  }
  if(o.leather||o.shiny){c.strokeStyle=o.shiny?'rgba(255,255,255,.45)':'rgba(255,255,255,.22)';c.lineWidth=s*.02;for(const sd of[-1,1]){c.beginPath();c.moveTo(sd*s*.17,-s*.03);c.quadraticCurveTo(sd*s*.2,s*.1,sd*s*.17,s*.22);c.stroke();}
    if(o.shiny){c.lineWidth=s*.01;for(const sd of[-1,1]){c.beginPath();c.moveTo(sd*s*.12,s*.02);c.lineTo(sd*s*.13,s*.12);c.stroke();}}}
  if(o.studs){c.fillStyle='#D5DCE3';for(const sd of[-1,1])for(let i=0;i<3;i++){circ(c,sd*s*(.09+i*.022),-s*(.06-i*.035),s*.009);c.fill();}}
  c.restore();c.strokeStyle=INK;c.lineWidth=lw;bodyP();c.stroke();
}
function drawTVest(c,o,s,lw,bodyP){
  c.save();bodyP();c.clip();c.lineWidth=lw;c.strokeStyle=INK;c.fillStyle=o.tvest;
  for(const sd of[-1,1]){c.beginPath();c.moveTo(sd*s*.4,-s*.12);c.lineTo(sd*s*.12,-s*.12);c.lineTo(0,s*.14);c.lineTo(0,s*.4);c.lineTo(sd*s*.4,s*.4);c.closePath();c.fill();c.stroke();}
  c.fillStyle='#FFE58A';for(let i=0;i<2;i++){circ(c,s*.0,s*(.18+i*.055),s*.012);c.fill();}
  c.fillStyle='#fff';rr(c,-s*.17,s*.02,s*.085,s*.05,s*.01);c.fill();c.stroke();c.fillStyle='#E5484D';c.fillRect(-s*.16,s*.032,s*.065,s*.01);
  c.restore();c.strokeStyle=INK;c.lineWidth=lw;bodyP();c.stroke();
}
function drawScarf2(c,o,s,lw,back,t){
  const col=o.scarf2;c.fillStyle=col;c.lineWidth=lw;c.strokeStyle=INK;
  if(o.scarfSmall){if(!back){c.beginPath();c.moveTo(-s*.09,-s*.065);c.lineTo(s*.09,-s*.065);c.quadraticCurveTo(s*.03,s*.0,0,s*.06);c.quadraticCurveTo(-s*.03,s*.0,-s*.09,-s*.065);c.closePath();c.fill();c.stroke();}return;}
  const w=Math.sin(t*2)*s*.01;
  if(!back&&!o.scarfSmallRoll){c.beginPath();c.moveTo(s*.035,-s*.03);c.lineTo(s*.125,-s*.03);c.lineTo(s*.13+w,s*.2);c.lineTo(s*.045+w,s*.2);c.closePath();c.fill();c.stroke();
    c.fillStyle=shade(col,.4);c.fillRect(s*.045+w*.6,s*.08,s*.083,s*.025);c.fillRect(s*.047+w*.8,s*.14,s*.083,s*.025);
    c.strokeStyle=col;c.lineWidth=Math.max(1,s*.012);for(let i=0;i<4;i++){c.beginPath();c.moveTo(s*(.055+i*.022)+w,s*.2);c.lineTo(s*(.055+i*.022)+w,s*.235);c.stroke();}c.strokeStyle=INK;c.lineWidth=lw;}
  c.fillStyle=col;rr(c,-s*.2,-s*.09,s*.4,s*.095,s*.047);c.fill();c.stroke();
  c.fillStyle=shade(col,.4);c.fillRect(-s*.13,-s*.085,s*.025,s*.085);c.fillRect(s*.1,-s*.085,s*.025,s*.085);
}
/* costume-specific chest / back art */
function costumeDeco(c,o,s,t,lw,back){
  const d=o.deco;c.lineWidth=lw;c.strokeStyle=INK;
  if(o.emblem&&!back){c.save();c.translate(0,s*.06);c.fillStyle='#FFC531';c.beginPath();c.moveTo(0,s*.0);c.lineTo(s*.075,s*.07);c.lineTo(0,s*.14);c.lineTo(-s*.075,s*.07);c.closePath();c.fill();c.stroke();
    if(o.emblem==='bat'){c.fillStyle='#22252E';batPath(c,0,s*.075,s*.06);c.fill();}
    else if(o.emblem==='k')txt(c,'ک',0,s*.075,Math.max(6,Math.round(s*.09)),o.shirt,null,FONT_D);
    else{c.fillStyle='#fff';c.beginPath();c.moveTo(-s*.03,s*.045);c.lineTo(s*.03,s*.045);c.lineTo(s*.024,s*.1);c.lineTo(-s*.024,s*.1);c.closePath();c.fill();c.stroke();c.fillStyle='#7A4A2E';c.fillRect(-s*.028,s*.06,s*.056,s*.015);}c.restore();}
  if(back){
    if(d==='robe'){c.fillStyle='#FFE14D';starPath(c,-s*.06,s*.1,s*.03);c.fill();starPath(c,s*.08,s*.02,s*.022);c.fill();}
    if(d==='zap'){c.fillStyle='#FFE14D';c.beginPath();c.moveTo(s*.04,-s*.02);c.lineTo(-s*.05,s*.1);c.lineTo(0,s*.1);c.lineTo(-s*.04,s*.2);c.lineTo(s*.07,s*.06);c.lineTo(s*.02,s*.06);c.closePath();c.fill();c.stroke();}
    if(d==='ninja'){c.strokeStyle='rgba(255,255,255,.15)';c.beginPath();c.moveTo(-s*.12,-s*.04);c.lineTo(s*.12,s*.16);c.stroke();}
    return;}
  switch(d){
    case 'paw':c.fillStyle='rgba(255,255,255,.85)';ell(c,0,s*.08,s*.035,s*.03);c.fill();for(let i=-1;i<=1;i++){circ(c,i*s*.032,s*.035-Math.abs(i)*-s*.008,s*.014);c.fill();}break;
    case 'panda':c.strokeStyle='#B9C2C9';c.beginPath();c.moveTo(0,-s*.05);c.lineTo(0,s*.28);c.stroke();c.fillStyle='#2B2D42';for(let i=0;i<2;i++){circ(c,s*.0,s*(.05+i*.09),s*.016);c.fill();}
      c.fillStyle='#2B2D42';rr(c,-s*.07,s*.15,s*.05,s*.04,s*.015);c.fill();break;
    case 'skate':c.fillStyle='#FFE14D';circ(c,0,s*.08,s*.05);c.fill();c.stroke();c.fillStyle=INK;circ(c,-s*.017,s*.07,s*.007);c.fill();circ(c,s*.017,s*.07,s*.007);c.fill();
      c.beginPath();c.arc(0,s*.083,s*.025,P*.15,P*.85);c.stroke();break;
    case 'chef':c.fillStyle='#fff';for(const sd of[-1,1])for(let i=0;i<3;i++){circ(c,sd*s*.055,s*(.03+i*.07),s*.014);c.fill();c.stroke();}break;
    case 'ninja':c.strokeStyle='#4E5370';c.lineWidth=lw*1.2;c.beginPath();c.moveTo(-s*.1,-s*.07);c.lineTo(s*.07,s*.15);c.moveTo(s*.1,-s*.07);c.lineTo(-s*.01,s*.07);c.stroke();
      c.fillStyle='#B9C2C9';c.strokeStyle=INK;c.lineWidth=lw;starPath(c,s*.11,s*.2,s*.03,4,.4);c.fill();c.stroke();break;
    case 'bolt':c.fillStyle='#FFE14D';c.beginPath();c.moveTo(s*.02,-s*.03);c.lineTo(-s*.03,s*.08);c.lineTo(s*.005,s*.08);c.lineTo(-s*.015,s*.18);c.lineTo(s*.035,s*.05);c.lineTo(s*.0,s*.05);c.closePath();c.fill();c.stroke();break;
    case 'disco':c.fillStyle='#fff';for(const sd of[-1,1]){c.beginPath();c.moveTo(0,-s*.06);c.lineTo(sd*s*.16,-s*.08);c.lineTo(sd*s*.07,s*.06);c.closePath();c.fill();c.stroke();}break;
    case 'astro':c.fillStyle='#B9C2C9';rr(c,-s*.08,s*.03,s*.16,s*.1,s*.02);c.fill();c.stroke();['#E5484D','#FFC531','#62C784'].forEach((q,i)=>{c.fillStyle=q;circ(c,(i-1)*s*.045,s*.065,s*.016);c.fill();});
      c.fillStyle='#5EC8F7';rr(c,-s*.05,s*.095,s*.1,s*.022,s*.01);c.fill();c.fillStyle='#3D7DD8';circ(c,-s*.14,s*.03,s*.028);c.fill();c.stroke();c.fillStyle='#FFC531';ell(c,-s*.14,s*.03,s*.04,s*.01,-.4);c.fill();break;
    case 'utility':c.fillStyle='#D99100';for(let i=-2;i<=2;i++)if(i){rr(c,i*s*.055-s*.02,s*.17,s*.04,s*.05,s*.01);c.fill();c.stroke();}break;
    case 'zap':c.fillStyle='#FFE14D';c.beginPath();c.moveTo(s*.06,-s*.04);c.lineTo(-s*.07,s*.1);c.lineTo(-s*.005,s*.1);c.lineTo(-s*.06,s*.22);c.lineTo(s*.09,s*.05);c.lineTo(s*.02,s*.05);c.closePath();c.fill();c.stroke();break;
    case 'plate':c.fillStyle='#C9D3DB';rr(c,-s*.13,-s*.02,s*.26,s*.17,s*.06);c.fill();c.stroke();c.fillStyle='rgba(255,255,255,.5)';rr(c,-s*.1,s*.0,s*.06,s*.1,s*.03);c.fill();
      {const k=(Math.sin(t*3)+1)/2;c.fillStyle='rgba(94,200,247,'+(.25+k*.3)+')';circ(c,0,s*.065,s*.06);c.fill();c.fillStyle='#5EC8F7';starPath(c,0,s*.065,s*.045);c.fill();c.stroke();}break;
    case 'web':{c.save();c.beginPath();c.moveTo(-s*.15,-s*.07);c.quadraticCurveTo(-s*.25,s*.1,-s*.2,s*.27);c.lineTo(s*.2,s*.27);c.quadraticCurveTo(s*.25,s*.1,s*.15,-s*.07);c.closePath();c.clip();
      c.strokeStyle='rgba(255,255,255,.55)';c.lineWidth=Math.max(1,s*.008);const cx=0,cy=s*.07;for(let i=0;i<8;i++){const a=i/8*TAU;c.beginPath();c.moveTo(cx,cy);c.lineTo(cx+Math.cos(a)*s*.3,cy+Math.sin(a)*s*.3);c.stroke();}
      for(const r of[.05,.1,.16]){c.beginPath();for(let i=0;i<=8;i++){const a=i/8*TAU;if(i)c.quadraticCurveTo(cx+Math.cos(a-P/8)*s*r*.8,cy+Math.sin(a-P/8)*s*r*.8,cx+Math.cos(a)*s*r,cy+Math.sin(a)*s*r);else c.moveTo(cx+s*r,cy);}c.stroke();}c.restore();
      c.fillStyle='#fff';circ(c,0,s*.07,s*.025);c.fill();c.stroke();break;}
    case 'robe':c.strokeStyle='#FFC531';c.lineWidth=lw*1.3;c.beginPath();c.moveTo(-s*.11,-s*.07);c.lineTo(0,s*.08);c.lineTo(s*.11,-s*.07);c.stroke();c.strokeStyle=INK;c.lineWidth=lw;
      c.fillStyle='#FFE14D';starPath(c,s*.1,s*.15,s*.028);c.fill();starPath(c,-s*.12,s*.05,s*.02);c.fill();break;
    case 'queen':c.strokeStyle='#FFC531';c.lineWidth=lw*1.4;c.beginPath();c.moveTo(-s*.12,-s*.07);c.lineTo(0,s*.12);c.lineTo(s*.12,-s*.07);c.stroke();c.strokeStyle=INK;c.lineWidth=lw;
      c.fillStyle='#fff';for(let i=-3;i<=3;i++){circ(c,i*s*.024,-s*.05+Math.abs(i)*-s*.006+s*.015,s*.011);c.fill();}c.fillStyle='#E5484D';circ(c,0,s*.0,s*.02);c.fill();c.stroke();break;
    case 'samurai':c.fillStyle='#F4F6F8';for(const sd of[-1,1]){c.beginPath();c.moveTo(sd*s*.11,-s*.075);c.lineTo(sd*s*.05,-s*.075);c.lineTo(-sd*s*.06,s*.12);c.lineTo(-sd*s*.0,s*.13);c.closePath();c.fill();c.stroke();}break;
  }
  if(o.sash){c.fillStyle=o.belt;c.beginPath();c.moveTo(s*.12,s*.18);c.lineTo(s*.17,s*.18);c.lineTo(s*.2,s*.32);c.lineTo(s*.14,s*.3);c.closePath();c.fill();c.stroke();}
}
function batPath(c,x,y,w){const P2=[[-1,-.25],[-.62,-.1],[-.42,-.32],[-.2,-.1],[-.1,-.42],[0,-.26],[.1,-.42],[.2,-.1],[.42,-.32],[.62,-.1],[1,-.25],[.72,.12],[.42,.06],[.22,.3],[0,.14],[-.22,.3],[-.42,.06],[-.72,.12]];
  c.beginPath();P2.forEach((p,i)=>i?c.lineTo(x+p[0]*w,y+p[1]*w):c.moveTo(x+p[0]*w,y+p[1]*w));c.closePath();}
function drawScarfFly(c,o,s,t,lw,back){
  const sd=back?1:-1,col=o.scarfFly;c.save();c.fillStyle=col;c.lineWidth=lw;c.strokeStyle=INK;c.lineJoin='round';c.beginPath();c.moveTo(0,-s*.09);
  const pts=[];for(let i=1;i<=5;i++){const k=i/5;pts.push([sd*s*(.08+k*.38),-s*(.08+k*.05)+Math.sin(t*9-i*1.1)*s*.03*k]);}
  pts.forEach(p=>c.lineTo(p[0],p[1]-s*.025));for(let i=pts.length-1;i>=0;i--)c.lineTo(pts[i][0],pts[i][1]+s*.025);c.lineTo(0,-s*.03);c.closePath();c.fill();c.stroke();c.restore();
}
function drawPauldrons(c,s,lw,col){
  c.lineWidth=lw;c.strokeStyle=INK;for(const sd of[-1,1]){for(let i=0;i<2;i++){c.fillStyle=col?(i?shade(col,-.15):col):i?'#A93226':'#C0392B';c.save();c.translate(sd*s*(.19+i*.012),s*(-.03+i*.05));c.rotate(sd*.35);rr(c,-s*.07,-s*.03,s*.14,s*.06,s*.02);c.fill();c.stroke();c.restore();}
    c.fillStyle='#FFC531';circ(c,sd*s*.18,-s*.04,s*.012);c.fill();}
}

/* ---------------- Person ---------------- */
function drawPerson(c,x,y,s,o){
  if(typeof o.hairCol==='string'&&o.hairCol.indexOf('gradient')>=0){const m=o.hairCol.match(/#[0-9a-fA-F]{6}/g)||['#4A2A21'];o=Object.assign({},o,{hairCol:m[0],hairTip:m[1]||m[0]});}
  if(o.outfit&&COSTUME[o.outfit])o=Object.assign({},o,{apron:null},COSTUME[o.outfit](o,o.tint||o.shirt),{cost:o.outfit});
  if(o.acc&&ACC[o.acc])o=Object.assign({},o,ACC[o.acc](o));
  const t=o.t||0,dir=o.dir==null?P/2:o.dir,fx=Math.cos(dir),fy=Math.sin(dir);
  s*=(o.big||1)*(o.kid?.8:1);
  const dress=o.outfit==='dress',hood=o.outfit==='hoodie'||!!o.hoodie;
  const back=fy<-.55,walk=!!o.walking;
  const bob=walk?Math.abs(Math.sin(t*11))*s*.05:Math.sin(t*2.4+(o.seed||0))*s*.012;
  const lw=Math.max(1,s*.032);
  c.save();c.translate(x,y);
  if(o.alpha!=null&&o.alpha<1)c.globalAlpha=Math.max(0,o.alpha);
  if(o.flip)c.scale(-1,1);
  if(o.rot)c.rotate(o.rot);
  if(o.sq)c.scale(1+o.sq,1-o.sq);
  if(!o.noShadow&&!o.rot){c.fillStyle='rgba(15,25,35,.2)';ell(c,0,s*.4,s*.25,s*.065);c.fill();}
  c.translate(0,-bob);
  c.lineWidth=lw;c.strokeStyle=INK;c.lineJoin='round';c.lineCap='round';
  const k=walk?Math.sin(t*11)*s*.045:0,sway=Math.sin(t*2.6+(o.seed||0))*s*.012+(walk?Math.sin(t*11)*s*.022:0);
  const bw=o.belly?1.3:1,bb=o.belly?1.1:1;
  const bodyP=()=>{c.beginPath();c.moveTo(-s*.15,-s*.07);c.quadraticCurveTo(-s*.25*bw,s*.1,-s*.2*bb,s*.27);c.quadraticCurveTo(0,s*(o.belly?.33:.31),s*.2*bb,s*.27);c.quadraticCurveTo(s*.25*bw,s*.1,s*.15,-s*.07);c.closePath();};
  // things hanging behind the body (front view)
  if(o.scarfFly&&!back)drawScarfFly(c,o,s,t,lw,false);
  if(!back){if(o.cape)drawCape(c,o,s,sway,true);if(o.tail)drawTail(c,o,s,t,false);if(o.guitar)drawGuitar(c,s,lw,false);if(o.pack)drawPack(c,s,false);c.lineWidth=lw;c.strokeStyle=INK;}
  // legs + shoes
  if(o.gown){}
  else if(dress){c.fillStyle=o.skin;rr(c,-s*.095,s*.2+k*.5,s*.07,s*.17,s*.03);c.fill();c.stroke();rr(c,s*.025,s*.2-k*.5,s*.07,s*.17,s*.03);c.fill();c.stroke();}
  else if(o.flare){c.fillStyle=o.pants||'#34405A';for(const[lx,dk]of[[-s*.0675,k*.5],[s*.0675,-k*.5]]){c.beginPath();c.moveTo(lx-s*.048,s*.19+dk);c.lineTo(lx+s*.048,s*.19+dk);c.lineTo(lx+s*.08,s*.365+dk);c.lineTo(lx-s*.08,s*.365+dk);c.closePath();c.fill();c.stroke();}}
  else{
    if(o.shorts){c.fillStyle=o.skin;rr(c,-s*.105,s*.2+k*.5,s*.075,s*.17,s*.03);c.fill();c.stroke();rr(c,s*.03,s*.2-k*.5,s*.075,s*.17,s*.03);c.fill();c.stroke();
      c.fillStyle=o.pants;rr(c,-s*.12,s*.19+k*.5,s*.1,s*.1,s*.03);c.fill();c.stroke();rr(c,s*.02,s*.19-k*.5,s*.1,s*.1,s*.03);c.fill();c.stroke();
      if(o.kneepads){c.fillStyle=o.kneepads;rr(c,-s*.11,s*.29+k*.5,s*.085,s*.045,s*.015);c.fill();c.stroke();rr(c,s*.025,s*.29-k*.5,s*.085,s*.045,s*.015);c.fill();c.stroke();}}
    else{c.fillStyle=o.pants||'#34405A';
      rr(c,-s*.115,s*.19+k*.5,s*.095,s*.18,s*.04);c.fill();c.stroke();rr(c,s*.02,s*.19-k*.5,s*.095,s*.18,s*.04);c.fill();c.stroke();
      if(o.ripped&&!back){c.fillStyle=o.skin;ell(c,-s*.07,s*.28+k*.5,s*.026,s*.012);c.fill();c.stroke();}
      if(o.check){c.save();c.beginPath();c.rect(-s*.12,s*.18,s*.24,s*.2);c.clip();c.fillStyle='rgba(255,255,255,.22)';for(let yy=0;yy<5;yy++)for(let xx=0;xx<6;xx++)if((xx+yy)%2)c.fillRect(-s*.12+xx*s*.04,s*.19+yy*s*.04,s*.04,s*.04);c.restore();}
      if(o.wraps){c.strokeStyle='#D9C3A0';c.lineWidth=Math.max(1,s*.014);for(const[lx,dk]of[[-s*.0675,k*.5],[s*.0675,-k*.5]])for(let i=0;i<3;i++){c.beginPath();c.moveTo(lx-s*.045,s*(.27+i*.03)+dk);c.lineTo(lx+s*.045,s*(.29+i*.03)+dk);c.stroke();}c.strokeStyle=INK;c.lineWidth=lw;}}
  }
  if(o.bootH&&!o.gown){c.fillStyle=o.boot||INK;rr(c,-s*.12,s*.29+k*.5,s*.105,s*.085,s*.03);c.fill();c.stroke();rr(c,s*.015,s*.29-k*.5,s*.105,s*.085,s*.03);c.fill();c.stroke();}
  c.fillStyle=o.boot||INK;ell(c,-s*.075,s*.375+k*.5,s*.078,s*.037);c.fill();if(o.boot)c.stroke();ell(c,s*.075,s*.375-k*.5,s*.078,s*.037);c.fill();if(o.boot)c.stroke();
  // long coat skirt / gown
  if(o.coat){c.fillStyle=o.coat;c.beginPath();c.moveTo(-s*.19,s*.12);c.lineTo(s*.19,s*.12);c.quadraticCurveTo(s*.24,s*.22,s*.25+sway*.5,s*.31);c.lineTo(-s*.25+sway*.5,s*.31);c.quadraticCurveTo(-s*.24,s*.22,-s*.19,s*.12);c.closePath();c.fill();c.stroke();
    c.beginPath();c.moveTo(back?0:s*.02,s*.2);c.lineTo((back?0:s*.04)+sway*.5,s*.31);c.stroke();}
  if(o.gown){c.fillStyle=o.gown;const gp=()=>{c.beginPath();c.moveTo(-s*.17,s*.08);c.lineTo(s*.17,s*.08);c.quadraticCurveTo(s*.29,s*.24,s*.3+sway,s*.355);c.quadraticCurveTo(sway,s*.4,-s*.3+sway,s*.355);c.quadraticCurveTo(-s*.29,s*.24,-s*.17,s*.08);c.closePath();};
    gp();c.fill();c.stroke();c.save();gp();c.clip();
    if(o.stars){c.fillStyle='#FFE14D';for(let i=0;i<5;i++){starPath(c,(hsh(i+2)-.5)*s*.44+sway*.5,s*(.16+hsh(i+8)*.16),s*(.018+hsh(i)*.01));c.fill();}}
    c.strokeStyle=o.gownTrim||shade(o.gown,.3);c.lineWidth=s*.022;c.beginPath();c.moveTo(-s*.32+sway,s*.34);c.quadraticCurveTo(sway,s*.385,s*.32+sway,s*.34);c.stroke();c.restore();c.lineWidth=lw;c.strokeStyle=INK;}
  // body
  const tc=back?(o.jacket||o.tvest):null;
  const g=c.createLinearGradient(0,-s*.06,0,s*.3);g.addColorStop(0,tc||o.shirt);g.addColorStop(1,tc?shade(tc,-.18):(o.shirt2||shade(o.shirt,-.15)));
  if(hood){c.fillStyle=o.shirt2||shade(o.shirt,-.15);ell(c,0,-s*.07,s*.17,s*.07);c.fill();c.stroke();}
  c.fillStyle=g;bodyP();c.fill();c.stroke();
  if(o.stripes&&!back){c.save();bodyP();c.clip();c.fillStyle=o.stripes;for(let yy=-s*.045;yy<s*.32;yy+=s*.065)c.fillRect(-s*.3,yy,s*.6,s*.026);c.restore();bodyP();c.stroke();}
  if(o.sequins){c.save();bodyP();c.clip();for(let i=0;i<26;i++){const k2=(Math.sin(t*4+i*1.3)+1)/2;c.fillStyle='rgba(255,255,255,'+(.2+k2*.45)+')';circ(c,(hsh(i)-.5)*s*.42,-s*.06+hsh(i+7)*s*.34,s*.012);c.fill();}c.restore();}
  if(dress){c.fillStyle=g;c.beginPath();c.moveTo(-s*.17,s*.12);c.lineTo(s*.17,s*.12);c.quadraticCurveTo(s*.28,s*.24,s*.27,s*.31);c.quadraticCurveTo(0,s*.36,-s*.27,s*.31);c.quadraticCurveTo(-s*.28,s*.24,-s*.17,s*.12);c.closePath();c.fill();c.stroke();
    c.fillStyle='rgba(255,255,255,.55)';for(let i=-2;i<=2;i++){circ(c,i*s*.09,s*.27,s*.018);c.fill();}}
  const belt=()=>{if(!o.belt)return;c.save();bodyP();c.clip();c.fillStyle=o.belt;rr(c,-s*.3,s*.165,s*.6,s*.05,s*.01);c.fill();c.stroke();c.restore();
    if(o.buckle||o.cost==='hero'||o.cost==='detective'){c.fillStyle=o.buckle?'#C9A227':shade(o.belt,-.25);if(!back){rr(c,-s*.03,s*.16,s*.06,s*.06,s*.012);c.fill();c.stroke();}}};
  if(!back){
    if(hood){c.fillStyle=o.shirt2||shade(o.shirt,-.15);rr(c,-s*.1,s*.13,s*.2,s*.09,s*.03);c.fill();c.stroke();c.beginPath();c.moveTo(-s*.035,-s*.05);c.lineTo(-s*.045,s*.06);c.moveTo(s*.035,-s*.05);c.lineTo(s*.045,s*.06);c.stroke();
      c.fillStyle='#fff';circ(c,-s*.045,s*.065,s*.012);c.fill();circ(c,s*.045,s*.065,s*.012);c.fill();}
    if(o.overall){c.fillStyle=o.overall;rr(c,-s*.14,s*.06,s*.28,s*.22,s*.04);c.fill();c.stroke();c.beginPath();c.moveTo(-s*.1,s*.07);c.lineTo(-s*.12,-s*.05);c.moveTo(s*.1,s*.07);c.lineTo(s*.12,-s*.05);c.lineWidth=s*.03;c.strokeStyle=o.overall;c.stroke();c.lineWidth=lw;c.strokeStyle=INK;
      c.fillStyle='#FFC531';circ(c,-s*.1,s*.09,s*.018);c.fill();circ(c,s*.1,s*.09,s*.018);c.fill();}
    if(o.vest){c.fillStyle='#FFE14D';c.fillRect(-s*.17,s*.08,s*.34,s*.035);c.fillRect(-s*.18,s*.17,s*.36,s*.035);}
    if(o.apron){c.fillStyle=o.apron;rr(c,-s*.12,s*.0,s*.24,s*.26,s*.05);c.fill();c.stroke();c.beginPath();c.moveTo(-s*.06,s*.14);c.lineTo(s*.06,s*.14);c.stroke();
      c.fillStyle=o.goldApron?'#fff':'#FFC531';heartPath(c,0,s*.075,s*.03);c.fill();
      if(o.goldApron){c.strokeStyle='rgba(255,255,255,.55)';c.lineWidth=s*.015;c.beginPath();c.moveTo(-s*.08,s*.03);c.lineTo(-s*.08,s*.2);c.stroke();c.strokeStyle=INK;c.lineWidth=lw;}}
    if(!hood&&!dress&&!o.overall&&!o.noCollar){c.fillStyle='#fff';c.beginPath();c.moveTo(-s*.085,-s*.065);c.lineTo(0,s*.015);c.lineTo(s*.085,-s*.065);c.lineTo(s*.04,-s*.075);c.lineTo(0,-s*.03);c.lineTo(-s*.04,-s*.075);c.closePath();c.fill();c.stroke();}
    if(o.tie){c.fillStyle=o.tie;c.beginPath();c.moveTo(-s*.03,-s*.02);c.lineTo(s*.03,-s*.02);c.lineTo(s*.035,s*.14);c.lineTo(0,s*.18);c.lineTo(-s*.035,s*.14);c.closePath();c.fill();c.stroke();
      if(o.tiePat==='dots'){c.save();c.clip();c.fillStyle='#FFE14D';for(let i=0;i<6;i++){circ(c,(i%2?.012:-.012)*s,s*(.01+i*.03),s*.009);c.fill();}c.restore();}}
    if(o.jacket)drawJacket(c,o,s,lw,bodyP,t);
    if(o.tvest)drawTVest(c,o,s,lw,bodyP);
    belt();
    if(o.bowtie){const by=s*.085;c.fillStyle=o.bowtie;for(const sd of[-1,1]){c.beginPath();c.moveTo(0,by);c.lineTo(sd*s*.065,by-s*.035);c.lineTo(sd*s*.065,by+s*.035);c.closePath();c.fill();c.stroke();}circ(c,0,by,s*.018);c.fill();c.stroke();}
    if(o.pocket){c.fillStyle=o.pocket;c.beginPath();c.moveTo(s*.1,s*.05);c.lineTo(s*.16,s*.05);c.lineTo(s*.15,s*.02);c.lineTo(s*.13,s*.035);c.lineTo(s*.115,s*.015);c.closePath();c.fill();c.stroke();}
    if(o.scarf2)drawScarf2(c,o,s,lw,false,t);
    costumeDeco(c,o,s,t,lw,false);
    if(o.badge){c.fillStyle='#FFC531';starPath(c,-s*.1,s*.05,s*.04);c.fill();c.stroke();}
    if(o.crown&&o.hair==='kiana'&&(o.mess||0)<.6&&(!o.cost||o.cost==='hoodie')){c.fillStyle='#FFC531';starPath(c,s*.1,s*.1,s*.03);c.fill();}
    if(o.cape){c.fillStyle='#FFC531';for(const sd of[-1,1]){circ(c,sd*s*.1,-s*.06,s*.022);c.fill();c.stroke();}
      if(o.capeEdge==='ermine'){c.fillStyle='#fff';for(const sd of[-1,1]){ell(c,sd*s*.14,-s*.055,s*.075,s*.045,sd*.3);c.fill();c.stroke();c.fillStyle=INK;ell(c,sd*s*.15,-s*.055,s*.007,s*.013);c.fill();c.fillStyle='#fff';}}}
  }else{
    belt();
    if(o.scarf2)drawScarf2(c,o,s,lw,true,t);
    costumeDeco(c,o,s,t,lw,true);
  }
  if(o.sparkle){for(let i=0;i<4;i++){const k2=(Math.sin(t*5+i*1.7)+1)/2;c.fillStyle='#fff';starPath(c,(hsh(i+20)-.5)*s*.36,s*(-.02+hsh(i+30)*.26),s*(.012+k2*.022),4,.3);c.fill();}}
  // arms
  const arms=o.arms||'down',sk=o.skin,sc=o.sleeve||(o.jacket&&o.jstyle!=='fur'&&o.jstyle!=='vest'?o.jacket:o.shirt),aw=s*.085,sw=walk?Math.sin(t*11)*s*.04:Math.sin(t*2.4)*s*.006;
  const hand=(hx,hy)=>handAt(c,hx,hy,s*.055,o.glove||sk);
  let hl=null,hrp=null;
  const front=['up','wave','drink','zombie','shrug','point'].includes(arms);
  const drawArms=()=>{c.lineWidth=lw;
  if(o.tied){/* arms hidden behind ropes */}
  else if(arms==='up'){const w=Math.sin(t*10)*s*.02;limb(c,-s*.15,-s*.02,-s*.3,-s*.38+w,aw,sc);limb(c,s*.15,-s*.02,s*.3,-s*.38-w,aw,sc);hl=[-s*.3,-s*.4+w];hrp=[s*.3,-s*.4-w];}
  else if(arms==='hold'){limb(c,-s*.16,0,-s*.08,s*.12,aw,sc);limb(c,s*.16,0,s*.08,s*.12,aw,sc);hl=[-s*.07,s*.12];hrp=[s*.07,s*.12];}
  else if(arms==='drink'){limb(c,-s*.16,0,-s*.24,s*.2+sw,aw,sc);limb3(c,s*.16,0,s*.22,s*.05,s*.07,-s*.2,aw,sc);hl=[-s*.24,s*.2];hrp=[s*.07,-s*.2];}
  else if(arms==='hips'){limb3(c,-s*.16,0,-s*.3,s*.08,-s*.19,s*.16,aw,sc);limb3(c,s*.16,0,s*.3,s*.08,s*.19,s*.16,aw,sc);hl=[-s*.19,s*.16];hrp=[s*.19,s*.16];}
  else if(arms==='zombie'){const w=Math.sin(t*3)*s*.02;limb(c,-s*.15,-s*.02,-s*.24,-s*.1+w,aw,sc);limb(c,s*.15,-s*.02,s*.24,-s*.12-w,aw,sc);hl=[-s*.25,-s*.1+w];hrp=[s*.25,-s*.12-w];}
  else if(arms==='wave'){const w=Math.sin(t*12)*s*.05;limb(c,-s*.16,0,-s*.24,s*.2,aw,sc);limb(c,s*.15,-s*.02,s*.32+w,-s*.32,aw,sc);hl=[-s*.24,s*.2];hrp=[s*.32+w,-s*.34];}
  else if(arms==='shrug'){limb3(c,-s*.16,0,-s*.28,s*.04,-s*.34,-s*.1,aw,sc);limb3(c,s*.16,0,s*.28,s*.04,s*.34,-s*.1,aw,sc);hl=[-s*.34,-s*.11];hrp=[s*.34,-s*.11];}
  else if(arms==='point'){limb(c,-s*.16,0,-s*.24,s*.2,aw,sc);limb(c,s*.15,-s*.01,s*.38,-s*.06,aw,sc);hl=[-s*.24,s*.2];hrp=[s*.39,-s*.06];}
  else{limb(c,-s*.16,0,-s*.24,s*.19+sw,aw,sc);limb(c,s*.16,0,s*.24,s*.19-sw,aw,sc);hl=[-s*.24,s*.19+sw];hrp=[s*.24,s*.19-sw];}
  if(hl&&o.watch){const dx=hl[0]+s*.16,dy=hl[1],L=Math.hypot(dx,dy)||1;c.fillStyle=o.watch;c.lineWidth=lw;c.strokeStyle=INK;circ(c,hl[0]-dx/L*s*.06,hl[1]-dy/L*s*.06,s*.032);c.fill();c.stroke();
    c.fillStyle='#fff';circ(c,hl[0]-dx/L*s*.06,hl[1]-dy/L*s*.06,s*.014);c.fill();}
  if(hl){hand(hl[0],hl[1]);hand(hrp[0],hrp[1]);}
  if(o.over==='pauldron')drawPauldrons(c,s,lw,o.pauldron);
  c.strokeStyle=INK;c.lineWidth=lw;};
  if(!front)drawArms();
  if(o.scarfFly&&back)drawScarfFly(c,o,s,t,lw,true);
  if(back){if(o.cape)drawCape(c,o,s,sway,false);if(o.pack)drawPack(c,s,true);if(o.guitar)drawGuitar(c,s,lw,true);if(o.tail)drawTail(c,o,s,t,true);c.lineWidth=lw;c.strokeStyle=INK;}
  // head
  const hr=s*.33,hy=-s*.31,hoodOn=o.hood&&o.hood!=='astro';
  // back hair layers
  c.lineWidth=lw;c.strokeStyle=INK;c.fillStyle=o.hairCol;
  if(hoodOn&&o.hood==='bat'&&o.hair==='kiana')girlBack(c,Object.assign({},o,{crown:false,ahoge:false,mess:0}),hr,hy,t,lw,back);
  if(hoodOn)hoodBack(c,o,hr,hy,lw,t);
  else if(o.hair==='kiana')girlBack(c,o,hr,hy,t,lw,back);
  else if(o.hair==='spiky')boyBack(c,o,hr,hy,t,lw);
  else if(o.hair==='bun'){hairUnion(c,lw,o.hairCol,[c=>circ(c,0,hy-hr*1.0,hr*.42),c=>ell(c,0,hy+hr*.05,hr*1.08,hr*1.02)],hairInk(o));c.fillStyle='#FFC531';rr(c,-hr*.3,hy-hr*.75,hr*.6,hr*.12,hr*.05);c.fill();c.stroke();}
  else if(o.hair==='short'||o.hair==='slick'){hairUnion(c,lw,o.hairCol,[c=>ell(c,0,hy-hr*.05,hr*1.06,hr*1.02)],hairInk(o));}
  else if(o.hair==='scarf'){c.fillStyle=o.scarf;c.beginPath();c.moveTo(-hr*1.15,hy);c.bezierCurveTo(-hr*1.3,hy-hr*1.45,hr*1.3,hy-hr*1.45,hr*1.15,hy);c.quadraticCurveTo(hr*1.25,hy+hr*1.1,0,hy+hr*1.25);c.quadraticCurveTo(-hr*1.25,hy+hr*1.1,-hr*1.15,hy);c.closePath();c.fill();c.stroke();
    c.fillStyle='rgba(255,255,255,.55)';for(let i=0;i<7;i++){circ(c,-hr*.8+i*hr*.27,hy+hr*(.6+(i%2)*.25),hr*.06);c.fill();}}
  // ears
  if(o.hair!=='scarf'&&!hoodOn){c.fillStyle=o.skin;circ(c,-hr*.96,hy+hr*.12,hr*.17);c.fill();c.stroke();circ(c,hr*.96,hy+hr*.12,hr*.17);c.fill();c.stroke();
    if(o.earrings&&!back){c.fillStyle='#FFC531';circ(c,-hr*.98,hy+hr*.38,hr*.08);c.fill();c.stroke();circ(c,hr*.98,hy+hr*.38,hr*.08);c.fill();c.stroke();}}
  c.fillStyle=o.skin;circ(c,0,hy,hr);c.fill();c.stroke();
  if(back){
    if(hoodOn){c.fillStyle=o.hoodCol;circ(c,0,hy,hr*1.1);c.fill();}
    else if(o.hair==='bald'){c.fillStyle=o.hairCol;ell(c,0,hy+hr*.35,hr*.8,hr*.3);c.fill();}
    else if(o.hair==='cap'){if(o.capHair){c.fillStyle=o.hairCol;c.save();circ(c,0,hy,hr);c.clip();ell(c,0,hy+hr*.62,hr*1.0,hr*.42);c.fill();c.strokeStyle=hairInk(o);c.lineWidth=lw*.8;c.stroke();c.restore();c.lineWidth=lw;circ(c,0,hy,hr);c.stroke();}}
    else if(o.hair!=='helmet'){c.fillStyle=o.hair==='scarf'?o.scarf:o.hair==='kiana'?hairPaint(c,o,hr,hy):o.hair==='spiky'?hairPaint(c,o,hr,hy,true):o.hairCol;if(o.hair==='scarf'){circ(c,0,hy,hr*1.01);c.fill();c.stroke();}else{circ(c,0,hy,hr+lw*.6);c.fill();c.strokeStyle=hairInk(o);c.lineWidth=lw*.8;c.stroke();c.strokeStyle=INK;c.lineWidth=lw;}
      if(o.hair==='kiana'&&(o.mess||0)<.55&&!['twin','loose','braid','top'].includes(o.hstyle)){c.fillStyle=o.tie2||'#FF5A8C';ell(c,0,hy-hr*.55,hr*.14,hr*.12);c.fill();c.stroke();}}
  }else{
    drawFace(c,o,hr,hy,fx,fy,t,lw);
    c.lineWidth=lw;c.strokeStyle=INK;
    if(hoodOn)hoodFront(c,o,hr,hy,lw,t);
    else if(o.hair==='kiana')girlFront(c,o,hr,hy,t,lw);
    else if(o.hair==='spiky')boyFront(c,o,hr,hy,t,lw);
    else if(o.hair==='bald'){c.fillStyle=o.hairCol;c.strokeStyle=hairInk(o);c.lineWidth=lw*.8;ell(c,-hr*.88,hy-hr*.05,hr*.2,hr*.32);c.fill();c.stroke();ell(c,hr*.88,hy-hr*.05,hr*.2,hr*.32);c.fill();c.stroke();c.strokeStyle=INK;c.lineWidth=lw;
      c.fillStyle='rgba(255,255,255,.5)';ell(c,-hr*.3,hy-hr*.62,hr*.22,hr*.1,-.4);c.fill();}
    else if(o.hair==='scarf'){c.fillStyle=o.hairCol;ell(c,0,hy-hr*.62,hr*.6,hr*.2);c.fill();c.strokeStyle=hairInk(o);c.lineWidth=lw*.8;c.stroke();c.strokeStyle=INK;c.lineWidth=lw;
      c.fillStyle=o.scarf;c.beginPath();c.arc(0,hy+hr*.05,hr*1.12,P*1.02,P*1.98);c.arc(0,hy+hr*.05,hr*.92,P*1.92,P*1.08,true);c.closePath();c.fill();c.stroke();
      c.beginPath();c.moveTo(-hr*.25,hy+hr*.95);c.lineTo(0,hy+hr*1.25);c.lineTo(hr*.25,hy+hr*.95);c.closePath();c.fill();c.stroke();}
    else if(o.hair==='short'||o.hair==='slick'||o.hair==='bun')capFront(c,o.hairCol,hr,hy,lw,o.hair,hairInk(o));
    if(o.hair==='cap'&&o.capHair){c.fillStyle=o.hairCol;c.strokeStyle=hairInk(o);c.lineWidth=lw*.8;for(const sd of[-1,1]){ell(c,sd*hr*.88,hy-hr*.12,hr*.16,hr*.3,sd*.15);c.fill();c.stroke();}c.strokeStyle=INK;c.lineWidth=lw;}
    if(o.shades==='head')shadesOnHead(c,hr,hy,lw);
  }
  if(o.hair==='helmet'){c.fillStyle=o.helmet;c.beginPath();c.arc(0,hy-hr*.12,hr*1.04,P,TAU);c.closePath();c.fill();c.stroke();
    rr(c,-hr*1.22,hy-hr*.2,hr*2.44,hr*.2,hr*.08);c.fill();c.stroke();c.beginPath();c.moveTo(0,hy-hr*1.15);c.lineTo(0,hy-hr*.2);c.stroke();
    c.fillStyle='rgba(255,255,255,.45)';ell(c,-hr*.45,hy-hr*.7,hr*.2,hr*.1,-.5);c.fill();}
  if(o.hair==='cap'){c.fillStyle=o.cap;ell(c,0,hy-hr*.72,hr*1.0,hr*.42);c.fill();c.stroke();rr(c,-hr*.95,hy-hr*.72,hr*1.9,hr*.38,hr*.06);c.fill();c.stroke();
    c.fillStyle=INK;ell(c,0,hy-hr*.3,hr*.9,hr*.14);c.fill();
    if(o.capBadge==='moon'){crescent(c,-hr*.02,hy-hr*.6,hr*.2,'#FFE58A');}
    else{c.fillStyle='#FFC531';starPath(c,0,hy-hr*.62,hr*.17);c.fill();c.stroke();}}
  // head accessories
  if(o.band)drawBand(c,o,hr,hy,lw,t,back);
  if(o.catears)drawCatEars(c,hr,hy,lw);
  if(o.flower)drawFlower(c,(back?1:-1)*hr*.72,hy-hr*.66,hr*.22,lw);
  if(o.phones)drawPhones(c,o.phones,hr,hy,lw);
  let A={x:hr*.28,y:hy-hr*1.08,r:.25,sc:1,top:hy-hr*1.2};
  if(o.hood==='cat'||o.hood==='bat')A={x:0,y:hy-hr*1.16,r:0,sc:.85,top:hy-hr*1.22};
  if(o.hat)A=drawHat(c,o,hr,hy,lw,t,back);
  // kiana extras: crown + bird nest
  if(o.crown&&A.sc>0){const m=o.mess||0,rs=o.realCrown?1.15:1;if(m<.6||o.hat)drawCrown(c,A.x,A.y,hr*.33*A.sc*rs,A.r,o.realCrown);else drawCrown(c,hr*.92,hy-hr*.62,hr*.3*rs,1.15,o.realCrown);}
  if(o.bird&&!back){const ny=A.top;c.fillStyle='#8B5A2B';c.lineWidth=lw;for(let i=0;i<9;i++){c.save();c.translate(-hr*.35,ny);c.rotate(-.6+i*.15);c.fillRect(-hr*.35,-hr*.03,hr*.7,hr*.06);c.restore();}
    drawBird(c,-hr*.35,ny-hr*.22,hr*.42,t,{});}
  if(o.goggles&&!back){c.lineWidth=lw;c.fillStyle='#3D4A5C';rr(c,-hr*1.0,hy-hr*.78,hr*2,hr*.16,hr*.06);c.fill();c.stroke();for(const sd of[-1,1]){c.fillStyle='#FFC531';circ(c,sd*hr*.36,hy-hr*.72,hr*.24);c.fill();c.stroke();c.fillStyle='#8FE3FF';circ(c,sd*hr*.36,hy-hr*.72,hr*.15);c.fill();c.fillStyle='#fff';circ(c,sd*hr*.36-hr*.05,hy-hr*.77,hr*.05);c.fill();}}
  if(o.sugar){c.lineWidth=lw;for(let i=0;i<3;i++){const bx=-hr*.42+i*hr*.42,by=hy-hr*1.42-(i===1?hr*.2:0);c.fillStyle='#fff';rr(c,bx-hr*.17,by-hr*.17,hr*.34,hr*.34,hr*.05);c.fill();c.stroke();c.fillStyle='#E7E1D8';c.fillRect(bx-hr*.1,by-hr*.1,hr*.08,hr*.08);}}
  if(o.hood==='astro')drawBubble(c,hr,hy,lw,t);
  c.lineWidth=lw;c.strokeStyle=INK;
  if(front)drawArms();
  if(o.tied){c.strokeStyle='#B07A3B';c.lineWidth=s*.035;for(let i=0;i<3;i++){c.beginPath();c.moveTo(-s*.25,s*(.0+i*.09));c.quadraticCurveTo(0,s*(.05+i*.09),s*.25,s*(.0+i*.09));c.stroke();}c.strokeStyle=INK;c.lineWidth=lw;}
  // held item
  if(o.held&&hrp){const hx=o.arms==='hold'?0:hrp[0],hy2=o.arms==='hold'?s*.08:hrp[1]-s*.04;drawHeld(c,o.held,hx,hy2,s,t);}
  c.restore();
}

/* ---------------- Actor effects (cutscenes) ---------------- */
function drawActorFx(c,a,x,y,s,t){
  const hy=y-s*.31*(a.big||1),hr=s*.33*(a.big||1);
  c.save();c.lineWidth=Math.max(1,s*.025);c.strokeStyle=INK;
  if(a.zzz)for(let i=0;i<3;i++){const k=(t*.6+i/3)%1;c.globalAlpha=1-k;txt(c,'z',x+hr*(.7+k*.9),hy-hr*(.6+k*1.6),Math.round(hr*(.35+k*.4)),'#fff',INK,FONT_B);}
  c.globalAlpha=1;
  if(a.sweat){c.fillStyle='#8FD8FF';const k=(t*1.5)%1;c.beginPath();const sx=x+hr*.95,sy=hy-hr*.4+k*hr*.4;c.moveTo(sx,sy-hr*.22);c.quadraticCurveTo(sx+hr*.15,sy,sx,sy+hr*.06);c.quadraticCurveTo(sx-hr*.15,sy,sx,sy-hr*.22);c.fill();c.stroke();}
  if(a.dizzy)for(let i=0;i<4;i++){const ang=t*5+i*TAU/4,px=x+Math.cos(ang)*hr*1.1,py=hy-hr*1.05+Math.sin(ang)*hr*.3;c.fillStyle='#FFC531';starPath(c,px,py,hr*.17);c.fill();c.stroke();}
  if(a.hearts)for(let i=0;i<3;i++){const k=(t*.5+i/3)%1;c.globalAlpha=1-k;c.fillStyle='#FF4F86';heartPath(c,x+(i-1)*hr*.9+Math.sin(t*3+i)*hr*.2,hy-hr*(1+k*1.6),hr*.2);c.fill();c.stroke();}
  c.globalAlpha=1;
  if(a.vein){c.strokeStyle='#E5484D';c.lineWidth=hr*.08;const vx=x+hr*.6,vy=hy-hr*.75,q=hr*.16*(1+Math.sin(t*12)*.15);
    for(const[ax,ay]of[[1,1],[-1,1],[1,-1],[-1,-1]]){c.beginPath();c.moveTo(vx+ax*q*.4,vy+ay*q*1.2);c.quadraticCurveTo(vx+ax*q*.4,vy+ay*q*.4,vx+ax*q*1.2,vy+ay*q*.4);c.stroke();}}
  if(a.sparkle)for(let i=0;i<5;i++){const ang=i*TAU/5+t,rad=hr*(1.4+Math.sin(t*4+i)*.15),k=(Math.sin(t*6+i*2)+1)/2;c.fillStyle='#FFE14D';starPath(c,x+Math.cos(ang)*rad,hy+Math.sin(ang)*rad*.8,hr*(.1+k*.12),4,.3);c.fill();}
  if(a.steam)for(let i=0;i<4;i++){const k=(t*.9+i/4)%1;c.globalAlpha=(1-k)*.8;c.fillStyle='#fff';circ(c,x+(i%2?1:-1)*hr*(.5+k*.4),hy-hr*(1.1+k*1.2),hr*(.15+k*.25));c.fill();}
  c.globalAlpha=1;
  if(a.mark){txt(c,a.mark,x+hr*.9,hy-hr*1.3+Math.sin(t*8)*hr*.05,Math.round(hr*.9),a.mark==='!'?'#E5484D':'#fff',INK);}
  c.restore();
}

/* ---------------- Props ---------------- */
/* other files can add props/backgrounds: PROP_EXT.car=(c,a,x,y,s,t)=>{...}; BG_EXT.road=(c,W,H,st,t,o)=>{...} */
const PROP_EXT={},BG_EXT={},FG_EXT={};
function drawProp(c,a,x,y,s,t){
  if(PROP_EXT[a.prop]){c.save();PROP_EXT[a.prop](c,a,x,y,s,t);c.restore();return;}
  c.save();c.translate(x,y);if(a.alpha!=null)c.globalAlpha=Math.max(0,Math.min(1,a.alpha));if(a.rot)c.rotate(a.rot);
  c.lineWidth=Math.max(1.2,s*.012);c.strokeStyle=INK;c.lineJoin='round';
  switch(a.prop){
    case 'bed':{
      c.fillStyle='#B97A4E';rr(c,-s*.56,-s*.42,s*.1,s*.6,s*.03);c.fill();c.stroke();rr(c,s*.46,-s*.2,s*.08,s*.38,s*.03);c.fill();c.stroke();
      rr(c,-s*.5,-s*.03,s*.98,s*.17,s*.03);c.fill();c.stroke();
      c.fillStyle='#fff';rr(c,-s*.48,-s*.14,s*.94,s*.12,s*.05);c.fill();c.stroke();
      c.fillStyle='#FFF4F8';ell(c,-s*.35,-s*.16,s*.11,s*.06);c.fill();c.stroke();break;}
    case 'blanket':{
      c.fillStyle='#FF8FB5';c.beginPath();c.moveTo(-s*.12,-s*.04);c.quadraticCurveTo(-s*.13,-s*.2,s*.0,-s*.2);c.lineTo(s*.42,-s*.19);c.quadraticCurveTo(s*.5,-s*.17,s*.48,-s*.02);c.lineTo(s*.48,s*.04);c.lineTo(-s*.12,s*.04);c.closePath();c.fill();c.stroke();
      c.fillStyle='#fff';for(let i=0;i<4;i++){heartPath(c,s*.04+i*s*.11,-s*.1+(i%2)*s*.05,s*.022);c.fill();}break;}
    case 'clock':{
      const sh=a.ring?Math.sin(t*70)*s*.06:0;c.translate(sh,0);
      c.fillStyle='#E5484D';circ(c,-s*.32,-s*.42,s*.18);c.fill();c.stroke();circ(c,s*.32,-s*.42,s*.18);c.fill();c.stroke();
      c.beginPath();c.moveTo(-s*.3,s*.4);c.lineTo(-s*.4,s*.6);c.moveTo(s*.3,s*.4);c.lineTo(s*.4,s*.6);c.lineWidth=s*.06;c.stroke();c.lineWidth=Math.max(1.2,s*.03);
      c.fillStyle='#FF6B6E';circ(c,0,0,s*.5);c.fill();c.stroke();c.fillStyle='#fff';circ(c,0,0,s*.38);c.fill();c.stroke();
      {const a1=a.spin?t*a.spin:-P/2,a2=a.spin?t*a.spin/12:.25;c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(a1)*s*.28,Math.sin(a1)*s*.28);c.moveTo(0,0);c.lineTo(Math.cos(a2)*s*.2,Math.sin(a2)*s*.2);c.lineWidth=s*.05;c.stroke();}
      if(a.ring){c.lineWidth=s*.04;for(let i=1;i<=2;i++){c.beginPath();c.arc(0,0,s*(.6+i*.18),-P*.4,-P*.1);c.stroke();c.beginPath();c.arc(0,0,s*(.6+i*.18),-P*.9,-P*.6);c.stroke();}}
      break;}
    case 'bird':drawBird(c,0,0,s,t,{fly:a.fly,flip:a.flip});break;
    case 'teapot':{
      const col=a.col||'#E86A92';
      if(a.heli){c.save();c.translate(0,-s*.62);c.fillStyle='#555';c.fillRect(-s*.03,-s*.08,s*.06,s*.1);
        c.strokeStyle='rgba(40,40,50,.85)';c.lineWidth=s*.04;const k=Math.cos(t*30);c.beginPath();c.moveTo(-s*.75*k,-s*.08);c.lineTo(s*.75*k,-s*.08);c.stroke();c.restore();
        c.strokeStyle=INK;c.lineWidth=s*.03;c.beginPath();c.moveTo(-s*.4,s*.45);c.lineTo(-s*.45,s*.58);c.lineTo(s*.45,s*.58);c.lineTo(s*.4,s*.45);c.stroke();c.lineWidth=Math.max(1.2,s*.012);}
      c.fillStyle=col;c.beginPath();c.moveTo(s*.42,-s*.05);c.quadraticCurveTo(s*.75,-s*.05,s*.82,-s*.38);c.lineTo(s*.9,-s*.4);c.quadraticCurveTo(s*.82,s*.12,s*.4,s*.2);c.closePath();c.fill();c.stroke();
      c.lineWidth=s*.05;c.beginPath();c.arc(-s*.52,s*.02,s*.2,P*.5,P*1.5);c.stroke();c.lineWidth=Math.max(1.2,s*.012);
      c.fillStyle=col;ell(c,0,s*.05,s*.52,s*.45);c.fill();c.stroke();
      c.fillStyle='#fff';for(let i=0;i<6;i++){const ang=i/6*TAU;heartPath(c,Math.cos(ang)*s*.3,s*.08+Math.sin(ang)*s*.22,s*.04);c.fill();}
      c.fillStyle=shade(col,-.15);ell(c,0,-s*.36,s*.3,s*.08);c.fill();c.stroke();c.fillStyle='#FFC531';circ(c,0,-s*.46,s*.07);c.fill();c.stroke();
      if(!a.heli)for(let i=0;i<3;i++){const k=(t*.5+i/3)%1;c.globalAlpha=(1-k)*.7;c.fillStyle='#fff';circ(c,s*.9+Math.sin(t*2+i)*s*.05,-s*(.5+k*.6),s*(.06+k*.1));c.fill();}
      break;}
    case 'doors':{
      const cl=a.close==null?0:a.close,w=s*.5*cl;c.fillStyle='#C9D3DB';rr(c,-s*.5,-s*.7,w,s*1.4,0);c.fill();c.stroke();rr(c,s*.5-w,-s*.7,w,s*1.4,0);c.fill();c.stroke();break;}
    case 'cup':drawHeld(c,'cup',0,0,s*2,t);break;
    case 'logo':drawBankLogo(c,0,0,s*.5,t);break;
    case 'sun':{c.fillStyle='#FFE58A';for(let i=0;i<10;i++){c.save();c.rotate(i/10*TAU+t*.4);c.beginPath();c.moveTo(s*.55,-s*.08);c.lineTo(s*.8,0);c.lineTo(s*.55,s*.08);c.fill();c.restore();}circ(c,0,0,s*.5);c.fill();c.lineWidth=s*.04;c.stroke();
      for(const sd of[-1,1]){c.beginPath();c.arc(sd*s*.18,-s*.02,s*.08,P*1.1,P*1.9);c.stroke();}c.beginPath();c.arc(0,s*.12,s*.14,P*.15,P*.85);c.stroke();break;}
    case 'moon':{c.fillStyle='#FFF4C9';circ(c,0,0,s*.5);c.fill();c.lineWidth=s*.04;c.stroke();c.fillStyle='rgba(0,0,0,.08)';circ(c,-s*.15,-s*.1,s*.1);c.fill();circ(c,s*.18,s*.15,s*.07);c.fill();
      for(const sd of[-1,1]){c.beginPath();c.arc(sd*s*.18,s*.0,s*.07,P*.15,P*.85);c.stroke();}break;}
    case 'board':{const n=a.cards||0;c.fillStyle='#B07A3B';rr(c,-s*.55,-s*.38,s*1.1,s*.76,s*.04);c.fill();c.lineWidth=Math.max(1.5,s*.012);c.stroke();c.fillStyle='#D9A86A';rr(c,-s*.5,-s*.33,s*1,s*.66,s*.02);c.fill();
      const pts=[];for(let i=0;i<Math.min(n,12);i++){const px=-s*.38+(i%4)*s*.25+(hsh(i)-.5)*s*.05,py=-s*.2+Math.floor(i/4)*s*.21+(hsh(i+9)-.5)*s*.04;pts.push([px,py]);}
      c.strokeStyle='#D7263D';c.lineWidth=Math.max(1,s*.008);c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.stroke();c.strokeStyle=INK;c.lineWidth=Math.max(1,s*.008);
      pts.forEach((p,i)=>{c.save();c.translate(p[0],p[1]+s*.04);c.rotate((hsh(i+3)-.5)*.3);c.fillStyle=i===pts.length-1&&a.fresh?'#FFE58A':'#FFF6DA';c.fillRect(-s*.08,-s*.06,s*.16,s*.12);c.strokeRect(-s*.08,-s*.06,s*.16,s*.12);
        c.fillStyle='rgba(34,48,60,.35)';for(let k=0;k<3;k++)c.fillRect(-s*.06,-s*.03+k*s*.03,s*.12*(k===2?.6:1),s*.012);c.restore();c.fillStyle='#E5484D';circ(c,p[0],p[1]-s*.01,s*.015);c.fill();c.stroke();});
      break;}

    case 'teacup':drawHeld(c,'teacup',0,0,s*2,t);break;
    case 'note':drawHeld(c,'note',0,0,s*2,t);break;
    case 'plush':drawCupPlush(c,0,s*.5,s,t);break;
    case 'alien':drawToyAlien(c,0,s*.5,s*.6,t);break;
  }
  c.restore();
}

/* ---------------- Bank brand: sleepy coin in a night-cap ---------------- */
function drawBankLogo(c,x,y,r,t,o){
  o=o||{};t=t||0;c.save();c.translate(x,y);c.lineJoin='round';c.lineCap='round';const lw=Math.max(1.5,r*.09);c.lineWidth=lw;c.strokeStyle=INK;
  const bob=Math.sin(t*1.6)*r*.04;c.translate(0,bob);
  c.fillStyle='#FFC531';circ(c,0,0,r);c.fill();c.stroke();
  c.strokeStyle='#D99100';c.lineWidth=lw*.8;circ(c,0,0,r*.78);c.stroke();c.strokeStyle=INK;c.lineWidth=lw;
  for(const sd of[-1,1]){c.beginPath();c.arc(sd*r*.32,-r*.02,r*.15,P*.15,P*.85);c.stroke();}
  c.fillStyle='rgba(255,110,140,.45)';ell(c,-r*.52,r*.22,r*.13,r*.08);c.fill();ell(c,r*.52,r*.22,r*.13,r*.08);c.fill();
  c.beginPath();c.arc(0,r*.28,r*.14,P*.1,P*.9);c.stroke();
  c.fillStyle='#2BB59A';c.beginPath();c.moveTo(-r*.92,-r*.36);c.quadraticCurveTo(-r*.2,-r*1.3,r*.6,-r*1.62);c.quadraticCurveTo(r*.55,-r*.9,r*.92,-r*.4);c.quadraticCurveTo(0,-r*.68,-r*.92,-r*.36);c.closePath();c.fill();c.stroke();
  c.fillStyle='#fff';rr(c,-r*.98,-r*.52,r*1.96,r*.24,r*.12);c.fill();c.stroke();circ(c,r*.66,-r*1.66,r*.16);c.fill();c.stroke();
  if(!o.noZ){for(let i=0;i<3;i++){const k=(t*.5+i/3)%1;c.globalAlpha=1-k;txt(c,'z',r*(1+k*.6),-r*(.6+k*.9),Math.round(r*(.3+k*.25)),'#fff',INK,FONT_B);}c.globalAlpha=1;}
  c.restore();
}
function drawSign(c,x,y,w,t){
  const h=w*.26;c.save();c.lineWidth=Math.max(2,w*.012);c.strokeStyle=INK;
  c.fillStyle='#163B47';rr(c,x-w/2,y-h/2,w,h,h*.3);c.fill();c.stroke();
  drawBankLogo(c,x+w*.36,y+h*.08,h*.3,t,{noZ:true});
  txt(c,bankName(),x-w*.08,y-h*.08,Math.round(h*.42),'#FFC531',INK);
  txtFit(c,bankSlogan(),x-w*.08,y+h*.27,w*.66,Math.round(h*.17),'#BDEFE3',null,FONT_B);
  c.restore();
}
/* bank texts are read from levels.js (BANK) at draw time */
function bankName(){return(typeof BANK!=='undefined'&&BANK.name)||'بلاف بانک';}
function bankSlogan(i){if(typeof BANK==='undefined')return'پولت پیش ما لالا می‌کنه!';if(i==null||!BANK.slogans||!BANK.slogans.length)return BANK.slogan;return BANK.slogans[((i%BANK.slogans.length)+BANK.slogans.length)%BANK.slogans.length];}
/* centred text shrunk to fit maxW */
function txtFit(c,s,x,y,maxW,size,col,stroke,font){c.save();c.font=size+'px '+(font||FONT_D);const w=c.measureText(s).width;c.restore();
  txt(c,s,x,y,w>maxW?Math.max(5,Math.floor(size*maxW/w)):size,col,stroke,font);}
const FA_D='۰۱۲۳۴۵۶۷۸۹';function faNum(n){return String(n).replace(/\d/g,d=>FA_D[d]);}
function drawPoster(c,x,y,w,text,col){
  if(text==null||typeof text==='number')text=bankSlogan(text==null?0:text);
  const h=w*.62;c.save();c.lineWidth=Math.max(1.5,w*.02);c.strokeStyle=INK;c.fillStyle=col||'#FFF6DA';rr(c,x-w/2,y-h/2,w,h,w*.06);c.fill();c.stroke();
  drawBankLogo(c,x,y-h*.08,h*.2,0,{noZ:true});txtFit(c,text,x,y+h*.32,w*.9,Math.round(w*.09),INK,null,FONT_B);c.restore();
}
/* ---------------- Kiana's toys (bedroom) ---------------- */
/* smiling coffee-cup plush with little arms; (x,y) = bottom centre, r = size */
function drawCupPlush(c,x,y,r,t){
  c.save();c.translate(x,y);c.lineWidth=Math.max(1,r*.06);c.strokeStyle=INK;c.lineJoin='round';c.lineCap='round';
  const wv=Math.sin(t*2.2)*.25;
  c.fillStyle='#FFF1E0';c.save();c.translate(r*.5,-r*.55);c.rotate(-.4-wv);ell(c,r*.12,0,r*.15,r*.1);c.fill();c.stroke();c.restore();
  c.save();c.translate(-r*.5,-r*.55);c.rotate(.4);ell(c,-r*.12,0,r*.15,r*.1);c.fill();c.stroke();c.restore();
  c.lineWidth=r*.16;c.strokeStyle=INK;c.beginPath();c.arc(r*.45,-r*.42,r*.18,-P*.45,P*.45);c.stroke();c.lineWidth=r*.09;c.strokeStyle='#FF8FB5';c.stroke();
  c.lineWidth=Math.max(1,r*.06);c.strokeStyle=INK;
  c.fillStyle='#FF8FB5';c.beginPath();c.moveTo(-r*.5,-r*.82);c.lineTo(r*.5,-r*.82);c.quadraticCurveTo(r*.52,-r*.1,r*.36,0);c.lineTo(-r*.36,0);c.quadraticCurveTo(-r*.52,-r*.1,-r*.5,-r*.82);c.closePath();c.fill();c.stroke();
  c.fillStyle='#FFF1E0';c.beginPath();c.moveTo(-r*.49,-r*.62);c.lineTo(r*.49,-r*.62);c.lineTo(r*.47,-r*.36);c.lineTo(-r*.47,-r*.36);c.closePath();c.fill();
  c.fillStyle='#7A4A2E';ell(c,0,-r*.82,r*.5,r*.13);c.fill();c.stroke();c.fillStyle='#FFF1E0';heartPath(c,0,-r*.85,r*.08);c.fill();
  c.fillStyle=INK;for(const sd of[-1,1]){c.beginPath();c.arc(sd*r*.17,-r*.47,r*.06,P*1.1,P*1.9);c.lineWidth=r*.05;c.stroke();}
  c.fillStyle='rgba(255,80,125,.55)';ell(c,-r*.3,-r*.4,r*.08,r*.045);c.fill();ell(c,r*.3,-r*.4,r*.08,r*.045);c.fill();
  c.lineWidth=r*.05;c.beginPath();c.arc(0,-r*.42,r*.08,P*.15,P*.85);c.stroke();
  c.strokeStyle='rgba(255,255,255,.7)';c.lineWidth=r*.04;c.setLineDash([r*.06,r*.05]);c.beginPath();c.moveTo(-r*.36,-r*.12);c.lineTo(r*.36,-r*.12);c.stroke();c.setLineDash([]);
  c.restore();
}
/* little green toy alien: blocky building-brick minifigure, antenna, big round eyes; (x,y) = bottom centre */
function drawToyAlien(c,x,y,r,t){
  c.save();c.translate(x,y);c.lineWidth=Math.max(1,r*.055);c.strokeStyle=INK;c.lineJoin='round';
  const G='#7ED957',GD='#5DB83A';
  c.fillStyle='#3D7DD8';rr(c,-r*.26,-r*.42,r*.25,r*.42,r*.03);c.fill();c.stroke();rr(c,r*.01,-r*.42,r*.25,r*.42,r*.03);c.fill();c.stroke();
  c.fillStyle='#2E5FA8';rr(c,-r*.27,-r*.5,r*.54,r*.1,r*.02);c.fill();c.stroke();
  c.fillStyle='#F4F6F8';c.beginPath();c.moveTo(-r*.24,-r*.92);c.lineTo(r*.24,-r*.92);c.lineTo(r*.3,-r*.5);c.lineTo(-r*.3,-r*.5);c.closePath();c.fill();c.stroke();
  c.fillStyle='#FFC531';starPath(c,0,-r*.7,r*.09);c.fill();c.stroke();
  const wv=Math.sin(t*3)*.15;
  for(const sd of[-1,1]){c.save();c.translate(sd*r*.27,-r*.86);c.rotate(sd*(.25+(sd>0?wv:0)));c.fillStyle='#F4F6F8';rr(c,-r*.07,0,r*.14,r*.3,r*.06);c.fill();c.stroke();
    c.fillStyle=G;c.beginPath();c.arc(0,r*.36,r*.075,P*1.75,P*1.25);c.lineTo(0,r*.36);c.closePath();c.fill();c.stroke();c.restore();}
  c.fillStyle=GD;rr(c,-r*.09,-r*.98,r*.18,r*.08,r*.02);c.fill();c.stroke();
  c.strokeStyle=INK;c.lineWidth=r*.05;c.beginPath();c.moveTo(0,-r*1.45);c.quadraticCurveTo(r*.05,-r*1.6,r*.02+Math.sin(t*4)*r*.04,-r*1.72);c.stroke();
  c.fillStyle='#FF8FB5';c.lineWidth=Math.max(1,r*.05);circ(c,r*.02+Math.sin(t*4)*r*.04,-r*1.74,r*.065);c.fill();c.stroke();
  c.fillStyle=G;rr(c,-r*.3,-r*1.45,r*.6,r*.48,r*.14);c.fill();c.stroke();
  c.fillStyle='rgba(255,255,255,.3)';rr(c,-r*.24,-r*1.4,r*.12,r*.2,r*.05);c.fill();
  for(const sd of[-1,1]){c.fillStyle='#fff';circ(c,sd*r*.13,-r*1.22,r*.11);c.fill();c.stroke();c.fillStyle=INK;circ(c,sd*r*.12,-r*1.2,r*.065);c.fill();c.fillStyle='#fff';circ(c,sd*r*.1,-r*1.23,r*.025);c.fill();}
  c.strokeStyle=INK;c.lineWidth=r*.04;c.beginPath();c.arc(0,-r*1.08,r*.07,P*.2,P*.8);c.stroke();
  c.restore();
}
/* ---------------- Café bits: menu cups + one shelf treasure per unlocked coffee ---------------- */
function cafeCoffees(){if(typeof COFFEES==='undefined')return[];
  return Object.entries(COFFEES).filter(([k])=>{try{return typeof coffeeOpen==='function'?!!coffeeOpen(k):true;}catch(e){return true;}});}
function miniCup(c,x,y,r,col){ // small coloured cup centred on (x,y)
  c.save();c.lineWidth=Math.max(1,r*.18);c.strokeStyle=INK;c.lineJoin='round';
  c.beginPath();c.arc(x+r*.72,y-r*.05,r*.3,-P/2,P/2);c.stroke();
  c.fillStyle='#fff';c.beginPath();c.moveTo(x-r*.8,y-r*.55);c.lineTo(x+r*.8,y-r*.55);c.lineTo(x+r*.6,y+r*.6);c.lineTo(x-r*.6,y+r*.6);c.closePath();c.fill();c.stroke();
  c.fillStyle=col;c.fillRect(x-r*.72,y-r*.2,r*1.44,r*.45);ell(c,x,y-r*.55,r*.8,r*.2);c.fill();c.stroke();
  c.restore();
}
function crescent(c,x,y,r,col){c.save();circ(c,x,y,r);c.clip();c.beginPath();c.arc(x,y,r,0,TAU);c.moveTo(x+r*1.3,y-r*.2);c.arc(x+r*.45,y-r*.2,r*.85,0,TAU);c.fillStyle=col;c.fill('evenodd');c.restore();}
function drawCoin(c,x,y,r){c.save();c.fillStyle='#FFC531';c.strokeStyle=INK;c.lineWidth=Math.max(1,r*.22);circ(c,x,y,r);c.fill();c.stroke();c.strokeStyle='#D99100';c.lineWidth=Math.max(1,r*.15);circ(c,x,y,r*.55);c.stroke();c.restore();}
/* (x,y) = bottom centre on the shelf, r = item size */
function cafeItem(c,key,x,y,r,col,t){
  c.save();c.translate(x,y);c.lineWidth=Math.max(1,r*.07);c.strokeStyle=INK;c.lineJoin='round';c.lineCap='round';
  switch(key){
    case 'drip':{ // glass carafe
      c.fillStyle='rgba(220,240,255,.75)';c.beginPath();c.moveTo(-r*.3,-r*.95);c.lineTo(r*.3,-r*.95);c.lineTo(r*.42,0);c.lineTo(-r*.42,0);c.closePath();c.fill();c.stroke();
      c.fillStyle=col;c.beginPath();c.moveTo(-r*.37,-r*.4);c.lineTo(r*.37,-r*.4);c.lineTo(r*.42,0);c.lineTo(-r*.42,0);c.closePath();c.fill();c.stroke();
      c.fillStyle=INK;rr(c,-r*.34,-r*1.05,r*.68,r*.14,r*.05);c.fill();break;}
    case 'espresso':{ // moka pot
      c.fillStyle='#C9D3DB';c.beginPath();c.moveTo(-r*.3,0);c.lineTo(-r*.24,-r*.45);c.lineTo(r*.24,-r*.45);c.lineTo(r*.3,0);c.closePath();c.fill();c.stroke();
      c.beginPath();c.moveTo(-r*.24,-r*.5);c.lineTo(-r*.3,-r*.95);c.lineTo(r*.3,-r*.95);c.lineTo(r*.24,-r*.5);c.closePath();c.fill();c.stroke();
      c.fillStyle=INK;c.beginPath();c.moveTo(r*.3,-r*.85);c.lineTo(r*.5,-r*.8);c.lineTo(r*.42,-r*.45);c.stroke();circ(c,0,-r*1.02,r*.07);c.fill();break;}
    case 'latte':{ // layered glass
      c.fillStyle='#fff';rr(c,-r*.28,-r*1.0,r*.56,r*1.0,r*.08);c.fill();c.stroke();
      c.save();rr(c,-r*.28,-r*1.0,r*.56,r*1.0,r*.08);c.clip();c.fillStyle=col;c.fillRect(-r,-r*.55,r*2,r*.3);c.fillStyle='#F5E6C8';c.fillRect(-r,-r*.25,r*2,r*.3);c.restore();
      c.strokeStyle='#FF8FB5';c.lineWidth=r*.06;heartPath(c,0,-r*.85,r*.1);c.stroke();break;}
    case 'cappu':{ // cup with a cloud of foam
      miniCup(c,0,-r*.35,r*.42,col);c.fillStyle='#fff';c.lineWidth=Math.max(1,r*.06);
      for(const[dx,dy,q]of[[-.18,-.78,.2],[.05,-.88,.24],[.24,-.76,.18]]){circ(c,r*dx,r*dy,r*q);c.fill();c.stroke();}
      c.fillStyle='#fff';ell(c,0,-r*.72,r*.35,r*.1);c.fill();break;}
    case 'mocha':{ // cup + chocolate bar
      miniCup(c,-r*.12,-r*.35,r*.4,col);c.save();c.translate(r*.3,-r*.45);c.rotate(.25);c.fillStyle='#5A2E1A';rr(c,-r*.12,-r*.45,r*.24,r*.9,r*.04);c.fill();c.stroke();
      c.strokeStyle='rgba(255,255,255,.3)';for(let i=1;i<4;i++){c.beginPath();c.moveTo(-r*.12,-r*.45+i*r*.22);c.lineTo(r*.12,-r*.45+i*r*.22);c.stroke();}c.restore();break;}
    case 'glace':{ // ghost ice-cream coffee
      c.fillStyle='rgba(220,240,255,.8)';c.beginPath();c.moveTo(-r*.3,-r*.6);c.lineTo(r*.3,-r*.6);c.lineTo(r*.2,0);c.lineTo(-r*.2,0);c.closePath();c.fill();c.stroke();
      c.fillStyle=col;c.fillRect(-r*.25,-r*.4,r*.5,r*.3);c.fillStyle='#fff';c.beginPath();c.arc(0,-r*.68,r*.3,P,TAU);c.lineTo(r*.3,-r*.55);
      for(let i=0;i<3;i++)c.quadraticCurveTo(r*(.2-i*.2),-r*.45,r*(.1-i*.2),-r*.55);c.closePath();c.fill();c.stroke();
      c.fillStyle=INK;circ(c,-r*.1,-r*.72,r*.045);c.fill();circ(c,r*.1,-r*.72,r*.045);c.fill();break;}
    case 'iced':{ // tall glass, cubes, straw
      c.strokeStyle='#E5484D';c.lineWidth=r*.08;c.beginPath();c.moveTo(r*.08,-r*.6);c.lineTo(r*.28,-r*1.18);c.stroke();c.lineWidth=Math.max(1,r*.07);c.strokeStyle=INK;
      c.fillStyle='rgba(220,240,255,.8)';rr(c,-r*.28,-r*1.0,r*.56,r*1.0,r*.06);c.fill();c.stroke();c.fillStyle=col;c.fillRect(-r*.24,-r*.7,r*.48,r*.65);
      c.fillStyle='rgba(255,255,255,.8)';rr(c,-r*.2,-r*.8,r*.18,r*.18,r*.03);c.fill();rr(c,r*.02,-r*.62,r*.17,r*.17,r*.03);c.fill();break;}
    case 'turk':{ // copper cezve with long handle
      c.fillStyle='#C8783A';c.beginPath();c.moveTo(-r*.3,-r*.7);c.lineTo(r*.3,-r*.7);c.quadraticCurveTo(r*.18,-r*.45,r*.32,0);c.lineTo(-r*.32,0);c.quadraticCurveTo(-r*.18,-r*.45,-r*.3,-r*.7);c.closePath();c.fill();c.stroke();
      c.fillStyle='#8B5A2B';c.save();c.translate(r*.25,-r*.6);c.rotate(-.5);rr(c,0,-r*.05,r*.6,r*.1,r*.04);c.fill();c.stroke();c.restore();
      c.fillStyle='rgba(255,255,255,.35)';c.fillRect(-r*.2,-r*.5,r*.07,r*.35);break;}
    case 'moon':{ // glowing moon jar
      const gl=c.createRadialGradient(0,-r*.5,0,0,-r*.5,r*.9);gl.addColorStop(0,'rgba(190,200,255,.6)');gl.addColorStop(1,'rgba(190,200,255,0)');c.fillStyle=gl;circ(c,0,-r*.5,r*.9);c.fill();
      c.fillStyle='rgba(220,230,255,.7)';rr(c,-r*.32,-r*.95,r*.64,r*.95,r*.14);c.fill();c.stroke();c.fillStyle=INK;rr(c,-r*.26,-r*1.08,r*.52,r*.14,r*.04);c.fill();
      crescent(c,-r*.04,-r*.48,r*.26,'#FFF4C9');break;}
    case 'gold':{ // trophy cup
      const k=(Math.sin(t*3)+1)/2,gg=c.createLinearGradient(-r*.4,0,r*.4,0);gg.addColorStop(0,'#D99100');gg.addColorStop(.5,'#FFE58A');gg.addColorStop(1,'#D99100');c.fillStyle=gg;
      c.beginPath();c.arc(-r*.36,-r*.75,r*.14,P*.5,P*1.5,false);c.stroke();c.beginPath();c.arc(r*.36,-r*.75,r*.14,-P*.5,P*.5);c.stroke();
      c.beginPath();c.moveTo(-r*.36,-r*1.0);c.lineTo(r*.36,-r*1.0);c.quadraticCurveTo(r*.34,-r*.42,0,-r*.38);c.quadraticCurveTo(-r*.34,-r*.42,-r*.36,-r*1.0);c.closePath();c.fill();c.stroke();
      rr(c,-r*.08,-r*.4,r*.16,r*.22,r*.03);c.fill();c.stroke();rr(c,-r*.3,-r*.2,r*.6,r*.2,r*.05);c.fill();c.stroke();
      c.fillStyle='#fff';starPath(c,r*.25,-r*1.05,r*(.08+k*.08),4,.3);c.fill();break;}
    default:miniCup(c,0,-r*.4,r*.45,col);
  }
  c.restore();
}

/* ---------------- Backgrounds ---------------- */
function skyGrad(c,W,H,stops){const g=c.createLinearGradient(0,0,0,H);stops.forEach((s,i)=>g.addColorStop(i/(stops.length-1),s));c.fillStyle=g;c.fillRect(0,0,W,H);}
function cloud(c,x,y,r,col){c.fillStyle=col||'rgba(255,255,255,.9)';circ(c,x,y,r);c.fill();circ(c,x+r*.9,y+r*.15,r*.75);c.fill();circ(c,x-r*.9,y+r*.2,r*.7);c.fill();rr(c,x-r*1.5,y,r*3,r*.75,r*.35);c.fill();}
function floorBoards(c,W,y0,H,col,line){c.fillStyle=col;c.fillRect(0,y0,W,H-y0);c.strokeStyle=line;c.lineWidth=2;for(let y=y0+18;y<H;y+=22){c.beginPath();c.moveTo(0,y);c.lineTo(W,y);c.stroke();}
  for(let y=y0;y<H;y+=22)for(let x=((y/22)%2)*60;x<W;x+=120){c.beginPath();c.moveTo(x,y);c.lineTo(x,y+22);c.stroke();}}
function windowFrame(c,x,y,w,h,inner){c.fillStyle='#fff';rr(c,x-6,y-6,w+12,h+12,8);c.fill();c.lineWidth=3;c.strokeStyle=INK;c.stroke();c.save();rr(c,x,y,w,h,4);c.clip();inner();c.restore();
  c.strokeStyle='#fff';c.lineWidth=5;c.beginPath();c.moveTo(x+w/2,y);c.lineTo(x+w/2,y+h);c.moveTo(x,y+h/2);c.lineTo(x+w,y+h/2);c.stroke();c.strokeStyle=INK;c.lineWidth=3;rr(c,x,y,w,h,4);c.stroke();}

const THEMES={
  lobby:{floorA:'#D6F0E5',floorB:'#C8E9DB',wall:'#3D7480',wallTop:'#4F8D99',wallFace:'#2C5862',deco:'#2BB59A',bg:'#24414A'},
  archive:{floorA:'#EEDCC0',floorB:'#E4CFAF',wall:'#6E4B3A',wallTop:'#896250',wallFace:'#523629',deco:'#C98B5A',bg:'#3A2A22'},
  build:{floorA:'#D8D5D0',floorB:'#CCC8C2',wall:'#D98F25',wallTop:'#EFAE45',wallFace:'#A96D14',deco:'#FFC531',bg:'#3B342C',stripes:true},
  night:{floorA:'#5A4A80',floorB:'#514372',wall:'#231C3D',wallTop:'#322855',wallFace:'#181230',deco:'#8E6BE0',bg:'#120E22',night:true},
  tea:{floorA:'#F6DCD3',floorB:'#EECDC2',wall:'#7E3A48',wallTop:'#9A5060',wallFace:'#5E2A34',deco:'#36A985',bg:'#3A1D24'}
};

function drawBG(c,name,W,H,st,t,o){
  if(BG_EXT[name]){c.save();BG_EXT[name](c,W,H,st,t,o||{});c.restore();return;}
  o=o||{};const fy=st.y+st.h*.76,sx=st.x,sw=st.w;
  c.save();c.lineJoin='round';c.lineCap='round';
  switch(name){
  case 'street':{
    const n=o.night||0;skyGrad(c,W,H,n>.5?['#141A44','#3B2F6B','#7A4A7A']:['#FF9E6B','#FFC48B','#FFE3B0']);
    if(n>.01){c.fillStyle='rgba(20,24,70,'+(n*.6)+')';c.fillRect(0,0,W,H);c.fillStyle='#fff';for(let i=0;i<40;i++){c.globalAlpha=n*(.4+hsh(i)*.6);circ(c,hsh(i)*W,hsh(i+40)*fy*.6,1.2);c.fill();}c.globalAlpha=1;}
    for(let i=0;i<9;i++){const bw=sw*.22,bx=sx-sw*.3+i*bw*1.1,bh=st.h*(.18+hsh(i+30)*.2);c.fillStyle=n>.5?'#22264A':'#C9A3A0';c.fillRect(bx,fy-bh,bw,bh);c.fillStyle=n>.5?'#FFE58A':'rgba(255,255,255,.55)';c.beginPath();for(let wy=fy-bh+8;wy<fy-10;wy+=16)for(let wx=bx+6;wx<bx+bw-8;wx+=13)if(hsh(wx*.3+wy)>.4)c.rect(wx,wy,6,8);c.fill();}
    const bx=sx-sw*.05,bw=sw*.42;c.fillStyle='#3D7480';c.fillRect(bx,st.y+st.h*.18,bw,fy-st.y-st.h*.18);c.lineWidth=3;c.strokeStyle=INK;c.strokeRect(bx,st.y+st.h*.18,bw,fy-st.y-st.h*.18);
    for(let r=0;r<5;r++)for(let k=0;k<3;k++){c.fillStyle=n>.5?(hsh(r*3+k)>.5?'#FFE58A':'#24305A'):'#BDE8FF';rr(c,bx+bw*(.1+k*.3),st.y+st.h*(.22+r*.09),bw*.2,st.h*.05,3);c.fill();c.lineWidth=2;c.stroke();}
    drawSign(c,bx+bw*.5,st.y+st.h*.7,bw*.92,t);
    c.fillStyle=n>.5?'#3A3A50':'#8E9AA6';c.fillRect(0,fy,W,H-fy);c.fillStyle=n>.5?'#4A4A62':'#B6C0C9';c.fillRect(0,fy,W,10);
    for(let i=0;i<3;i++){const lx=sx+sw*(.55+i*.3);c.fillStyle=INK;c.fillRect(lx-3,fy-st.h*.22,6,st.h*.22);c.fillStyle=n>.3?'#FFE58A':'#E6E6E6';circ(c,lx,fy-st.h*.23,sw*.025);c.fill();c.lineWidth=2;c.strokeStyle=INK;c.stroke();
      if(n>.3){const gl=c.createRadialGradient(lx,fy-st.h*.2,0,lx,fy-st.h*.2,sw*.18);gl.addColorStop(0,'rgba(255,229,138,'+(.35*n)+')');gl.addColorStop(1,'rgba(255,229,138,0)');c.fillStyle=gl;circ(c,lx,fy-st.h*.2,sw*.18);c.fill();}}
    break;}
  case 'bedroom':{
    skyGrad(c,W,fy,['#FFD3E2','#F9BCD3']);
    c.fillStyle='rgba(255,255,255,.35)';for(let y=20;y<fy;y+=40)for(let x=(y/40%2)*20;x<W;x+=40){heartPath(c,x,y,4);c.fill();}
    windowFrame(c,sx+sw*.36,st.y+st.h*.1,sw*.4,st.h*.28,()=>{skyGrad(c,W,H,['#FFB36B','#FF8FB0','#9FD8FF']);c.fillStyle='#FFE58A';circ(c,sx+sw*.56,st.y+st.h*.36,sw*.09);c.fill();cloud(c,sx+sw*.45+Math.sin(t*.2)*10,st.y+st.h*.2,sw*.035);});
    c.fillStyle='#FF6F9F';for(const sd of[-1,1]){const cx=sx+sw*.56+sd*sw*.24,wv=Math.sin(t*1.2)*4;c.beginPath();c.moveTo(cx-sw*.05,st.y+st.h*.08);c.lineTo(cx+sw*.05,st.y+st.h*.08);c.quadraticCurveTo(cx+wv,st.y+st.h*.25,cx+sw*.04*-sd+wv,st.y+st.h*.42);c.lineTo(cx-sw*.04*sd,st.y+st.h*.42);c.closePath();c.fill();c.lineWidth=2.5;c.strokeStyle=INK;c.stroke();}
    c.fillStyle='#fff';rr(c,sx+sw*.04,st.y+st.h*.12,sw*.2,sw*.25,6);c.fill();c.lineWidth=3;c.strokeStyle=INK;c.stroke();
    drawHeld(c,'cup',sx+sw*.14,st.y+st.h*.12+sw*.1,sw*.6,t);txt(c,'قهوه = زندگی',sx+sw*.14,st.y+st.h*.12+sw*.2,Math.round(sw*.032),'#E03A72');
    floorBoards(c,W,fy,H,'#D9A273','rgba(120,70,30,.35)');
    c.fillStyle='#C9A0E8';ell(c,sx+sw*.4,fy+st.h*.12,sw*.3,st.h*.06);c.fill();c.lineWidth=3;c.strokeStyle=INK;c.stroke();
    {const shx=sx+sw*.74,shy=st.y+st.h*.5;c.fillStyle='#B97A4E';rr(c,shx,shy,sw*.24,st.h*.016,3);c.fill();c.lineWidth=2.5;c.strokeStyle=INK;c.stroke();
      c.fillStyle='#8B5A2B';c.fillRect(shx+sw*.02,shy+st.h*.016,sw*.018,st.h*.02);c.fillRect(shx+sw*.2,shy+st.h*.016,sw*.018,st.h*.02);
      drawCupPlush(c,shx+sw*.115,shy,sw*.125,t);}
    c.fillStyle='#B97A4E';rr(c,sx+sw*.04,fy-st.h*.12,sw*.18,st.h*.14,6);c.fill();c.lineWidth=3;c.strokeStyle=INK;c.stroke();
    drawToyAlien(c,sx+sw*.13,fy-st.h*.12,sw*.085,t);c.lineWidth=3;c.strokeStyle=INK;c.beginPath();c.moveTo(sx+sw*.06,fy-st.h*.05);c.lineTo(sx+sw*.2,fy-st.h*.05);c.stroke();
    if(o.night>0){c.fillStyle='rgba(18,16,60,'+(o.night*.62)+')';c.fillRect(0,0,W,H);
      c.save();rr(c,sx+sw*.36,st.y+st.h*.1,sw*.4,st.h*.28,4);c.clip();c.fillStyle='rgba(10,12,48,'+o.night+')';c.fillRect(0,0,W,H);
      c.fillStyle='rgba(255,255,255,'+o.night+')';for(let i=0;i<12;i++){circ(c,sx+sw*(.38+hsh(i)*.36),st.y+st.h*(.12+hsh(i+5)*.24),1.4);c.fill();}c.restore();}
    break;}
  case 'kitchen':{
    c.fillStyle='#BFE8DA';c.fillRect(0,0,W,H);
    c.strokeStyle='rgba(255,255,255,.6)';c.lineWidth=2;for(let y=0;y<fy;y+=30){c.beginPath();c.moveTo(0,y);c.lineTo(W,y);c.stroke();}for(let x=0;x<W;x+=30){c.beginPath();c.moveTo(x,0);c.lineTo(x,fy);c.stroke();}
    windowFrame(c,sx+sw*.58,st.y+st.h*.08,sw*.34,st.h*.22,()=>{skyGrad(c,W,H,['#FFC98B','#FFE6B5','#BFE6FF']);c.fillStyle='#FFE58A';circ(c,sx+sw*.7,st.y+st.h*.24,sw*.06);c.fill();});
    c.fillStyle='#fff';rr(c,sx+sw*.06,st.y+st.h*.1,sw*.4,st.h*.04,4);c.fill();c.lineWidth=3;c.strokeStyle=INK;c.stroke();
    ['#FF5A8C','#5EC8F7','#FFC531'].forEach((col,i)=>{c.fillStyle=col;rr(c,sx+sw*(.09+i*.12),st.y+st.h*.1-sw*.08,sw*.07,sw*.08,4);c.fill();c.stroke();});
    break;}
  case 'cafe':{
    const dark=o.closed?.45:0,CF=cafeCoffees(),lit=!o.closed;
    c.fillStyle='#8B5A3C';c.fillRect(0,0,W,fy);c.fillStyle='rgba(255,255,255,.04)';for(let x=0;x<W;x+=28)c.fillRect(x,0,14,fy);
    c.fillStyle='#6E4329';c.fillRect(0,fy-st.h*.26,W,st.h*.26);
    c.strokeStyle='rgba(0,0,0,.18)';c.lineWidth=3;for(let x=0;x<W;x+=34){c.beginPath();c.moveTo(x,fy-st.h*.26);c.lineTo(x,fy);c.stroke();}
    c.fillStyle='#4E2F1C';c.fillRect(0,fy-st.h*.265,W,st.h*.012);
    // chalk menu: only the coffees Kiana has unlocked
    {const bx=sx+sw*.035,by=st.y+st.h*.05,bw=sw*.44,bh=st.h*.36;
      c.fillStyle='#2E3B33';rr(c,bx,by,bw,bh,8);c.fill();c.lineWidth=6;c.strokeStyle='#B97A4E';c.stroke();c.lineWidth=2;c.strokeStyle=INK;rr(c,bx-3,by-3,bw+6,bh+6,10);c.stroke();
      txt(c,'منو',bx+bw/2,by+bh*.075,Math.round(sw*.048),'#fff');
      c.strokeStyle='rgba(255,255,255,.45)';c.lineWidth=1.5;c.beginPath();c.moveTo(bx+bw*.36,by+bh*.135);c.quadraticCurveTo(bx+bw*.5,by+bh*.16,bx+bw*.64,by+bh*.135);c.stroke();
      const list=CF.length?CF:[['drip',{name:'امریکانو',price:0,color:'#8B5A3C'}]],n=list.length;
      const top=by+bh*.17,rowH=Math.min(bh*.115,(bh*.8)/n),fs=Math.max(7,Math.round(Math.min(rowH*.7,sw*.036))),ir=Math.min(rowH*.3,sw*.02);
      const cR=bx+bw*.93,cL=bx+bw*.07;
      list.forEach(([key,k],i)=>{const yy=top+i*rowH+rowH/2;
        if(i)(c.strokeStyle='rgba(255,255,255,.08)',c.lineWidth=1,c.beginPath(),c.moveTo(cL,yy-rowH/2),c.lineTo(cR,yy-rowH/2),c.stroke());
        miniCup(c,cR-ir,yy,ir,k.color||'#8B5A3C');
        c.save();c.font=fs+'px '+FONT_B;c.textBaseline='middle';c.direction='rtl';c.textAlign='right';c.fillStyle='#F5E6C8';
        c.fillText(k.name,cR-ir*2.6,yy+1,bw*.86-ir*2.6-fs*2.6);
        if(k.beans){c.fillStyle='#FFE14D';starPath(c,cL+fs*.5,yy,fs*.45);c.fill();}
        else if(!k.price){c.fillStyle='#8BD3B7';c.font=Math.round(fs*.85)+'px '+FONT_B;c.textAlign='left';c.fillText('مجانی',cL,yy+1);}
        else{drawCoin(c,cL+fs*.38,yy,fs*.36);c.fillStyle='#FFE58A';c.direction='ltr';c.textAlign='left';c.fillText(faNum(k.price),cL+fs*.88,yy+1);}
        c.restore();});}
    // sign
    {const gx=sx+sw*.735,gy=st.y+st.h*.095,gw=sw*.46,gh=st.h*.075;
      c.strokeStyle=INK;c.lineWidth=2;c.beginPath();c.moveTo(gx-gw*.35,0);c.lineTo(gx-gw*.35,gy-gh/2);c.moveTo(gx+gw*.35,0);c.lineTo(gx+gw*.35,gy-gh/2);c.stroke();
      c.fillStyle='#5A1E35';rr(c,gx-gw/2,gy-gh/2,gw,gh,gh*.35);c.fill();c.lineWidth=3;c.stroke();
      if(lit){c.save();c.shadowColor='rgba(255,143,181,.9)';c.shadowBlur=10;}
      txtFit(c,'کافه هیرومن',gx+gw*.06,gy+gh*.04,gw*.72,Math.round(gh*.62),'#FF8FB5',lit?null:'#3A1020');if(lit)c.restore();
      miniCup(c,gx-gw*.38,gy,gh*.26,'#7A4A2E');
      if(CF.some(([k])=>k==='gold')){c.fillStyle='#FFE14D';for(const sd of[-1,1]){starPath(c,gx+sd*gw*.53,gy-gh*.3,gh*.18*(1+.2*Math.sin(t*4+sd)),4,.35);c.fill();}}}
    // lamps
    for(const lx of[sx+sw*.53,sx+sw*.97]){c.strokeStyle=INK;c.lineWidth=2;c.beginPath();c.moveTo(lx,0);c.lineTo(lx,st.y+st.h*.19);c.stroke();
      if(lit){const gl=c.createRadialGradient(lx,st.y+st.h*.22,0,lx,st.y+st.h*.22,sw*.14);gl.addColorStop(0,'rgba(255,225,130,.45)');gl.addColorStop(1,'rgba(255,225,130,0)');c.fillStyle=gl;circ(c,lx,st.y+st.h*.22,sw*.14);c.fill();}
      c.fillStyle=o.closed?'#666':'#FFD25E';c.beginPath();c.arc(lx,st.y+st.h*.21,sw*.035,P,TAU);c.fill();c.stroke();}
    // two shelves: one treasure per unlocked coffee
    {const x0=sx+sw*.555,x1=sx+sw*.955,ys=[st.y+st.h*.27,st.y+st.h*.385],per=5,step=(x1-x0)/per,ir=Math.min(step*.6,st.h*.05);
      for(const yy of ys){c.fillStyle='#B97A4E';rr(c,x0-sw*.02,yy,x1-x0+sw*.04,st.h*.018,3);c.fill();c.lineWidth=2.5;c.strokeStyle=INK;c.stroke();
        c.fillStyle='#8B5A2B';for(const bx2 of[x0+sw*.01,x1-sw*.03])c.fillRect(bx2,yy+st.h*.018,sw*.02,st.h*.02);}
      CF.forEach(([key,k],i)=>{if(i>=per*2)return;const sh=Math.floor(i/per),xx=x0+step*(i%per)+step/2;cafeItem(c,key,xx,ys[sh],ir,k.color||'#8B5A3C',t);});
      if(CF.length<per*2){c.globalAlpha=.35;c.fillStyle='#4E2F1C';for(let i=CF.length;i<per*2;i++){const sh=Math.floor(i/per),xx=x0+step*(i%per)+step/2;rr(c,xx-ir*.3,ys[sh]-ir*.5,ir*.6,ir*.5,3);c.fill();}c.globalAlpha=1;}}
    // wall extras that show up as Kiana's coffee collection grows
    {const has=k=>CF.some(q=>q[0]===k);
      if(has('cappu')){const cx2=sx+sw*.5,cy2=st.y+st.h*.47+Math.sin(t*1.2)*3;cloud(c,cx2,cy2,sw*.025,'rgba(255,255,255,.75)');}
      if(has('moon'))crescent(c,sx+sw*.05,st.y+st.h*.47,sw*.03,'rgba(255,244,201,.9)');
      if(has('turk')){c.fillStyle='#C8783A';for(let i=0;i<3;i++){c.save();c.translate(sx+sw*(.09+i*.07),st.y+st.h*.455);c.rotate(.2*(i-1));c.strokeStyle=INK;c.lineWidth=2;
        c.beginPath();c.moveTo(0,-st.h*.02);c.lineTo(0,0);c.stroke();ell(c,0,st.h*.012,sw*.018,sw*.012);c.fill();c.stroke();c.restore();}}}
    floorBoards(c,W,fy,H,'#5C3A26','rgba(0,0,0,.25)');
    if(o.closed){c.fillStyle='rgba(20,10,30,'+dark+')';c.fillRect(0,0,W,H);c.fillStyle='#fff';rr(c,sx+sw*.1,st.y+st.h*.42,sw*.22,sw*.1,6);c.fill();c.lineWidth=3;c.strokeStyle=INK;c.stroke();txt(c,'تعطیل',sx+sw*.21,st.y+st.h*.42+sw*.05,Math.round(sw*.05),'#E5484D');}
    if(o.evening){c.fillStyle='rgba(255,120,40,.15)';c.fillRect(0,0,W,H);}
    if(o.night){c.fillStyle='rgba(30,18,60,.45)';c.fillRect(0,0,W,H);}
    if(o.board!=null){drawProp(c,{prop:'board',cards:o.board,fresh:o.fresh},sx+sw*.5,st.y+st.h*.3,sw*.8,t);}
    break;}
  case 'tower':{
    const night=!!o.night,fl=o.floors||1;
    if(night)skyGrad(c,W,H,['#0B1030','#26265E','#4B3A78']);else skyGrad(c,W,H,['#6CC8F5','#BDE8FF','#E8F7FF']);
    if(night){c.fillStyle='#fff';for(let i=0;i<70;i++){const k=(Math.sin(t*2+i)+1)/2;c.globalAlpha=.4+k*.6;circ(c,hsh(i)*W,hsh(i+50)*H*.6,1+hsh(i+9)*1.5);c.fill();}c.globalAlpha=1;
      c.fillStyle='#FFF4C9';circ(c,W*.82,H*.12,Math.min(W,H)*.06);c.fill();c.fillStyle='#26265E';circ(c,W*.84,H*.11,Math.min(W,H)*.055);c.fill();}
    else{for(let i=0;i<4;i++)cloud(c,((hsh(i)*W+t*12*(1+i*.3))%(W+200))-100,H*(.1+hsh(i+3)*.25),18+hsh(i+5)*18);}
    const gy=st.y+st.h*.86;
    for(let i=0;i<14;i++){const bw=W/9,bx=i*bw*.75-20,bh=H*(.12+hsh(i+20)*.22);c.fillStyle=night?'#1C1E44':'#9CC3D9';c.fillRect(bx,gy-bh,bw*.7,bh);
      c.fillStyle=night?'rgba(255,220,120,.7)':'rgba(255,255,255,.5)';for(let wy=gy-bh+8;wy<gy-8;wy+=14)for(let wx=bx+6;wx<bx+bw*.7-6;wx+=12)if(hsh(wx*wy)>.45)c.fillRect(wx,wy,5,7);}
    const tw=Math.min(sw*.5,W*.5),tx=W/2-tw/2,fh=st.h*.11;
    for(let f=0;f<fl;f++){const y=gy-(f+1)*fh,shrink=f>=4?tw*.1:0;c.fillStyle=['#3D7480','#6E4B3A','#D98F25','#3A2E66'][Math.min(f,3)];
      rr(c,tx+shrink,y,tw-shrink*2,fh+2,4);c.fill();c.lineWidth=3;c.strokeStyle=INK;c.stroke();
      for(let wx=tx+shrink+tw*.07;wx<tx+tw-shrink-tw*.08;wx+=tw*.13){c.fillStyle=night?(hsh(wx+f)>.3?'#FFE58A':'#2B2550'):'#BDE8FF';rr(c,wx,y+fh*.22,tw*.08,fh*.5,3);c.fill();c.lineWidth=2;c.stroke();}}
    c.fillStyle='#FFC531';rr(c,W/2-tw*.32,gy-fh*.38,tw*.64,fh*.3,6);c.fill();c.lineWidth=3;c.stroke();txt(c,bankName(),W/2,gy-fh*.23,Math.round(fh*.24),INK);
    const top=gy-fl*fh;
    if(o.crane){c.strokeStyle='#FFC531';c.lineWidth=4;for(let i=0;i<3;i++){c.beginPath();c.moveTo(tx+tw*.1,top-i*fh*.3);c.lineTo(tx+tw*.9,top-i*fh*.3);c.stroke();}
      for(let i=0;i<=4;i++){c.beginPath();c.moveTo(tx+tw*(.1+i*.2),top);c.lineTo(tx+tw*(.1+i*.2),top-fh*.6);c.stroke();}
      c.strokeStyle='#F2A23A';c.lineWidth=6;c.beginPath();c.moveTo(tx+tw*.85,top);c.lineTo(tx+tw*.85,top-fh*1.8);c.lineTo(tx-tw*.35,top-fh*1.8);c.stroke();
      const hx=tx+tw*(.2+Math.sin(t*.6)*.25);c.strokeStyle=INK;c.lineWidth=2;c.beginPath();c.moveTo(hx,top-fh*1.8);c.lineTo(hx,top-fh*1.1);c.stroke();c.fillStyle='#E5484D';c.fillRect(hx-14,top-fh*1.1,28,16);c.strokeRect(hx-14,top-fh*1.1,28,16);}
    if(o.teapot)drawProp(c,{prop:'teapot',col:'#E86A92'},W/2,top-fh*.85,tw*.75,t);
    c.fillStyle=night?'#2A2A3A':'#8E9AA6';c.fillRect(0,gy,W,H-gy);c.fillStyle=night?'#3A3A50':'#B6C0C9';c.fillRect(0,gy,W,8);
    c.strokeStyle=night?'#555':'#fff';c.lineWidth=4;c.setLineDash([24,20]);c.beginPath();c.moveTo(0,gy+(H-gy)*.55);c.lineTo(W,gy+(H-gy)*.55);c.stroke();c.setLineDash([]);
    break;}
  case 'elevator':{
    c.fillStyle='#9AA8B3';c.fillRect(0,0,W,H);c.fillStyle='#B7C3CC';for(let x=0;x<W;x+=60)c.fillRect(x,0,30,fy);
    c.fillStyle='#55626E';rr(c,W/2-sw*.3,st.y+st.h*.12,sw*.6,fy-st.y-st.h*.12,6);c.fill();c.lineWidth=4;c.strokeStyle=INK;c.stroke();
    c.fillStyle='#1F2933';rr(c,W/2-sw*.1,st.y+st.h*.04,sw*.2,st.h*.06,6);c.fill();c.stroke();txt(c,(o.floor||'۱'),W/2,st.y+st.h*.07,Math.round(sw*.045),'#FF6B6E',null,FONT_B);
    c.fillStyle='#E8D9B5';c.fillRect(0,fy,W,H-fy);c.strokeStyle='rgba(0,0,0,.12)';c.lineWidth=2;for(let x=0;x<W;x+=50){c.beginPath();c.moveTo(x,fy);c.lineTo(x-30,H);c.stroke();}
    break;}
  case 'office':{
    const th=THEMES[o.theme||'lobby'];
    c.fillStyle=th.night?'#2B2450':shade(th.floorA,-.05);c.fillRect(0,0,W,fy);
    c.fillStyle=th.wall;c.fillRect(0,fy-st.h*.05,W,st.h*.05);
    for(let i=0;i<3;i++){const wx=sx+sw*(.06+i*.33);windowFrame(c,wx,st.y+st.h*.1,sw*.22,st.h*.2,()=>{if(th.night)skyGrad(c,W,H,['#0B1030','#2A2F6B']);else skyGrad(c,W,H,['#8FD3F7','#DDF3FF']);
      c.fillStyle=th.night?'#FFE58A':'rgba(255,255,255,.8)';for(let k=0;k<4;k++)c.fillRect(wx+k*sw*.06,st.y+st.h*(.22+hsh(k+i)*.06),sw*.04,st.h*.12);});}
    if(o.theme==='build'){c.fillStyle='#FFC531';for(let x=0;x<W;x+=40){c.save();c.beginPath();c.rect(0,fy-st.h*.05,W,st.h*.05);c.clip();c.beginPath();c.moveTo(x,fy);c.lineTo(x+20,fy);c.lineTo(x+40,fy-st.h*.05);c.lineTo(x+20,fy-st.h*.05);c.closePath();c.fill();c.restore();}}
    if(o.theme==='archive')txt(c,'سکوت! بایگانی',W/2,st.y+st.h*.38,Math.round(sw*.04),th.wall);else drawSign(c,W/2,st.y+st.h*.4,sw*.42,t);
    c.fillStyle=th.floorA;c.fillRect(0,fy,W,H-fy);c.fillStyle=th.floorB;for(let x=0;x<W;x+=40)for(let y=fy;y<H;y+=40)if(((x+y)/40)%2<1)c.fillRect(x,y,40,40);
    if(th.night){c.fillStyle='rgba(10,8,30,.35)';c.fillRect(0,0,W,H);}
    break;}
  case 'construction':{
    skyGrad(c,W,fy,['#C9D7E0','#E9EEF1']);
    c.strokeStyle='#F2A23A';c.lineWidth=6;for(let x=sx;x<sx+sw;x+=sw/4){c.beginPath();c.moveTo(x,st.y);c.lineTo(x,fy);c.stroke();}
    for(let y=st.y+st.h*.1;y<fy;y+=st.h*.18){c.beginPath();c.moveTo(0,y);c.lineTo(W,y);c.stroke();}
    c.strokeStyle='rgba(242,162,58,.6)';c.lineWidth=3;for(let x=sx;x<sx+sw;x+=sw/4){c.beginPath();c.moveTo(x,st.y+st.h*.1);c.lineTo(x+sw/4,st.y+st.h*.28);c.stroke();}
    c.fillStyle='#A9A49C';c.fillRect(0,fy,W,H-fy);c.fillStyle='#FFC531';for(let x=-40;x<W;x+=40){c.beginPath();c.moveTo(x,fy);c.lineTo(x+20,fy);c.lineTo(x+40,fy+14);c.lineTo(x+20,fy+14);c.closePath();c.fill();}
    for(const cx2 of[sx+sw*.1,sx+sw*.9]){c.fillStyle='#FF7A2F';c.beginPath();c.moveTo(cx2-sw*.04,fy+st.h*.08);c.lineTo(cx2,fy-st.h*.04);c.lineTo(cx2+sw*.04,fy+st.h*.08);c.closePath();c.fill();c.lineWidth=2.5;c.strokeStyle=INK;c.stroke();c.fillStyle='#fff';c.fillRect(cx2-sw*.022,fy+st.h*.015,sw*.044,st.h*.015);}
    break;}
  case 'penthouse':{
    c.fillStyle='#2A1F45';c.fillRect(0,0,W,H);
    windowFrame(c,sx+sw*.08,st.y+st.h*.06,sw*.84,st.h*.36,()=>{skyGrad(c,W,H,['#0B1030','#3A2F6B']);c.fillStyle='#FFE58A';for(let i=0;i<40;i++){c.fillRect(sx+hsh(i)*sw,st.y+st.h*(.25+hsh(i+3)*.17),3,5);}c.fillStyle='#FFF4C9';circ(c,sx+sw*.8,st.y+st.h*.14,sw*.04);c.fill();});
    c.fillStyle='#C9A227';rr(c,sx+sw*.38,st.y+st.h*.46,sw*.24,st.h*.04,3);c.fill();
    c.fillStyle='#3A2E66';c.fillRect(0,fy,W,H-fy);c.fillStyle='rgba(201,162,39,.25)';for(let x=0;x<W;x+=60){c.fillRect(x,fy,30,H-fy);}
    c.fillStyle='rgba(255,230,140,.12)';c.beginPath();c.moveTo(W/2,0);c.lineTo(W/2-sw*.4,H);c.lineTo(W/2+sw*.4,H);c.closePath();c.fill();
    break;}
  case 'roof':{
    skyGrad(c,W,H,['#0B1030','#2E2763','#6B3D7A']);c.fillStyle='#fff';for(let i=0;i<50;i++){c.globalAlpha=.5+hsh(i)*.5;circ(c,hsh(i)*W,hsh(i+40)*H*.5,1+hsh(i+2));c.fill();}c.globalAlpha=1;
    c.fillStyle='#FFF4C9';circ(c,W*.15,H*.12,Math.min(W,H)*.05);c.fill();
    for(let i=0;i<12;i++){const bx=i*W/10-10,bh=H*(.06+hsh(i+70)*.1);c.fillStyle='#1A1840';c.fillRect(bx,fy-bh,W/12,bh);c.fillStyle='#FFE58A';for(let wy=fy-bh+5;wy<fy-4;wy+=10)c.fillRect(bx+5,wy,3,4);}
    c.strokeStyle='rgba(255,255,255,.5)';c.lineWidth=1.5;c.beginPath();c.moveTo(0,st.y+st.h*.3);c.quadraticCurveTo(W/2,st.y+st.h*.4,W,st.y+st.h*.28);c.stroke();
    for(let i=0;i<10;i++){const k=i/9,lx=k*W,ly=st.y+st.h*.3+Math.sin(k*P)*st.h*.08;c.fillStyle=['#FF8FB5','#FFE58A','#8BD3B7'][i%3];circ(c,lx,ly+6,5);c.fill();}
    c.fillStyle='#4A3A5E';c.fillRect(0,fy,W,H-fy);c.fillStyle='#5C4A72';for(let x=0;x<W;x+=50)c.fillRect(x,fy,25,H-fy);
    break;}
  case 'sea':{
    skyGrad(c,W,H,['#FF9A6B','#FFC48B','#FFE3B0']);c.fillStyle='#FFE58A';circ(c,W*.5,fy-st.h*.05,sw*.12);c.fill();
    c.fillStyle='#3E8FC2';c.fillRect(0,fy-st.h*.05,W,H);c.strokeStyle='rgba(255,255,255,.5)';c.lineWidth=2;for(let i=0;i<12;i++){const y=fy+i*14,o2=Math.sin(t+i)*20;c.beginPath();c.moveTo(o2+i*30%W,y);c.lineTo(o2+i*30%W+40,y);c.stroke();}
    c.fillStyle='#E9C98B';ell(c,W*.7,fy,sw*.3,st.h*.05);c.fill();c.strokeStyle='#7A4A2E';c.lineWidth=6;c.beginPath();c.moveTo(W*.72,fy);c.quadraticCurveTo(W*.74,fy-st.h*.12,W*.7,fy-st.h*.2);c.stroke();
    c.fillStyle='#3FAE6B';for(let i=0;i<5;i++){c.save();c.translate(W*.7,fy-st.h*.2);c.rotate(-P+i*P/4);ell(c,sw*.07,0,sw*.08,sw*.025);c.fill();c.restore();}
    break;}
  case 'gallery':{ /* «اتوگالری جاوید» car showroom */
    const night=!!o.night,wy=st.y+st.h*.2,wb=fy-st.h*.025;
    skyGrad(c,W,fy,['#F1F6FA','#D8E4EE']);
    // big shop window onto the street
    c.save();c.beginPath();c.rect(0,wy,W,wb-wy);c.clip();
    skyGrad(c,W,H,night?['#141A44','#3B2F6B','#3B2F6B']:['#8FD3F7','#CDEEFF','#EAF7FF']);
    if(night){c.fillStyle='#fff';for(let i=0;i<30;i++){circ(c,hsh(i)*W,wy+hsh(i+30)*(wb-wy)*.4,1.2);c.fill();}}else{cloud(c,sx+sw*.25+Math.sin(t*.2)*10,wy+st.h*.06,sw*.04);cloud(c,sx+sw*.8,wy+st.h*.1,sw*.03);}
    for(let i=0;i<10;i++){const bw2=sw*.2,bx2=sx-sw*.35+i*bw2*1.05,bh2=(wb-wy)*(.35+hsh(i+40)*.35);c.fillStyle=night?'#22264A':'#B9C8D6';c.fillRect(bx2,wb-bh2,bw2,bh2);
      c.fillStyle=night?'#FFE58A':'rgba(255,255,255,.6)';for(let yy=wb-bh2+8;yy<wb-8;yy+=14)for(let xx=bx2+6;xx<bx2+bw2-8;xx+=12)if(hsh(xx*.7+yy)>.45)c.fillRect(xx,yy,5,7);}
    c.fillStyle=night?'#2E3348':'#9AA8B3';c.fillRect(0,wb-st.h*.03,W,st.h*.03);
    c.fillStyle='rgba(255,255,255,.18)';for(let x=-W;x<W*2;x+=sw*.5){c.beginPath();c.moveTo(x,wy);c.lineTo(x+sw*.12,wy);c.lineTo(x+sw*.02,wb);c.lineTo(x-sw*.1,wb);c.closePath();c.fill();}
    c.restore();
    c.strokeStyle='#E9EEF2';c.lineWidth=7;for(let x=sx%(sw*.25);x<W;x+=sw*.25){c.beginPath();c.moveTo(x,wy);c.lineTo(x,wb);c.stroke();}
    c.lineWidth=3;c.strokeStyle=INK;c.strokeRect(-2,wy,W+4,wb-wy);
    // window stickers
    c.save();c.translate(sx+sw*.3,wy+st.h*.135);c.rotate(-.12);c.fillStyle='#E5484D';starPath(c,0,0,sw*.09,10,.75);c.fill();c.lineWidth=2.5;c.strokeStyle=INK;c.stroke();
    txt(c,'فروش',0,-sw*.017,Math.round(sw*.032),'#fff');txt(c,'ویژه!',0,sw*.022,Math.round(sw*.032),'#FFE14D');c.restore();
    c.save();c.translate(sx+sw*.69,wy+st.h*.14);c.rotate(.08);c.fillStyle='#FFE14D';rr(c,-sw*.13,-sw*.035,sw*.26,sw*.07,sw*.02);c.fill();c.lineWidth=2.5;c.strokeStyle=INK;c.stroke();
    txtFit(c,'قسطی هم داریم!',0,0,sw*.24,Math.round(sw*.032),'#E5484D',null,FONT_B);c.restore();
    // the big sign with marquee bulbs
    {const gx=W/2,gy=st.y+st.h*.095,gw=Math.min(sw*.92,W-16),gh=st.h*.12;
      c.fillStyle='#E5484D';rr(c,gx-gw/2,gy-gh/2,gw,gh,gh*.25);c.fill();c.lineWidth=4;c.strokeStyle=INK;c.stroke();
      c.fillStyle='#B8323A';rr(c,gx-gw/2+gh*.14,gy-gh/2+gh*.14,gw-gh*.28,gh*.72,gh*.18);c.fill();
      const nb=22;for(let i=0;i<nb;i++){const on=((i+Math.floor(t*4))%2)===0,bx3=gx-gw/2+gh*.07+(gw-gh*.14)*i/(nb-1);
        for(const yy of[gy-gh/2+gh*.07,gy+gh/2-gh*.07]){c.fillStyle=on?'#FFF6B0':'#C9A227';circ(c,bx3,yy,gh*.045);c.fill();}}
      txtFit(c,'اتوگالری جاوید',gx,gy+gh*.04,gw*.78,Math.round(gh*.55),'#FFE14D',INK);
      for(const sd of[-1,1]){c.fillStyle='#FFE14D';starPath(c,gx+sd*gw*.43,gy,gh*.17);c.fill();c.lineWidth=2;c.strokeStyle=INK;c.stroke();}}
    // bunting
    for(let row=0;row<2;row++){const y0=wy+st.h*(.005+row*.045),sag=st.h*.035,n=Math.ceil(W/(sw*.07));c.strokeStyle=INK;c.lineWidth=1.5;c.beginPath();
      for(let i=0;i<=n;i++){const x=i*W/n,yy=y0+Math.sin(i/n*P*2+row)*0+sag*Math.sin((x/W)*P);i?c.lineTo(x,yy):c.moveTo(x,yy);}c.stroke();
      for(let i=0;i<n;i++){const x=(i+.5)*W/n,yy=y0+sag*Math.sin((x/W)*P),wv=Math.sin(t*3+i)*2;c.fillStyle=['#FF4F86','#FFC531','#5EC8F7','#62C784','#9B7BE8'][(i+row*2)%5];
        c.beginPath();c.moveTo(x-W/n*.42,yy);c.lineTo(x+W/n*.42,yy);c.lineTo(x+wv,yy+st.h*.035);c.closePath();c.fill();c.lineWidth=1.2;c.stroke();}}
    // spotlights
    c.save();c.globalCompositeOperation='lighter';for(const lx of[sx+sw*.28,sx+sw*.72]){const gl=c.createLinearGradient(0,wy,0,fy+st.h*.1);gl.addColorStop(0,'rgba(255,240,190,.28)');gl.addColorStop(1,'rgba(255,240,190,0)');
      c.fillStyle=gl;c.beginPath();c.moveTo(lx-sw*.02,wy);c.lineTo(lx+sw*.02,wy);c.lineTo(W/2+(lx-W/2)*.3+sw*.22,fy+st.h*.12);c.lineTo(W/2+(lx-W/2)*.3-sw*.22,fy+st.h*.12);c.closePath();c.fill();}c.restore();
    // shiny floor
    {const g=c.createLinearGradient(0,fy,0,H);g.addColorStop(0,'#E9EFF4');g.addColorStop(1,'#B8C7D4');c.fillStyle=g;c.fillRect(0,fy,W,H-fy);
      c.strokeStyle='rgba(80,100,120,.18)';c.lineWidth=1.5;for(let i=0,yy=fy;yy<H;i++,yy+=6+i*7){c.beginPath();c.moveTo(0,yy);c.lineTo(W,yy);c.stroke();}
      for(let i=-12;i<=12;i++){c.beginPath();c.moveTo(W/2+i*sw*.09,fy);c.lineTo(W/2+i*sw*.3,H);c.stroke();}
      c.fillStyle='rgba(255,255,255,.35)';for(let x=sx%(sw*.25);x<W;x+=sw*.25){c.fillRect(x-3,fy,6,(H-fy)*.6);}
      c.fillStyle=INK;c.fillRect(0,fy-2,W,3);}
    // turntable podium
    {const cx3=W/2,cy3=fy+st.h*.11,rx=Math.min(sw*.46,W*.46),ry=st.h*.05;c.fillStyle='#8A96A3';ell(c,cx3,cy3+st.h*.015,rx,ry);c.fill();c.lineWidth=3;c.strokeStyle=INK;c.stroke();
      const g=c.createLinearGradient(cx3-rx,0,cx3+rx,0);g.addColorStop(0,'#C9D3DB');g.addColorStop(.5,'#F4F7FA');g.addColorStop(1,'#C9D3DB');c.fillStyle=g;ell(c,cx3,cy3,rx,ry);c.fill();c.stroke();
      for(let i=0;i<16;i++){const a=i/16*TAU+t*.6,on=(i+Math.floor(t*3))%3===0;c.fillStyle=on?'#FFE14D':'#5EC8F7';circ(c,cx3+Math.cos(a)*rx*.9,cy3+Math.sin(a)*ry*.8,3);c.fill();}}
    // balloons + price tags
    for(const sd of[-1,1]){const bx4=W/2+sd*Math.min(sw*.37,W*.45);
      c.strokeStyle='#555';c.lineWidth=1.2;for(let i=0;i<3;i++){const px=bx4+(i-1)*sw*.035+Math.sin(t*1.5+i+sd)*3,py=fy-st.h*(.32+(i%2)*.05);c.beginPath();c.moveTo(bx4,fy-st.h*.12);c.quadraticCurveTo(px,py+st.h*.1,px,py+sw*.04);c.stroke();}
      for(let i=0;i<3;i++){const px=bx4+(i-1)*sw*.035+Math.sin(t*1.5+i+sd)*3,py=fy-st.h*(.32+(i%2)*.05);c.fillStyle=['#FF4F86','#FFC531','#5EC8F7'][(i+(sd>0?1:0))%3];
        ell(c,px,py,sw*.032,sw*.04);c.fill();c.lineWidth=2;c.strokeStyle=INK;c.stroke();c.fillStyle='rgba(255,255,255,.5)';ell(c,px-sw*.01,py-sw*.015,sw*.008,sw*.012,-.4);c.fill();}
      c.fillStyle='#9AA8B3';c.fillRect(bx4-2,fy-st.h*.12,4,st.h*.14);c.strokeStyle=INK;c.lineWidth=1.5;c.strokeRect(bx4-2,fy-st.h*.12,4,st.h*.14);ell(c,bx4,fy+st.h*.02,sw*.04,st.h*.008);c.fillStyle='#555';c.fill();
      c.save();c.translate(bx4,fy-st.h*.12);c.rotate(sd*.08);c.fillStyle='#fff';rr(c,-sw*.085,-sw*.06,sw*.17,sw*.08,sw*.012);c.fill();c.lineWidth=2;c.strokeStyle=INK;c.stroke();
      txtFit(c,sd<0?'فول‌آپشن!':'قیمت: توافقی',0,-sw*.035,sw*.15,Math.round(sw*.028),'#E5484D',null,FONT_B);
      txtFit(c,sd<0?'بی‌رنگ، بی‌تصادف':'فقط امروز!',0,-sw*.0,sw*.15,Math.round(sw*.022),INK,null,FONT_B);c.restore();}
    if(night){c.fillStyle='rgba(20,20,60,.25)';c.fillRect(0,0,W,H);}
    break;}
  case 'garage':{ /* multi-storey parking garage (dim, night by default) */
    const night=o.night!==false,cl=st.y+st.h*.13;
    c.fillStyle='#454B57';c.fillRect(0,0,W,fy);
    // open side: night sky beyond the railing
    {const ox=sx-sw*.5,ow=sw*.95,oy=cl+st.h*.06,oh=st.h*.25;c.save();c.beginPath();c.rect(ox,oy,ow,oh);c.clip();
      skyGrad(c,W,H,night?['#0B1030','#26265E','#4B3A78']:['#FFB36B','#FFC98B','#FFE3B0']);
      if(night){c.fillStyle='#fff';for(let i=0;i<30;i++){const k=(Math.sin(t*2+i)+1)/2;c.globalAlpha=.4+k*.6;circ(c,ox+hsh(i)*ow,oy+hsh(i+5)*oh*.5,1.2);c.fill();}c.globalAlpha=1;
        c.fillStyle='#FFF4C9';circ(c,ox+ow*.78,oy+oh*.25,sw*.035);c.fill();c.fillStyle=night?'#26265E':'#FFC98B';circ(c,ox+ow*.8,oy+oh*.23,sw*.03);c.fill();}
      for(let i=0;i<12;i++){const bx5=ox+i*ow/9-10,bh5=oh*(.3+hsh(i+60)*.4);c.fillStyle=night?'#1A1C40':'#C9A3A0';c.fillRect(bx5,oy+oh-bh5,ow/11,bh5);
        c.fillStyle=night?'#FFE58A':'rgba(255,255,255,.5)';for(let wy2=oy+oh-bh5+5;wy2<oy+oh-4;wy2+=9)if(hsh(wy2+i)>.4)c.fillRect(bx5+4,wy2,3,4);}
      c.restore();c.strokeStyle='#8E96A2';c.lineWidth=4;for(const yy of[oy+oh*.62,oy+oh*.82]){c.beginPath();c.moveTo(ox,yy);c.lineTo(ox+ow,yy);c.stroke();}
      c.lineWidth=3;for(let x=ox;x<=ox+ow;x+=ow/8){c.beginPath();c.moveTo(x,oy+oh*.62);c.lineTo(x,oy+oh);c.stroke();}
      c.strokeStyle=INK;c.lineWidth=3;c.strokeRect(ox,oy,ow,oh);}
    // painted level band + big level sign
    c.fillStyle='#3D7DD8';c.fillRect(0,fy-st.h*.2,W,st.h*.05);c.fillStyle='rgba(255,255,255,.12)';c.fillRect(0,fy-st.h*.2,W,st.h*.008);
    {const lx=sx+sw*.37,ly=cl+st.h*.3;c.fillStyle='#3D7DD8';circ(c,lx,ly,sw*.075);c.fill();c.lineWidth=3;c.strokeStyle=INK;c.stroke();txt(c,'P2',lx,ly+2,Math.round(sw*.07),'#fff',INK,FONT_B);
      txt(c,'طبقه‌ی منفی ۲',lx,ly+sw*.11,Math.round(sw*.035),'#E9EEF2',INK,FONT_B);}
    // ramp going up (right)
    {const r0=sx+sw*.66,rt=cl+st.h*.12;c.fillStyle='#363B45';c.beginPath();c.moveTo(r0,fy);c.lineTo(W+20,fy);c.lineTo(W+20,rt);c.lineTo(r0+sw*.25,rt);c.closePath();c.fill();
      c.fillStyle='#5A616E';c.beginPath();c.moveTo(r0,fy);c.lineTo(r0+sw*.25,rt);c.lineTo(r0+sw*.25,rt+st.h*.03);c.lineTo(r0+sw*.02,fy);c.closePath();c.fill();c.lineWidth=2.5;c.strokeStyle=INK;c.stroke();
      c.strokeStyle='#FFE14D';c.lineWidth=4;c.setLineDash([12,10]);c.beginPath();c.moveTo(r0+sw*.12,fy);c.lineTo(r0+sw*.3,rt+st.h*.04);c.stroke();c.setLineDash([]);
      {const ax=r0+sw*.24,ay=fy-(fy-rt)*.45;c.fillStyle='#F4F6F8';c.beginPath();c.moveTo(ax,ay-st.h*.05);c.lineTo(ax+sw*.04,ay);c.lineTo(ax+sw*.012,ay);c.lineTo(ax+sw*.012,ay+st.h*.04);c.lineTo(ax-sw*.012,ay+st.h*.04);c.lineTo(ax-sw*.012,ay);c.lineTo(ax-sw*.04,ay);c.closePath();c.fill();}
      const ex=sx+sw*.86,ey=cl+st.h*.04;c.fillStyle='#1E9E5A';rr(c,ex-sw*.09,ey-st.h*.025,sw*.18,st.h*.05,5);c.fill();c.lineWidth=2.5;c.strokeStyle=INK;c.stroke();
      c.save();c.shadowColor='rgba(120,255,170,.8)';c.shadowBlur=8;txt(c,'خروج',ex,ey+1,Math.round(st.h*.03),'#E8FFF0',null,FONT_B);c.restore();}
    // ceiling, beams, pipes, tube lights
    c.fillStyle='#2B2F38';c.fillRect(0,0,W,cl);c.fillStyle='#363B46';c.fillRect(0,cl-st.h*.03,W,st.h*.03);c.strokeStyle=INK;c.lineWidth=2;c.beginPath();c.moveTo(0,cl);c.lineTo(W,cl);c.stroke();
    c.strokeStyle='#8A5A3A';c.lineWidth=6;c.beginPath();c.moveTo(0,cl-st.h*.06);c.lineTo(W,cl-st.h*.06);c.stroke();c.strokeStyle='#6B7B8C';c.lineWidth=4;c.beginPath();c.moveTo(0,cl-st.h*.085);c.lineTo(W,cl-st.h*.085);c.stroke();
    for(let i=0;i<3;i++){const lx=sx+sw*(.2+i*.3),fl=i===1?(Math.sin(t*23)+Math.sin(t*7.3)>1.2?.25:1):1;
      if(fl>.5){const gl=c.createRadialGradient(lx,cl+st.h*.02,0,lx,cl+st.h*.15,sw*.35);gl.addColorStop(0,'rgba(220,255,240,'+(night?.32:.22)+')');gl.addColorStop(1,'rgba(220,255,240,0)');c.fillStyle=gl;c.fillRect(lx-sw*.4,cl,sw*.8,st.h*.45);}
      c.fillStyle=fl>.5?'#EFFFF8':'#7D8A86';rr(c,lx-sw*.09,cl+2,sw*.18,st.h*.014,4);c.fill();c.lineWidth=2;c.strokeStyle=INK;c.stroke();}
    // pillars with hazard stripes
    for(const[px,lab]of[[sx+sw*.12,'B۱۲'],[sx+sw*.62,'B۱۳']]){const pw=sw*.11;c.fillStyle='#69707C';c.fillRect(px-pw/2,cl,pw,fy-cl);c.fillStyle='rgba(255,255,255,.08)';c.fillRect(px-pw/2,cl,pw*.25,fy-cl);
      c.save();c.beginPath();c.rect(px-pw/2,fy-st.h*.07,pw,st.h*.07);c.clip();c.fillStyle='#FFC531';c.fillRect(px-pw/2,fy-st.h*.07,pw,st.h*.07);c.fillStyle='#1E1E28';
      for(let k2=-pw;k2<pw*2;k2+=pw*.4){c.beginPath();c.moveTo(px-pw/2+k2,fy);c.lineTo(px-pw/2+k2+pw*.2,fy);c.lineTo(px-pw/2+k2+pw*.2+st.h*.07,fy-st.h*.07);c.lineTo(px-pw/2+k2+st.h*.07,fy-st.h*.07);c.closePath();c.fill();}c.restore();
      c.lineWidth=3;c.strokeStyle=INK;c.strokeRect(px-pw/2,cl,pw,fy-cl);c.fillStyle='#fff';rr(c,px-pw*.38,cl+st.h*.12,pw*.76,st.h*.05,4);c.fill();c.lineWidth=2;c.stroke();txt(c,lab,px,cl+st.h*.147,Math.round(st.h*.03),'#3D7DD8',null,FONT_B);}
    // floor with painted bays
    {c.fillStyle='#30343C';c.fillRect(0,fy,W,H-fy);c.fillStyle='#262A31';for(let i=0;i<6;i++){ell(c,sx+sw*hsh(i+90),fy+(H-fy)*(.3+hsh(i+95)*.6),sw*.06,st.h*.012);c.fill();}
      c.strokeStyle='rgba(240,240,240,.75)';c.lineWidth=3;c.beginPath();c.moveTo(0,fy+st.h*.03);c.lineTo(W,fy+st.h*.03);c.stroke();
      for(let i=-8;i<=8;i++){c.beginPath();c.moveTo(W/2+i*sw*.2,fy+st.h*.03);c.lineTo(W/2+i*sw*.42,H);c.stroke();}
      c.strokeStyle='#FFC531';c.setLineDash([16,12]);c.beginPath();c.moveTo(0,fy+(H-fy)*.75);c.lineTo(W,fy+(H-fy)*.75);c.stroke();c.setLineDash([]);
      for(let i=-1;i<=1;i++)txt(c,faNum(12+i),W/2+i*sw*.3+sw*.1,fy+st.h*.06,Math.round(st.h*.025),'rgba(240,240,240,.7)',null,FONT_B);
      c.fillStyle=INK;c.fillRect(0,fy-2,W,3);}
    // dim vignette
    {const vg=c.createRadialGradient(W/2,fy-st.h*.15,st.h*.15,W/2,fy-st.h*.15,Math.max(W,H)*.75);vg.addColorStop(0,'rgba(10,12,30,0)');vg.addColorStop(1,'rgba(10,12,30,'+(night?.6:.35)+')');c.fillStyle=vg;c.fillRect(0,0,W,H);}
    break;}
  default:c.fillStyle='#24384A';c.fillRect(0,0,W,H);
  }
  c.restore();
}
function drawFG(c,name,W,H,st,t,o){
  if(FG_EXT[name]){c.save();FG_EXT[name](c,W,H,st,t,o||{});c.restore();return;}
  const fy=st.y+st.h*.76,sx=st.x,sw=st.w;c.save();c.lineWidth=3;c.strokeStyle=INK;
  if(name==='cafe'&&!(o&&o.board!=null)){c.fillStyle='#B97A4E';rr(c,sx+sw*.5,fy-st.h*.13,sw*.6,st.h*.2,6);c.fill();c.stroke();c.fillStyle='#D99A68';c.fillRect(sx+sw*.5,fy-st.h*.13,sw*.6,st.h*.03);
    c.fillStyle='#C7D0D8';rr(c,sx+sw*.82,fy-st.h*.25,sw*.15,st.h*.12,6);c.fill();c.stroke();c.fillStyle=INK;c.fillRect(sx+sw*.86,fy-st.h*.15,sw*.07,st.h*.02);c.fillStyle='#E5484D';circ(c,sx+sw*.895,fy-st.h*.21,sw*.015);c.fill();}
  if(name==='kitchen'){c.fillStyle='#FFFFFF';rr(c,-10,fy-st.h*.06,W+20,st.h*.05,4);c.fill();c.stroke();c.fillStyle='#8FD3B7';c.fillRect(-10,fy-st.h*.01,W+20,H);c.beginPath();c.moveTo(-10,fy-st.h*.01);c.lineTo(W+10,fy-st.h*.01);c.stroke();
    for(let x=sx+sw*.1;x<sx+sw;x+=sw*.3){rr(c,x,fy+st.h*.03,sw*.22,st.h*.14,6);c.stroke();circ(c,x+sw*.11,fy+st.h*.06,4);c.fillStyle=INK;c.fill();c.fillStyle='#8FD3B7';}}
  c.restore();
}
