// Kiana Queen — procedural audio (WebAudio only, no external files)
const AUDIO = (() => {
  'use strict';
  const settings = { sfx: true, music: true, voice: true };
  const W = typeof window !== 'undefined' ? window : {};
  const MUSIC_VOL = 0.08;
  let ctx = null, sfxB = null, musB = null, voxB = null, thinkB = null, nbuf = null, curve = null;
  let timer = null, inst = null, want = null, ducked = false;
  let eng = null, engWant = null;

  const mf = m => 440 * Math.pow(2, (m - 69) / 12);
  const T = o => (o.at != null ? o.at : ctx.currentTime + (o.t || 0));
  const live = () => ctx && (!ctx.state || ctx.state === 'running');

  function unlock() {
    try {
      if (!ctx) {
        const AC = W.AudioContext || W.webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
        const master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
        sfxB = ctx.createGain(); sfxB.gain.value = 0.5; sfxB.connect(master);
        voxB = ctx.createGain(); voxB.gain.value = 0.45; voxB.connect(master);
        musB = ctx.createGain(); musB.gain.value = ducked ? MUSIC_VOL * 0.4 : MUSIC_VOL; musB.connect(master);
        // Kiana's inner voice: muffled + a little echo
        thinkB = ctx.createGain(); thinkB.gain.value = 1;
        const tl = ctx.createBiquadFilter(); tl.type = 'lowpass'; tl.frequency.value = 2300; tl.Q.value = 0.5;
        const dry = ctx.createGain(); dry.gain.value = 0.75;
        thinkB.connect(tl); tl.connect(dry); dry.connect(voxB);
        if (ctx.createDelay) {
          const dl = ctx.createDelay(1), fb = ctx.createGain(), wet = ctx.createGain();
          dl.delayTime.value = 0.15; fb.gain.value = 0.3; wet.gain.value = 0.4;
          tl.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(voxB);
        }
        nbuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const d = nbuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        curve = new Float32Array(256);
        for (let i = 0; i < 256; i++) curve[i] = Math.tanh((i / 128 - 1) * 5);
        timer = setInterval(tick, 25);
      }
      if (ctx.state === 'suspended' || ctx.state === 'interrupted') { const p = ctx.resume(); if (p && p.catch) p.catch(() => {}); }
      if (want && !inst && settings.music) start(want);
      if (engWant && !eng && settings.sfx) engStart(engWant.p);
    } catch (e) {}
  }

  // ---------- synthesis helpers ----------
  function env(g, t, a, d, v) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(v, 0.0002), t + Math.min(a, d * 0.9));
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  }
  // o: t|at, w wave, v vol, a attack, f2 glide target, p [[dt,f]...] pitch points,
  //    vib [rate,depthHz], lp|bp|hp filter freq, q, out
  function tone(f, d, o) {
    o = o || {};
    const t = T(o), osc = ctx.createOscillator(), g = ctx.createGain();
    osc.type = o.w || 'sine';
    osc.frequency.setValueAtTime(f, t);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t + d);
    if (o.p) o.p.forEach(pt => osc.frequency.linearRampToValueAtTime(pt[1], t + pt[0]));
    if (o.vib) {
      const l = ctx.createOscillator(), lg = ctx.createGain();
      l.frequency.value = o.vib[0]; lg.gain.value = o.vib[1];
      l.connect(lg); lg.connect(osc.frequency); l.start(t); l.stop(t + d + 0.05);
    }
    let n = osc;
    if (o.lp || o.bp || o.hp) {
      const fl = ctx.createBiquadFilter();
      fl.type = o.lp ? 'lowpass' : o.bp ? 'bandpass' : 'highpass';
      fl.frequency.value = o.lp || o.bp || o.hp; fl.Q.value = o.q || 1;
      osc.connect(fl); n = fl;
    }
    env(g, t, o.a || 0.005, d, o.v || 0.2);
    n.connect(g); g.connect(o.out || sfxB);
    osc.start(t); osc.stop(t + d + 0.05);
    return osc;
  }
  // o: t|at, ty filter type (bandpass), f, f2 sweep, q, v, a, out
  function noise(d, o) {
    o = o || {};
    const t = T(o), s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    s.buffer = nbuf; s.loop = true;
    f.type = o.ty || 'bandpass';
    f.frequency.setValueAtTime(o.f || 1000, t);
    if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, t + d);
    f.Q.value = o.q || 1;
    env(g, t, o.a || 0.004, d, o.v || 0.2);
    s.connect(f); f.connect(g); g.connect(o.out || sfxB);
    s.start(t, Math.random() * 0.5); s.stop(t + d + 0.05);
  }
  function arp(ms, o) { ms.forEach((m, i) => tone(mf(m), o.d, Object.assign({}, o, { t: (o.t || 0) + i * o.s }))); }

  // ---------- sound effects ----------
  const S = {
    coin() { tone(988, 0.08, { w: 'square', v: 0.1 }); tone(1319, 0.3, { w: 'square', v: 0.1, t: 0.07 }); },
    doc() { noise(0.12, { f: 2500, v: 0.25 }); tone(660, 0.16, { w: 'triangle', f2: 990, v: 0.25, t: 0.06 }); },
    bean() { tone(250, 0.13, { f2: 900, v: 0.3 }); tone(1300, 0.07, { t: 0.11, v: 0.12 }); },
    alert() { tone(700, 0.09, { w: 'square', f2: 1400, v: 0.12, lp: 3000 }); tone(1400, 0.28, { w: 'square', v: 0.12, t: 0.09, lp: 3000, vib: [16, 50] }); },
    busted() { tone(520, 0.75, { w: 'sawtooth', f2: 80, v: 0.22, lp: 1600, vib: [8, 20] }); noise(0.35, { ty: 'lowpass', f: 500, f2: 150, v: 0.3 }); tone(1046, 0.15, { w: 'square', v: 0.08 }); },
    win() { arp([72, 76, 79, 84], { s: 0.09, d: 0.16, w: 'triangle', v: 0.25 }); [84, 88, 91].forEach(m => tone(mf(m), 0.6, { w: 'triangle', v: 0.12, t: 0.36 })); },
    yawn() { tone(480, 1, { w: 'triangle', p: [[0.3, 620], [1, 230]], lp: 1100, vib: [5, 10], v: 0.22, a: 0.15 }); noise(0.9, { f: 900, v: 0.04, a: 0.2 }); },
    tap() { tone(800, 0.04, { f2: 500, v: 0.15 }); },
    donut() { tone(300, 0.06, { f2: 700, v: 0.2 }); noise(0.08, { f: 1500, q: 2, v: 0.25, t: 0.07 }); noise(0.08, { f: 1200, q: 2, v: 0.25, t: 0.17 }); },
    sip() { noise(0.28, { f: 700, f2: 2200, q: 4, v: 0.3 }); tone(500, 0.05, { f2: 800, v: 0.08, t: 0.25 }); },
    ring() { for (let i = 0; i < 8; i++) tone(i % 2 ? 1500 : 1250, 0.06, { w: 'square', v: 0.07, t: i * 0.06, lp: 3500 }); },
    phone() { tone(1046, 0.08, { w: 'triangle', v: 0.2 }); tone(1568, 0.14, { w: 'triangle', v: 0.2, t: 0.09 }); },
    whoosh() { noise(0.32, { f: 400, f2: 3000, q: 1.5, v: 0.3, a: 0.08 }); },
    boom() { tone(130, 0.6, { f2: 35, v: 0.5 }); noise(0.7, { ty: 'lowpass', f: 1200, f2: 80, v: 0.5 }); },
    tweet() { tone(2200, 0.07, { f2: 3200, v: 0.12 }); tone(2400, 0.09, { f2: 3600, v: 0.12, t: 0.1 }); },
    pop() { tone(350, 0.07, { f2: 1100, v: 0.25 }); },
    charge() { tone(180, 0.55, { w: 'sawtooth', f2: 900, lp: 2000, v: 0.15, vib: [14, 15], a: 0.05 }); },
    sting() { [60, 63, 66].forEach(m => tone(mf(m), 0.7, { w: 'sawtooth', lp: 1800, v: 0.1 })); tone(mf(48), 0.7, { w: 'square', lp: 600, v: 0.15 }); },
    ding() { tone(1760, 0.6, { v: 0.18 }); tone(2637, 0.3, { v: 0.06 }); },
    camera() { noise(0.03, { ty: 'highpass', f: 3000, v: 0.3 }); noise(0.12, { f: 2000, q: 0.7, v: 0.2, t: 0.05 }); tone(2400, 0.03, { w: 'square', v: 0.05, t: 0.04 }); },
    tick() { tone(2000, 0.02, { w: 'square', v: 0.06, lp: 4000 }); },
    heli() { for (let i = 0; i < 10; i++) noise(0.06, { ty: 'lowpass', f: 500, v: 0.35, t: i * 0.065 }); },
    laugh() { for (let i = 0; i < 4; i++) tone(520 - i * 35, 0.09, { w: 'triangle', f2: 420 - i * 35, bp: 1100, q: 2, v: 0.35, t: i * 0.12 }); },
    box() { tone(160, 0.18, { f2: 60, v: 0.4 }); noise(0.12, { ty: 'lowpass', f: 700, v: 0.3 }); },
    timeout() { arp([67, 64, 60], { s: 0.16, d: 0.15, w: 'square', v: 0.1, lp: 1500 }); tone(mf(55), 0.5, { w: 'square', lp: 1200, v: 0.1, t: 0.48, vib: [6, 6] }); },
    buy() { tone(2093, 0.12, { v: 0.15 }); tone(2637, 0.4, { v: 0.15, t: 0.08 }); noise(0.06, { f: 5000, q: 3, v: 0.12, t: 0.02 }); },
    door() { noise(0.28, { f: 300, f2: 1500, v: 0.25, a: 0.08 }); tone(95, 0.18, { f2: 55, v: 0.45, t: 0.26 }); noise(0.06, { ty: 'lowpass', f: 500, v: 0.3, t: 0.26 }); },
    key() { tone(1500, 0.05, { w: 'square', v: 0.08 }); tone(2000, 0.08, { w: 'square', v: 0.08, t: 0.08 }); },
    denied() { tone(110, 0.16, { w: 'sawtooth', lp: 900, v: 0.25 }); tone(110, 0.22, { w: 'sawtooth', lp: 900, v: 0.25, t: 0.2 }); },
    squeak() { tone(700, 0.28, { w: 'triangle', p: [[0.1, 1150], [0.28, 800]], vib: [30, 40], lp: 2500, v: 0.15, a: 0.02 }); },
    secret() { arp([72, 76, 79, 83, 84, 88, 91, 96], { s: 0.06, d: 0.25, w: 'triangle', v: 0.12 }); S.magic(); },
    laser() { tone(1600, 0.16, { w: 'sawtooth', f2: 300, lp: 3000, v: 0.1 }); tone(90, 0.16, { w: 'square', lp: 400, v: 0.05 }); },
    hush() { [2600, 3200, 2900].forEach((f, i) => tone(f, 0.06, { v: 0.07, t: i * 0.07 })); tone(210, 0.4, { w: 'triangle', p: [[0.2, 230], [0.4, 190]], lp: 700, vib: [6, 5], v: 0.25, t: 0.22, a: 0.05 }); },
    escort() { [67, 66, 65].forEach((m, i) => tone(mf(m), 0.3, { w: 'sawtooth', lp: 900, v: 0.12, t: i * 0.32, a: 0.03 })); tone(mf(64), 0.8, { w: 'sawtooth', lp: 900, v: 0.12, t: 0.96, vib: [6, 8], a: 0.03 }); },
    stamp() { tone(95, 0.22, { f2: 40, v: 0.55 }); noise(0.08, { ty: 'lowpass', f: 900, v: 0.4 }); },
    paper() { for (let i = 0; i < 3; i++) noise(0.07, { f: 2500 + i * 600, q: 1.2, v: 0.15, t: i * 0.055 }); },
    pin() { tone(3000, 0.015, { w: 'square', v: 0.05 }); tone(1200, 0.04, { v: 0.1, t: 0.01 }); },
    star(a) { const b = 76 + Math.max(0, Math.min(2, a | 0)) * 4; tone(mf(b), 0.12, { w: 'triangle', v: 0.22 }); tone(mf(b + 7), 0.35, { w: 'triangle', v: 0.2, t: 0.08 }); tone(mf(b + 24), 0.3, { v: 0.05, t: 0.1 }); },
    whistle() { tone(2300, 0.45, { w: 'square', vib: [32, 120], bp: 2300, q: 3, v: 0.3, a: 0.01 }); },
    alarm() { tone(600, 0.8, { w: 'sawtooth', p: [[0.2, 950], [0.4, 600], [0.6, 950], [0.8, 600]], lp: 2000, v: 0.12 }); },
    coffeeLow() { tone(520, 0.08, { v: 0.15 }); tone(520, 0.08, { v: 0.15, t: 0.14 }); },
    coffeeOut() { tone(520, 0.75, { w: 'triangle', f2: 110, vib: [8, 25], v: 0.22 }); },
    click() { tone(900, 0.03, { f2: 600, v: 0.12 }); },
    open() { noise(0.15, { f: 500, f2: 2500, v: 0.15 }); tone(400, 0.12, { f2: 800, v: 0.08 }); },
    close() { noise(0.15, { f: 2500, f2: 500, v: 0.15 }); tone(800, 0.12, { f2: 400, v: 0.08 }); },
    error() { tone(150, 0.1, { w: 'square', lp: 500, v: 0.18 }); tone(130, 0.14, { w: 'square', lp: 500, v: 0.18, t: 0.14 }); },
    levelStart() { arp([67, 72, 76], { s: 0.11, d: 0.1, w: 'square', lp: 2500, v: 0.1 }); tone(mf(79), 0.35, { w: 'square', lp: 2500, v: 0.1, t: 0.33 }); tone(mf(84), 0.35, { w: 'triangle', v: 0.1, t: 0.33 }); },
    clockSpin() { let t = 0; for (let i = 0; i < 26; i++) { tone(i % 2 ? 1800 : 2400, 0.015, { w: 'square', v: 0.05, lp: 4000, t }); t += 0.06 - 0.03 * i / 26; } },
    snore() { for (let i = 0; i < 2; i++) { const t = i * 0.8; tone(70, 0.45, { w: 'sawtooth', lp: 300, v: 0.18, t, a: 0.15 }); noise(0.45, { f: 400, f2: 800, v: 0.08, t, a: 0.15 }); noise(0.3, { f: 900, f2: 300, v: 0.05, t: t + 0.47, a: 0.08 }); } },
    thud() { tone(110, 0.25, { f2: 45, v: 0.45 }); noise(0.15, { ty: 'lowpass', f: 300, v: 0.35 }); },
    splash() { noise(0.35, { f: 1500, f2: 400, q: 0.8, v: 0.3 }); [0, 0.08, 0.15].forEach(t => tone(300, 0.06, { f2: 800, v: 0.12, t: t + 0.05 })); },
    gulp() { tone(320, 0.1, { f2: 120, lp: 800, v: 0.3 }); tone(250, 0.06, { f2: 600, v: 0.15, t: 0.12 }); },
    magic() { for (let i = 0; i < 10; i++) tone(1500 + Math.random() * 1500, 0.25, { v: 0.05, t: i * 0.04, vib: [20, 30] }); },
    unlock() { arp([60, 64, 67, 72], { s: 0.1, d: 0.14, w: 'square', lp: 3000, v: 0.09 }); [72, 76, 79, 84].forEach(m => tone(mf(m), 0.7, { w: 'triangle', v: 0.09, t: 0.42 })); S.magic(); },

    // ----- vehicles / chase -----
    engine() { // starter cranks, then the engine catches and settles into idle
      for (let i = 0; i < 4; i++) {
        tone(42, 0.1, { w: 'sawtooth', f2: 30, lp: 500, v: 0.28, t: i * 0.12, a: 0.012 });
        noise(0.09, { ty: 'lowpass', f: 700, v: 0.16, t: i * 0.12 });
      }
      tone(40, 1.1, { w: 'sawtooth', p: [[0.2, 125], [0.45, 70], [1.1, 55]], lp: 900, v: 0.3, t: 0.5, a: 0.03, vib: [22, 6] });
      tone(20, 1.1, { w: 'square', p: [[0.2, 62], [0.45, 35], [1.1, 28]], lp: 300, v: 0.22, t: 0.5, a: 0.03 });
      noise(0.45, { ty: 'lowpass', f: 900, f2: 250, v: 0.15, t: 0.5 });
    },
    honk() { // little hatchback "meep-meeep"
      [[0, 0.13], [0.19, 0.32]].forEach(([t, d]) => {
        tone(415, d, { w: 'square', lp: 1800, v: 0.11, t, a: 0.01 });
        tone(523, d, { w: 'square', lp: 1800, v: 0.09, t, a: 0.01 });
      });
    },
    crash() {
      noise(0.65, { ty: 'lowpass', f: 2800, f2: 180, v: 0.5, a: 0.002 });
      tone(95, 0.45, { f2: 32, v: 0.55 });
      for (let i = 0; i < 6; i++) tone(1700 + Math.random() * 3000, 0.2 + Math.random() * 0.3, { w: 'square', bp: 3200, q: 9, v: 0.05, t: 0.03 + Math.random() * 0.25 });
      for (let i = 0; i < 5; i++) noise(0.05, { ty: 'highpass', f: 5500, v: 0.12, t: 0.12 + i * 0.07 + Math.random() * 0.04 });
    },
    nitro() {
      noise(0.9, { f: 300, f2: 4500, q: 1.2, v: 0.55, a: 0.12 });
      noise(0.9, { ty: 'lowpass', f: 450, v: 0.25, a: 0.04 });
      tone(150, 0.9, { w: 'sawtooth', f2: 950, lp: 2600, v: 0.12, a: 0.08, vib: [30, 20] });
      tone(mf(88), 0.25, { w: 'triangle', f2: mf(96), v: 0.05, t: 0.02 });
    },
    skid() {
      noise(0.7, { f: 1700, f2: 1100, q: 4, v: 0.8, a: 0.02 });
      tone(950, 0.7, { w: 'sawtooth', f2: 700, bp: 1300, q: 5, v: 0.16, vib: [25, 60], a: 0.02 });
    },
    motoRev() { // brap-brap motorbike rev
      tone(70, 1.1, { w: 'sawtooth', p: [[0.15, 185], [0.35, 120], [0.55, 245], [1.1, 90]], lp: 1700, v: 0.22, vib: [35, 10], a: 0.02 });
      tone(35, 1.1, { w: 'square', p: [[0.15, 92], [0.35, 60], [0.55, 122], [1.1, 45]], lp: 500, v: 0.18, a: 0.02 });
      noise(0.5, { ty: 'lowpass', f: 600, v: 0.08, t: 0.4, a: 0.05 });
    },
    siren() {
      tone(700, 1.6, { w: 'square', p: [[0.4, 1300], [0.8, 700], [1.2, 1300], [1.6, 700]], lp: 1800, v: 0.07, a: 0.04 });
      tone(704, 1.6, { w: 'triangle', p: [[0.4, 1306], [0.8, 704], [1.2, 1306], [1.6, 704]], v: 0.06, a: 0.04 });
    },
    brake() {
      tone(2600, 0.45, { w: 'triangle', f2: 2200, vib: [40, 80], bp: 2600, q: 4, v: 0.15, a: 0.02 });
      noise(0.4, { f: 2000, q: 2, v: 0.12, a: 0.02 });
    },
    vent() { // hollow tin bonks + scrape while crawling through a duct
      [0, 0.16, 0.3].forEach((t, i) => {
        tone(165 + i * 28, 0.26, { w: 'triangle', f2: 135, v: 0.28, t });
        tone(860 + i * 95, 0.35, { v: 0.045, t, vib: [6, 8] });
      });
      noise(0.5, { f: 900, q: 10, v: 0.2, t: 0.02, a: 0.06 });
    },
    printer() { // copy machine: whirr, light sweep, clunk
      tone(110, 1.0, { w: 'sawtooth', lp: 500, v: 0.12, a: 0.08, vib: [12, 4] });
      noise(0.95, { f: 600, q: 2, v: 0.1, a: 0.1 });
      noise(0.6, { f: 1500, f2: 4000, q: 1, v: 0.08, t: 0.2, a: 0.2 });
      tone(120, 0.13, { f2: 50, v: 0.4, t: 1.0 });
      noise(0.08, { ty: 'lowpass', f: 800, v: 0.3, t: 1.0 });
      tone(300, 0.06, { w: 'square', lp: 800, v: 0.1, t: 1.12 });
    },
    fanfare() { // big unlock: brass pickup + held major chord + cymbal
      [[67, 0, 0.1], [67, 0.12, 0.1], [67, 0.24, 0.1], [72, 0.38, 0.95]].forEach(([m, t, d]) => {
        tone(mf(m), d, { w: 'sawtooth', lp: 2300, v: 0.1, a: 0.02, t, vib: d > 0.5 ? [6, 4] : null });
        tone(mf(m - 12), d, { w: 'square', lp: 1100, v: 0.06, a: 0.02, t });
      });
      [76, 79, 84].forEach(m => tone(mf(m), 0.95, { w: 'sawtooth', lp: 2300, v: 0.06, a: 0.03, t: 0.38, vib: [6, 4] }));
      tone(mf(48), 0.95, { w: 'triangle', v: 0.3, t: 0.38 });
      noise(1.2, { ty: 'highpass', f: 6000, v: 0.12, t: 0.38, a: 0.005 });
      for (let i = 0; i < 6; i++) tone(mf([96, 100, 103, 108][i % 4]), 0.3, { v: 0.04, t: 0.45 + i * 0.07, vib: [12, 15] });
    },
    glow() { // soft sparkly shimmer for a highlighted button
      const ps = [84, 88, 91, 96, 100, 103];
      for (let i = 0; i < 6; i++) tone(mf(ps[(i * 2 + (Math.random() * 3 | 0)) % 6]), 0.35, { v: 0.035, t: i * 0.05, a: 0.03, vib: [9, 12] });
      noise(0.5, { ty: 'highpass', f: 7000, v: 0.025, a: 0.15 });
    }
  };
  function sfx(name, arg) {
    try { if (ctx && settings.sfx && Object.prototype.hasOwnProperty.call(S, name)) S[name](arg); } catch (e) {}
  }

  // ---------- continuous engine hum ----------
  const clamp01 = x => Math.max(0, Math.min(1, +x || 0));
  function engStart(p) {
    const t = ctx.currentTime, o1 = ctx.createOscillator(), o2 = ctx.createOscillator();
    const lp = ctx.createBiquadFilter(), g = ctx.createGain();
    o1.type = 'sawtooth'; o2.type = 'square';
    lp.type = 'lowpass'; lp.Q.value = 2;
    o1.connect(lp); o2.connect(lp); lp.connect(g); g.connect(sfxB);
    g.gain.setValueAtTime(0.0001, t);
    eng = { o1, o2, lp, g };
    engSet(p, true);
    o1.start(t); o2.start(t);
  }
  function engSet(p, first) {
    const t = ctx.currentTime, k = first ? 0.01 : 0.08, f = 34 + p * 120;
    eng.o1.frequency.setTargetAtTime(f, t, k);
    eng.o2.frequency.setTargetAtTime(f * 0.5 + 0.7, t, k);
    eng.lp.frequency.setTargetAtTime(260 + p * 1500, t, k);
    eng.g.gain.setTargetAtTime(0.028 + p * 0.03, t, first ? 0.06 : 0.1);
  }
  function engStop() {
    if (!eng) return;
    const e = eng, t = ctx.currentTime;
    eng = null;
    try {
      e.g.gain.cancelScheduledValues(t); e.g.gain.setTargetAtTime(0, t, 0.06);
      e.o1.stop(t + 0.45); e.o2.stop(t + 0.45);
    } catch (er) {}
  }
  // AUDIO.engine(on, pitch): on=false stops; pitch 0..1 ≈ rpm. Respects settings.sfx.
  function engine(on, pitch) {
    try {
      engWant = on ? { p: clamp01(pitch) } : null;
      if (!ctx) return;
      if (!on || !settings.sfx) { engStop(); return; }
      if (!eng) engStart(engWant.p); else engSet(engWant.p);
    } catch (e) {}
  }

  // ---------- babble voices (gibberish speech) ----------
  // f base pitch, w source wave, fs formant scale (vowel colour / head size), vw vowel bias,
  // sp syllable length, rng pitch range (semis), jit per-char pitch variety, vol, br breath,
  // lp brightness, vib [rate, semis], nas nasal twang, gr growl, dist distortion, leg legato,
  // clip staccato fraction, rest pause scale, q quirk
  const VP = {
    kiana: { f: 290, w: 'sawtooth', fs: 1.12, vw: 'aeaioa', sp: 0.085, rng: 5.5, jit: 1.5, vol: 1, br: 0.06, lp: 3800 },
    hiroman: { f: 150, w: 'sawtooth', fs: 0.93, vw: 'aoeau', sp: 0.09, rng: 4, jit: 1, vol: 1, br: 0.04, lp: 2600 },
    nokhod: { f: 520, w: 'square', fs: 1.35, vw: 'iaeia', sp: 0.058, rng: 7, jit: 2.5, vol: 0.55, lp: 5000, q: 'bubbly' },
    golab: { f: 225, w: 'triangle', fs: 1.02, vw: 'aoau', sp: 0.1, rng: 3.5, jit: 0.8, vol: 1.3, br: 0.08, lp: 2500, leg: 1 },
    intern: { f: 168, w: 'sawtooth', fs: 1, vw: 'eiea', sp: 0.064, rng: 5, jit: 3, vol: 0.85, vib: [9, 0.35], lp: 3200, rest: 0.7 },
    anis: { f: 300, w: 'triangle', fs: 1.16, vw: 'ieai', sp: 0.075, rng: 4.5, jit: 1.2, vol: 1.15, br: 0.16, lp: 3600, q: 'giggle' },
    saadi: { f: 125, w: 'sawtooth', fs: 0.9, vw: 'aou', sp: 0.15, rng: 7, jit: 0, vol: 0.9, vib: [5, 0.3], lp: 2200, leg: 1, q: 'sing', rest: 1.4 },
    arsi: { f: 118, w: 'sawtooth', fs: 0.88, vw: 'aoa', sp: 0.1, rng: 2.5, jit: 0.8, vol: 0.9, nas: 0.9, lp: 2300, q: 'cool' },
    javid: { f: 160, w: 'sawtooth', fs: 1, vw: 'aeia', sp: 0.052, rng: 4, jit: 1.5, vol: 0.85, nas: 0.45, lp: 3200, rest: 0.4, q: 'patter' },
    accountant: { f: 140, w: 'square', fs: 1.05, vw: 'eie', sp: 0.062, rng: 3, jit: 0.8, vol: 0.6, nas: 1.3, lp: 2600, clip: 0.55 },
    gossip: { f: 330, w: 'square', fs: 1.15, vw: 'aeiea', sp: 0.05, rng: 7, jit: 2.5, vol: 0.48, lp: 3800, rest: 0.5 },
    lenz: { f: 150, w: 'square', fs: 1, vw: 'eoi', sp: 0.075, rng: 6, jit: 0, vol: 0.55, lp: 3000, q: 'robot' },
    builder: { f: 110, w: 'sawtooth', fs: 0.86, vw: 'aou', sp: 0.09, rng: 3, jit: 1, vol: 1, lp: 2000, gr: 0.25 },
    foreman: { f: 90, w: 'sawtooth', fs: 0.82, vw: 'aoa', sp: 0.08, rng: 3, jit: 1, vol: 1.1, lp: 1900, gr: 0.4, q: 'bark' },
    guard: { f: 85, w: 'sawtooth', fs: 0.8, vw: 'oau', sp: 0.1, rng: 1.5, jit: 0.5, vol: 1, lp: 1600 },
    zarrin: { f: 100, w: 'sawtooth', fs: 0.85, vw: 'oao', sp: 0.12, rng: 6, jit: 0.6, vol: 1, vib: [5.5, 0.35], lp: 2000, q: 'pomp' },
    katy: { f: 262, w: 'triangle', fs: 1.05, vw: 'aei', sp: 0.095, rng: 4, jit: 1, vol: 1.2, vib: [7, 0.45], br: 0.1, lp: 3000 },
    katyEvil: { f: 135, w: 'sawtooth', fs: 0.8, vw: 'aou', sp: 0.11, rng: 5, jit: 1, vol: 0.5, vib: [4.5, 0.6], lp: 1800, dist: 1, q: 'evil' },
    narrator: { f: 190, w: 'triangle', fs: 1, vw: 'aeo', sp: 0.08, rng: 2, jit: 0.5, vol: 0.75, br: 0.08, lp: 2000 },
    cam: { q: 'beep', f: 1400, sp: 0.06, vol: 0.5 },
    _: { f: 200, w: 'sawtooth', fs: 1, vw: 'aeiou', sp: 0.08, rng: 4, jit: 1, vol: 1, lp: 3000 }
  };
  const ALIAS = { hohiro: 'hiroman', chai: 'katy', chaiEvil: 'katyEvil', camera: 'cam', boss: 'zarrin' };
  // vowel formants [F1, F2] (adult neutral; scaled by profile fs)
  const VOW = { a: [760, 1300], A: [700, 1080], e: [500, 1850], i: [330, 2300], o: [500, 900], u: [360, 820] };
  // consonant classes: k p=plosive f=fricative a=affricate n=nasal l=liquid r=tap; loc F2 locus, nf/nq/nv/nd noise
  const CK = {};
  const cadd = (s, k, loc, nf, nq, nv, nd) => { for (const c of s) CK[c] = { k, loc, nf, nq, nv, nd }; };
  cadd('بپbp', 'p', 800, 600, 1, 0.5, 0.012);
  cadd('تطدtd', 'p', 1800, 4000, 1, 0.45, 0.014);
  cadd('کگقkgqc', 'p', 1500, 2000, 2, 0.5, 0.018);
  cadd('جچj', 'a', 2000, 3000, 2, 0.4, 0.04);
  cadd('سصثزذضظszx', 'f', 1700, 6500, 1.5, 0.28, 0.06);
  cadd('شژ', 'f', 1900, 3000, 2, 0.34, 0.06);
  cadd('فfv', 'f', 1000, 5000, 0.8, 0.15, 0.05);
  cadd('خغ', 'f', 1300, 1400, 3, 0.32, 0.06);
  cadd('حهh', 'f', 1500, 1600, 0.6, 0.14, 0.04);
  cadd('مm', 'n', 900); cadd('نn', 'n', 1700);
  cadd('لl', 'l', 1300); cadd('رr', 'r', 1300);
  const VCH = { 'ا': 'A', 'آ': 'A', 'أ': 'A', 'إ': 'e', 'ع': 'a', 'ء': 'a', 'ئ': 'e', 'ؤ': 'o', 'و': 'ou', 'ی': 'ie', 'ي': 'ie', 'ى': 'ie', 'ة': 'e', 'w': 'u', 'y': 'i',
    a: 'a', e: 'e', i: 'i', o: 'o', u: 'u' };
  const SING = [0, 4, 7, 9, 7, 4, 2, 0, 2, 4, 9, 7, 4, 2, 0, -3];
  const SKIP = /[\s\u0000-/:-@[-`{-¿،؛؟ـ٪-٭۔ -⁯　-〿﻿]/;
  const END = /[.!?؟…\n]/;
  const ST = {}, HINT = {};
  let act = [];
  const hh = (c, k) => (((c + k * 131) * 2654435761) >>> 0) % 1000 / 1000;
  const st2 = n => Math.pow(2, n / 12);

  // one syllable: consonant (noise/locus transition) + buzzy vowel through 2 formant peaks
  function syl(P, out, t, d, fA, fB, fC, V, C, vol, br, lpF) {
    const fs = P.fs || 1, lead = C && (C.k === 'f' || C.k === 'a') ? C.nd : 0, tv = t + lead * 0.8;
    const o = ctx.createOscillator();
    o.type = P.w || 'sawtooth';
    o.frequency.setValueAtTime(fA, tv);
    o.frequency.exponentialRampToValueAtTime(fB, tv + d * 0.22);
    o.frequency.exponentialRampToValueAtTime(fC, tv + d * 0.5);
    if (P.vib) {
      const l = ctx.createOscillator(), lg = ctx.createGain();
      l.frequency.value = P.vib[0]; lg.gain.value = fB * (st2(P.vib[1]) - 1);
      l.connect(lg); lg.connect(o.frequency); l.start(tv); l.stop(tv + d + 0.04);
    }
    let n = o;
    if (P.dist && curve) { const ws = ctx.createWaveShaper(); ws.curve = curve; o.connect(ws); n = ws; }
    const F1 = ctx.createBiquadFilter(), F2 = ctx.createBiquadFilter(), lp = ctx.createBiquadFilter(), g = ctx.createGain();
    const v1 = VOW[V][0] * fs, v2 = VOW[V][1] * fs;
    F1.type = 'peaking'; F1.Q.value = 3.5; F1.gain.value = P.nas ? 6 : 12;
    F1.frequency.setValueAtTime(C ? 320 * fs : v1, tv); F1.frequency.linearRampToValueAtTime(v1, tv + 0.04);
    F2.type = 'peaking'; F2.Q.value = 5; F2.gain.value = 13;
    F2.frequency.setValueAtTime(C && C.loc ? C.loc * fs : v2, tv); F2.frequency.exponentialRampToValueAtTime(v2, tv + Math.min(0.05, d * 0.4));
    lp.type = 'lowpass'; lp.Q.value = 0.7;
    if (C && C.k === 'n') { lp.frequency.setValueAtTime(380, tv); lp.frequency.exponentialRampToValueAtTime(lpF, tv + 0.035); }
    else lp.frequency.value = lpF;
    n.connect(F1); F1.connect(F2);
    let m = F2;
    if (P.nas) { const nz = ctx.createBiquadFilter(); nz.type = 'peaking'; nz.frequency.value = 1250 * fs; nz.Q.value = 5; nz.gain.value = 10 * P.nas; F2.connect(nz); m = nz; }
    m.connect(lp);
    let x = lp;
    if (P.gr) {
      const g2 = ctx.createGain(), l = ctx.createOscillator(), lg = ctx.createGain();
      g2.gain.value = 1 - P.gr; l.frequency.value = 34 + fB * 0.1; lg.gain.value = P.gr;
      l.connect(lg); lg.connect(g2.gain); lp.connect(g2); x = g2; l.start(tv); l.stop(tv + d + 0.04);
    }
    x.connect(g); g.connect(out);
    const a = P.leg ? 0.028 : P.q === 'bark' ? 0.004 : C ? 0.008 : 0.016;
    const sd = P.clip ? d * P.clip : d;
    g.gain.setValueAtTime(0.0001, tv);
    g.gain.exponentialRampToValueAtTime(vol, tv + a);
    if (C && C.k === 'r' && sd > 0.07) { g.gain.linearRampToValueAtTime(vol * 0.3, tv + a + 0.012); g.gain.linearRampToValueAtTime(vol, tv + a + 0.026); }
    g.gain.linearRampToValueAtTime(vol * 0.75, tv + sd * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, tv + sd);
    o.start(tv); o.stop(tv + sd + 0.03);
    if (C && (C.k === 'p' || C.k === 'f' || C.k === 'a')) {
      const nd = C.k === 'p' ? C.nd : lead;
      noise(nd + 0.006, { at: C.k === 'p' ? tv : t, f: C.nf * (0.85 + fs * 0.15), q: C.nq, v: vol * C.nv * (C.k === 'p' ? 0.6 : 0.5), a: C.k === 'p' ? 0.002 : 0.012, out });
    }
    if (br > 0) noise(sd, { at: tv, f: v2, q: 1.1, v: vol * br, a: 0.02, out });
    return { o, tv, e: tv + sd, f: fC };
  }

  function busy(now) {
    if (act.length > 3) act = act.filter(e => e > now);
    return act.length >= 6;
  }
  // bend the speaker's last syllable at a sentence end (when no line hint told us earlier)
  function bendEnd(st, P, ch, now) {
    const L = st.last; if (!L || st.fin) return;
    const r = ch === '?' || ch === '؟' ? 1.45 : ch === '!' ? 1.12 : 0.84;
    if (L.e > now + 0.03) { try { L.o.frequency.exponentialRampToValueAtTime(L.f * r, L.e); } catch (e) {} }
    else if (r > 1.3 && now - L.e < 0.3 && P.q !== 'beep') { // short rising "eh?" tail
      const t = Math.max(now + 0.01, st.next), d = (P.sp || 0.08) * 1.3;
      const L2 = syl(P, st.out, t, d, L.f, L.f * 1.1, L.f * 1.5, 'e', null, st.vol, st.br, st.lpF);
      st.next = L2.e; act.push(L2.e);
    }
    st.fin = true;
  }
  function giggle(st, P, now) {
    const t0 = Math.max(now + 0.02, st.next), f = P.f * 1.7;
    for (let i = 0; i < 2; i++) syl(P, st.out, t0 + i * 0.1, 0.07, f * (1.1 + i * 0.1), f * (1.15 + i * 0.12), f * (1.02 + i * 0.1), 'i', CK['ه'], st.vol * 0.9, 0.3, st.lpF);
    st.next = t0 + 0.24;
  }
  function rest(st, P, ch, now) {
    const on = st.next > now - 0.06, base = Math.max(st.next, now), rs = P.rest || 1;
    if (END.test(ch)) {
      bendEnd(st, P, ch, now);
      if (P.q === 'giggle' && ch !== '?' && ch !== '؟' && (st.gc = (st.gc || 0) + 1) % 2 === 1) giggle(st, P, now);
      if (on) st.next = Math.max(st.next, now) + 0.2 * rs;
      st.n = 0; st.fin = false; st.word = true;
      if (ch === '!') st.ex = 3;
    } else if (/[،,;؛:\/«»()\-–—]/.test(ch)) {
      if (on) st.next = base + 0.11 * rs;
      st.word = true;
      if (ch === '/') st.n = 0;
    } else {
      if (on) st.next = base + 0.045 * rs;
      st.word = true;
    }
  }

  // AUDIO.voice(who, ch, {think, excited}) — called per typed character
  function voice(who, ch, op) {
    try {
      if (!ctx || !settings.voice || ch == null || !live()) return;
      ch = String(ch).charAt(0);
      if (!ch || ch === '‌' || ch === '‍') return; // zero-width joiners: part of the word
      op = op || {};
      const key = ALIAS[who] || who, P = VP[key] || VP._, th = !!op.think;
      const sk = key + (th ? '~' : ''), now = ctx.currentTime;
      const st = ST[sk] || (ST[sk] = { next: 0, n: 0, last: null, fin: false, word: true, ex: 0 });
      if (now > st.next + 0.45) { st.n = 0; st.fin = false; st.word = true; st.ex = 0; }
      st.out = th && thinkB ? thinkB : voxB;
      st.vol = 0.25 * (P.vol || 1) * (th ? 0.55 : 1);
      st.br = th ? 0.45 : (P.br || 0);
      st.lpF = th ? Math.min(P.lp || 3000, 1900) : (P.lp || 3000);

      // optional line hint (AUDIO.voiceLine) → we know where the sentence ends
      let fin = 0, endCh = '';
      const H = HINT[key];
      if (H) {
        const s = H.s;
        let k = -1;
        for (let j = H.p; j < Math.min(s.length, H.p + 8); j++) if (s[j] === ch) { k = j; break; }
        if (k < 0 || H.p >= s.length) { if (++H.miss > 3 || H.p >= s.length) delete HINT[key]; } // stale hint
        else {
          H.p = k + 1; H.miss = 0;
          let j = k + 1, rem = 0;
          while (j < s.length && !END.test(s[j])) { if (!SKIP.test(s[j])) rem++; j++; }
          endCh = s[j] || '.';
          fin = rem <= 1 ? 2 : rem <= 5 ? 1 : 0;
        }
      }
      if (SKIP.test(ch)) { rest(st, P, ch, now); return; }

      const c = ch.charCodeAt(0), lc = ch.toLowerCase(), h1 = hh(c, 1), h2 = hh(c, 2), h3 = hh(c, 3);
      const vc = VCH[ch] || VCH[lc];
      let C = vc ? null : CK[ch] || CK[lc] || (h3 < 0.5 ? CK['ت'] : h3 < 0.75 ? CK['م'] : CK['ک']);
      const V = vc ? vc[vc.length > 1 ? (h1 < 0.5 ? 0 : 1) : 0] : (P.vw || 'aeiou')[Math.floor(h1 * (P.vw || 'aeiou').length)];
      const ex = op.excited || st.ex > 0;
      if (st.ex > 0) st.ex--;
      const q = endCh === '?' || endCh === '؟';

      let d = (P.sp || 0.08) * (0.75 + h2 * 0.5) * (vc && vc !== 'e' ? 1.25 : 1) * (th ? 1.12 : 1) * (ex ? 0.9 : 1);
      if (fin === 2) d *= P.q === 'cool' ? 1.7 : 1.35;
      const lead = C && (C.k === 'f' || C.k === 'a') ? C.nd : 0;
      const t = Math.max(now + 0.01, st.next);
      if (t > now + 0.09 || busy(now)) return; // speaker still talking → drop (no pile-up)

      // ----- electronic beeps (cameras) -----
      if (P.q === 'beep') {
        const f = [1200, 1500, 1800, 2400][Math.floor(h1 * 4)] * (ex ? 1.25 : 1);
        tone(f, 0.05, { w: 'square', lp: 4000, v: 0.22 * P.vol, at: t, out: voxB });
        if (h2 > 0.6) tone(f * 1.5, 0.03, { w: 'square', lp: 4000, v: 0.15 * P.vol, at: t + 0.055, out: voxB });
        st.next = t + 0.09; act.push(t + 0.09);
        return;
      }

      // ----- pitch contour -----
      let semi;
      if (P.q === 'sing') semi = SING[st.n % SING.length] + (h1 - 0.5) * 0.5;
      else semi = P.rng * (0.35 - Math.min(st.n, 10) * 0.07 + (h1 - 0.5) * 0.5) + (st.word ? P.rng * 0.15 : 0) + (h3 - 0.5) * P.jit;
      semi += (Math.random() - 0.5) * 0.35;
      if (q && fin) semi += fin * 1.2;
      if (ex) semi += 3 + P.rng * 0.2;
      if (th) semi -= 1.5;
      if (P.q === 'bubbly' && h2 > 0.82) semi += 5;
      if (P.q === 'robot') semi = Math.round(semi / 3) * 3;
      const f = P.f * st2(semi);
      let fA = f * 1.04, fB = f, fC = f * 0.98;
      switch (P.q) {
        case 'bubbly': fA = f * 0.92; fB = f * 1.05; fC = f * 1.12; break;
        case 'cool': fA = f * 1.05; fC = f * 0.9; break;
        case 'bark': fA = f * 1.15; fC = f * 0.8; break;
        case 'pomp': if (st.word) fA = f * 1.2; fC = f * 0.95; break;
        case 'evil': fA = f; fC = f * 0.86; break;
        case 'robot': fA = fB = fC = f; break;
        case 'patter': fC = f * 1.02; break;
      }
      if (fin === 2) {
        if (q) { fB = f * 1.08; fC = f * 1.5; }
        else if (endCh === '!') { fA = f * 1.18; fC = f * 0.9; }
        else fC = f * 0.8;
      }
      let vol = st.vol * (ex ? 1.3 : 1) * (st.word ? 1.1 : 1) * (fin === 2 && endCh === '!' ? 1.15 : 1);

      const L = syl(P, st.out, t, d, fA, fB, fC, V, C, vol, st.br, st.lpF);
      st.last = L; act.push(L.e);
      st.next = t + lead * 0.8 + d * (P.leg ? 0.9 : 1);
      st.n++; st.word = false;
      if (fin === 2) st.fin = true;
      if (P.q === 'giggle' && ex && h3 > 0.85) giggle(st, P, now);
    } catch (e) {}
  }
  // Optional hint: tell the voice the full line before typing it, so the per-char voice()
  // calls know where sentences end (proper question rise / statement fall).
  function voiceLine(who, text) {
    try {
      const key = ALIAS[who] || who;
      HINT[key] = { s: String(text || ''), p: 0, miss: 0 };
      [key, key + '~'].forEach(k => { const st = ST[k]; if (st) { st.n = 0; st.fin = false; st.word = true; } });
    } catch (e) {}
  }
  // Convenience: babble a whole line by itself. Returns approx. duration in seconds.
  function speak(who, text, op) {
    try {
      text = String(text || '');
      voiceLine(who, text);
      for (let i = 0; i < text.length; i += 2) { const ch = text[i]; setTimeout(() => voice(who, ch, op), i * 23); }
      return text.length * 0.023 + 0.2;
    } catch (e) { return 0; }
  }

  // ---------- music ----------
  // m: melody tokens (semitones from r; '.' rest, '-' hold), 8 eighth-steps per bar, '|' = bar line
  // ch: bass chord root per bar (semitones from br), b: one-bar bass pattern, d: one-bar drums (k s h .)
  const TR = {
    title: { bpm: 132, r: 72, br: 48, mw: 'square', mv: 0.2, bw: 'triangle', bv: 0.5, dv: 1, sw: 0, d: 'khshkhsh', b: '0 . 7 . 12 . 7 .', ch: [0, 5, 0, 7, 5, 0, 7, 0],
      m: '0 . 4 7 12 - 7 .|9 - 7 4 5 - 4 2|0 . 4 7 12 - 14 16|14 - 12 - 7 - . .|9 . 9 12 9 - 7 4|5 . 5 9 7 - 4 .|2 . 4 5 7 . 11 .|12 - - . 7 . 4 .' },
    cafe: { bpm: 96, r: 72, br: 36, mw: 'triangle', mv: 0.3, bw: 'sine', bv: 0.6, dv: 0.6, sw: 0.16, d: 'khshkhsh', b: '0 . 7 . 12 . 7 .', ch: [2, 7, 0, 9, 2, 7, 0, 0],
      m: '5 . 9 12 . 14 12 9|11 - 7 5 . 2 . 5|4 - 7 11 . 9 7 4|9 - - . 13 . 12 .|14 . 12 9 . 5 9 12|11 . 9 7 5 - 2 .|4 7 11 14 - 12 11 7|12 - - . . . . .' },
    sneak: { bpm: 116, r: 72, br: 36, mw: 'triangle', mv: 0.35, bw: 'triangle', bv: 0.55, dv: 0.5, sw: 0.1, pz: 1, d: 'k.h.k.h.', b: '0 . 7 . 0 . 7 .', ch: [0, 0, 0, 7, 5, 5, 7, 0],
      m: '0 . 3 . 7 . 6 .|7 . . 3 . . 0 .|0 . 3 . 7 . 8 .|7 . 5 . 3 . 2 .|5 . 8 . 12 . 11 .|12 . . 8 . . 5 .|3 2 3 . 7 . -1 .|0 . 7 . 0 . . .' },
    tense: { bpm: 152, r: 74, br: 38, mw: 'square', mv: 0.16, bw: 'triangle', bv: 0.55, dv: 0.7, sw: 0, pz: 1, d: 'khkhshkh', b: '0 . 0 12 0 . 0 12', ch: [0, 0, 8, 7],
      m: '0 0 3 . 0 0 7 .|6 . 7 . 3 . 0 .|0 0 3 . 0 0 8 .|7 . 5 . 3 . 2 .' },
    night: { bpm: 80, r: 69, br: 45, mw: 'sine', mv: 0.4, bw: 'triangle', bv: 0.45, dv: 0.4, sw: 0, d: 'k..h..h.', b: '0 - - - 7 - - -', ch: [0, 0, 8, 7, 5, 0, 7, 0],
      m: '7 - - . 3 - 2 -|0 - - - . . . .|8 - - . 7 - 3 -|2 - - - . . -1 .|12 - - . 10 - 8 -|7 - - - 3 . 5 .|3 - 2 - -1 - 2 -|0 - - - . . . .' },
    boss: { bpm: 144, r: 72, br: 36, mw: 'sawtooth', mv: 0.14, bw: 'sawtooth', bv: 0.3, dv: 0.9, sw: 0, pz: 1, d: 'khskkhsh', b: '0 0 12 0 0 0 12 0', ch: [0, 0, 8, 7, 5, 5, 7, 7],
      m: '0 0 0 3 . 0 7 .|6 . 7 . 3 2 0 .|8 8 8 7 . 5 3 .|2 . -1 . 2 . 7 .|5 5 5 8 . 5 12 .|11 . 12 . 8 7 5 .|3 3 3 2 . 0 -1 .|0 . 2 . 3 . -1 .' },
    story: { bpm: 84, r: 67, br: 43, mw: 'triangle', mv: 0.28, bw: 'sine', bv: 0.55, dv: 0, sw: 0, d: '', b: '0 - - - 7 - - -', ch: [0, 5, 7, 7, 0, -3, 7, 0],
      m: '4 - 7 - 9 - 7 -|4 - 2 - 0 - - -|2 - 4 - 7 - 4 -|2 - - - . . . .|4 - 7 - 12 - 11 -|9 - 7 - 4 - - -|2 - 4 - 2 - -1 -|0 - - - . . . .' },
    win: { bpm: 128, r: 72, br: 48, mw: 'square', mv: 0.18, bw: 'triangle', bv: 0.5, dv: 1, sw: 0, d: 'khshkhsh', b: '0 . 7 . 12 . 7 .', ch: [0, 5, 0, 7],
      m: '0 4 7 12 . 7 12 .|9 . 7 . 4 5 7 .|0 4 7 12 . 14 16 .|17 . 16 . 14 . 12 .' },
    // car / motorbike chase: D minor, driving octave bass, i–VI–VII–iv–V
    chase: { bpm: 168, r: 74, br: 38, mw: 'square', mv: 0.15, bw: 'sawtooth', bv: 0.28, dv: 1, sw: 0, d: 'khshkksh', b: '0 0 12 0 0 12 0 12', ch: [0, 0, 8, 10, 0, 0, 5, 7],
      m: '12 . 12 10 12 . 7 .|8 7 5 . 7 - . .|8 . 8 7 8 . 3 .|10 . 12 . 14 - 10 .|12 . 12 10 12 . 15 .|14 12 10 . 12 - . 7|5 . 8 . 12 . 10 .|7 . 11 . 14 - 12 11' }
  };
  function parse(s) {
    const a = s.replace(/\|/g, ' ').trim().split(/\s+/);
    return a.map((x, i) => {
      if (x === '.' || x === '-') return null;
      let l = 1; while (a[i + l] === '-') l++;
      return [+x, l];
    });
  }
  function mnote(out, t, m, d, w, v, pz) {
    const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    const e = pz ? Math.min(d, 0.22) : d;
    o.type = w; o.frequency.value = mf(m);
    f.type = 'lowpass'; f.frequency.value = pz ? 1800 : 2600;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(v, t + 0.008);
    g.gain.exponentialRampToValueAtTime(v * (pz ? 0.05 : 0.5), t + e * 0.85);
    g.gain.exponentialRampToValueAtTime(0.0001, t + e + 0.05);
    o.connect(f); f.connect(g); g.connect(out);
    o.start(t); o.stop(t + e + 0.08);
  }
  function playStep(I, i, t, sd) {
    const tr = I.tr, s = i % 8, bar = (i >> 3) % tr.ch.length, n = tr._m[i];
    if (n) mnote(I.g, t, tr.r + n[0], n[1] * sd, tr.mw, tr.mv, tr.pz);
    const b = tr._b[s];
    if (b) mnote(I.g, t, tr.br + tr.ch[bar] + b[0], b[1] * sd, tr.bw, tr.bv, tr.pz);
    const dr = tr.d[s], dv = tr.dv;
    if (dr === 'k') tone(140, 0.14, { f2: 45, v: 0.6 * dv, at: t, out: I.g });
    else if (dr === 's') noise(0.09, { ty: 'highpass', f: 1800, v: 0.22 * dv, at: t, out: I.g });
    else if (dr === 'h') noise(0.03, { ty: 'highpass', f: 7000, v: 0.12 * dv, at: t, out: I.g });
  }
  function start(name) {
    const tr = TR[name]; if (!tr) return;
    if (!tr._m) { tr._m = parse(tr.m); tr._b = parse(tr.b); }
    const now = ctx.currentTime, g = ctx.createGain();
    g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(1, now + 0.35);
    g.connect(musB);
    inst = { name, tr, g, i: 0, t: now + 0.06, len: tr._m.length };
  }
  function stopInst(fade) {
    if (!inst) return;
    const g = inst.g, t = ctx.currentTime;
    inst = null;
    try {
      g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t);
      g.gain.linearRampToValueAtTime(0, t + fade);
      setTimeout(() => { try { g.disconnect(); } catch (e) {} }, (fade + 0.6) * 1000);
    } catch (e) {}
  }
  function tick() {
    try {
      if (!ctx) return;
      if (eng && !settings.sfx) engStop();
      else if (!eng && engWant && settings.sfx && live()) engStart(engWant.p);
      if (!inst) return;
      if (!settings.music) { stopInst(0.15); return; }
      const now = ctx.currentTime, tr = inst.tr, sd = 30 / tr.bpm;
      if (inst.t < now - 0.3) inst.t = now + 0.05; // tab was suspended: skip ahead, no burst
      while (inst.t < now + 0.12) {
        const i = inst.i;
        playStep(inst, i, inst.t, sd);
        inst.t += sd * (1 + (i % 2 ? -tr.sw : tr.sw));
        inst.i = (i + 1) % inst.len;
      }
    } catch (e) {}
  }
  function music(track) {
    try {
      want = track || null;
      if (!ctx) return;
      if (!want || !TR[want]) { stopInst(0.5); return; }
      if (inst && inst.name === want) return;
      stopInst(inst ? 0.5 : 0.1);
      if (settings.music) start(want);
    } catch (e) {}
  }
  function duck(on) {
    try {
      ducked = !!on;
      if (!ctx) return;
      musB.gain.setTargetAtTime(ducked ? MUSIC_VOL * 0.4 : MUSIC_VOL, ctx.currentTime, 0.1);
    } catch (e) {}
  }

  function suspend(){try{if(typeof ctx!=='undefined'&&ctx&&ctx.state==='running')ctx.suspend();}catch(e){}}
  return { settings, unlock, suspend, sfx, voice, voiceLine, speak, music, duck, engine,
    sfxNames: Object.keys(S), voices: Object.keys(VP).filter(k => k !== '_'), tracks: Object.keys(TR) };
})();
