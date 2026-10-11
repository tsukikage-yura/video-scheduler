
/* ============================================================
   G1 建筑语汇 共享库 (原神式哥特建筑线稿+平涂)
   纯 Canvas 2D / 确定性 / 无外部素材
   ============================================================ */
const W = 1920, H = 1080;
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
ctx.lineJoin = 'round'; ctx.lineCap = 'round';
ctx.imageSmoothingEnabled = true;

/* ---- clip 泄漏哨兵: 任何 save 未配对 restore 都会被报出来 ----
   这是本实验最容易踩的坑 —— 一个漏掉的 restore 会让后续所有绘制被旧 clip 吞掉,
   而画面"看起来只是没画", 极难定位。 */
let __clipDepth = 0;
const __save = ctx.save.bind(ctx), __restore = ctx.restore.bind(ctx);
ctx.save = function(){ __clipDepth++; return __save(); };
ctx.restore = function(){ __clipDepth--; return __restore(); };
function __assertClip(){ if (__clipDepth !== 0) throw new Error('CLIP IMBALANCE: '+__clipDepth+' 个 save 未 restore'); }

/* ---------- 确定性随机 (无 Math.random) ---------- */
function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function hash1(i){ const x = Math.sin(i*12.9898 + 78.233)*43758.5453; return x - Math.floor(x); }
function hash2(i,j){ const x = Math.sin(i*127.1 + j*311.7)*43758.5453; return x - Math.floor(x); }

/* ---------- 颜色 ---------- */
function toRGB(c){
  if (Array.isArray(c)) return c;
  if (c[0] === '#'){ let s = c.slice(1); if (s.length===3) s = s.split('').map(k=>k+k).join('');
    return [parseInt(s.slice(0,2),16), parseInt(s.slice(2,4),16), parseInt(s.slice(4,6),16)]; }
  return (c.match(/[\d.]+/g)||[0,0,0]).map(Number);
}
function rgb(a){ return 'rgb('+Math.round(a[0])+','+Math.round(a[1])+','+Math.round(a[2])+')'; }
function mix(a,b,t){ const A=toRGB(a), B=toRGB(b); return rgb([A[0]+(B[0]-A[0])*t, A[1]+(B[1]-A[1])*t, A[2]+(B[2]-A[2])*t]); }
function rgba(c,a){ const C=toRGB(c); return 'rgba('+Math.round(C[0])+','+Math.round(C[1])+','+Math.round(C[2])+','+a+')'; }
function shade(c,t){ return mix(c,'#0a0b1c',t); }      // 压暗
function lit(c,t){ return mix(c,'#e9f2ff',t); }        // 提亮(偏冷白)
function haze(c,t){ return mix(c,'#7fa8cf',t); }       // 大气透视(越远越淡越蓝)

/* ---------- 调色板 (夜晚哥特: 深蓝紫主调 + 金色 + 暖橙点) ---------- */
const PAL = {
  night0:'#0e0f22', night1:'#151732', night2:'#1d2043', night3:'#262a55',
  blue1:'#2f3567', blue2:'#3b4380', blue3:'#4a5496', blue4:'#5b66ad',
  ink:'#0b0c1c', ink2:'#171a37', edge:'#242a52',
  sky:'#a8d6ea', skyDeep:'#78b2d6', skyPale:'#d9eff9', skyTop:'#8ec6e2',
  glow:'#d8f0fa',
  gold:'#d9b25e', goldLite:'#f4dc9e', goldDeep:'#9a7830', goldPale:'#fbeec2',
  warm:'#ffb35a', warmDeep:'#e07a30',
  paper:'#e6ebf7', white:'#f5f3ed'
};

/* ---------- 基础绘制 ---------- */
function fs(path, fill, stroke, lw){
  if (fill){ ctx.fillStyle = fill; ctx.fill(path); }
  if (stroke){ ctx.lineWidth = lw==null?3:lw; ctx.strokeStyle = stroke; ctx.stroke(path); }
}
function poly(pts, close){
  const p = new Path2D();
  pts.forEach((q,i)=> i? p.lineTo(q[0],q[1]) : p.moveTo(q[0],q[1]));
  if (close!==false) p.closePath();
  return p;
}
function rectP(x,y,w,h){ const p=new Path2D(); p.rect(x,y,w,h); return p; }
function strokeP(path, color, lw){ ctx.lineWidth=lw==null?3:lw; ctx.strokeStyle=color; ctx.stroke(path); }

/* ---------- 拱形几何 ----------
   1) pointedArchTop : 真·哥特双心尖拱 (两段圆弧相交于尖顶) —— 结构正确, 顶点有尖角
   2) quadArchTop    : 单段二次贝塞尔抛物线拱 —— 绝对光滑饱满
   3) softArchTop    : 两段二次贝塞尔交于顶点 —— 尖而圆润 (推荐: 原神式)
--------------------------------------------------------------- */
function pointedArchTop(cx, springY, w, rise){
  const hw = w/2;
  let d = (rise*rise - hw*hw)/(2*hw);
  const R = hw + d;
  const th = Math.atan2(rise, d);
  const p = new Path2D();
  p.moveTo(cx-hw, springY);
  p.arc(cx+d, springY, R, Math.PI, Math.PI+th);
  p.arc(cx-d, springY, R, -th, 0);
  return p;
}
function quadArchTop(cx, springY, w, rise){
  const hw = w/2, p = new Path2D();
  p.moveTo(cx-hw, springY);
  p.quadraticCurveTo(cx, springY - 2*rise, cx+hw, springY);
  return p;
}
function softArchTop(cx, springY, w, rise, k, m){
  // P1 = (cx - hw*k, springY - rise*m), m<1 保证控制点在顶点之下 => 无过冲
  // 切向: 起拱处陡(近竖直), 顶点处平缓 => 优雅哥特尖拱
  k = k==null?0.55:k; m = m==null?0.76:m;
  const hw = w/2, p = new Path2D();
  p.moveTo(cx-hw, springY);
  p.quadraticCurveTo(cx - hw*k, springY - rise*m, cx, springY - rise);
  p.quadraticCurveTo(cx + hw*k, springY - rise*m, cx+hw, springY);
  return p;
}
function archShape(cx, baseY, w, h, kind, k){
  // h = 从 baseY 到顶点总高; 拱起 rise 部分为 h 的上半
  const hw = w/2;
  const rise = Math.min(h*0.62, hw*(kind==='quad'?0.92:1.35));
  const springY = baseY - (h - rise);
  let top;
  if (kind==='round') top = (function(){ const p=new Path2D(); p.moveTo(cx-hw,springY); p.arc(cx,springY,hw,Math.PI,0); return p; })();
  else if (kind==='quad') top = quadArchTop(cx, springY, w, rise);
  else if (kind==='soft') top = softArchTop(cx, springY, w, rise, k);
  else top = pointedArchTop(cx, springY, w, rise);
  return { path: top, springY, rise, hw };
}
function archFullPath(cx, baseY, w, h, kind, k){
  const a = archShape(cx, baseY, w, h, kind, k);
  const p = new Path2D(a.path);
  p.lineTo(cx + a.hw, baseY);
  p.lineTo(cx - a.hw, baseY);
  p.closePath();
  return { path: p, springY: a.springY, rise: a.rise, hw: a.hw, cx, baseY, kind };
}

/* ---------- 装饰母题 ---------- */
function diamondP(cx,cy,rx,ry){ return poly([[cx,cy-ry],[cx+rx,cy],[cx,cy+ry],[cx-rx,cy]]); }
function starP(cx,cy,outer,inner,n,rot){
  rot = rot||0; const pts=[];
  for (let i=0;i<n*2;i++){ const r = i%2?inner:outer, a = rot + i*Math.PI/n;
    pts.push([cx+Math.cos(a)*r, cy+Math.sin(a)*r]); }
  return poly(pts);
}
function star4P(cx,cy,r,waist){ // 四芒星(尖长) —— 柱头金饰常用
  const w2 = waist==null? r*0.24 : waist;
  return poly([[cx,cy-r],[cx+w2,cy-w2],[cx+r,cy],[cx+w2,cy+w2],[cx,cy+r],[cx-w2,cy+w2],[cx-r,cy],[cx-w2,cy-w2]]);
}
/* r = 外接半径(总尺寸); ratio = 瓣半径/瓣心距, 0.62 是好看的默认 */
function quatrefoilP(cx,cy,r,ratio){ const q = ratio==null?0.62:ratio; const d = r/(1+q); return circlesUnion(cx,cy,4, d*q, d, -Math.PI/2); }
function trefoilOutline(cx,cy,r,ratio){ const q = ratio==null?0.62:ratio; const d = r/(1+q); return circlesUnion(cx,cy,3, d*q, d, -Math.PI/2); }

/* 环形等径圆 ∪ 中心圆 的【外轮廓】—— 只描边不产生内部杂线
   n=瓣数, rl=瓣半径, d=瓣心到中心距, rot=起始角
   原理: 每瓣只画露在中心圆外的弧(a±phi), 相邻两瓣之间补一段中心圆的弧 */
function circlesUnion(cx, cy, n, rl, d, rot){
  const p = new Path2D();
  const phi = Math.acos(Math.max(-1, Math.min(1, -rl/(2*d))));   // 瓣弧半角
  const beta = Math.atan2(rl*Math.sin(phi), d + rl*Math.cos(phi)); // 交点方位角
  const gap = 2*Math.PI/n - 2*beta;
  if (gap <= 0) { // 瓣互相重叠, 退化为各自圆
    for (let i=0;i<n;i++){ const a = rot + i*2*Math.PI/n;
      p.moveTo(cx+Math.cos(a)*d + rl, cy+Math.sin(a)*d);
      p.arc(cx+Math.cos(a)*d, cy+Math.sin(a)*d, rl, 0, Math.PI*2, false); }
    return p;
  }
  for (let i=0;i<n;i++){
    const a = rot + i*2*Math.PI/n;
    const lx = cx + Math.cos(a)*d, ly = cy + Math.sin(a)*d;
    const s = a - phi, e = a + phi;
    if (i===0) p.moveTo(lx + Math.cos(s)*rl, ly + Math.sin(s)*rl);
    else p.lineTo(lx + Math.cos(s)*rl, ly + Math.sin(s)*rl);
    p.arc(lx, ly, rl, s, e, false);
    p.arc(cx, cy, d, a + beta, a + 2*Math.PI/n - beta, false);
  }
  p.closePath();
  return p;
}
function trefoilP(cx,cy,r,d){
  d = d==null? r*0.46 : d;
  const p = new Path2D();
  for (let i=0;i<3;i++){
    const a = -Math.PI/2 + i*2*Math.PI/3;
    const bx = cx+Math.cos(a)*d, by = cy+Math.sin(a)*d;
    if (i===0) p.moveTo(cx, cy - d*0.2); else p.lineTo(cx, cy - d*0.2);
    p.arc(bx, by, d, a+Math.PI/2, a-Math.PI/2, false);
    p.arc(cx, cy, d, a-Math.PI/2, a+Math.PI/2, false);
  }
  p.closePath();
  return p;
}

/* ---------- 建筑构件 ---------- */
// 立柱: 柱基 + 柱身 + 柱头 + 金饰 (带 entasis 收分 + 平涂亮暗面)
function drawColumn(o){
  const x=o.x, top=o.top, bot=o.bottom, w=o.w;
  const face = o.face || PAL.blue2, line = o.line || PAL.ink;
  const lw = o.lw==null?3.2:o.lw;
  const capH = o.capH==null? w*0.58 : o.capH;
  const baseH = o.baseH==null? w*0.66 : o.baseH;
  const hw = w/2;
  const shTop = top+capH, shBot = bot-baseH;
  const taper = o.taper==null? 0.055 : o.taper;      // 收分: 顶部略细

  // --- 柱身 (entasis: 上下略收, 中部最粗) ---
  const shaft = new Path2D();
  const N = 16;
  for (let i=0;i<=N;i++){
    const t=i/N, y = shTop + t*(shBot-shTop);
    const e = 1 - taper*(1-Math.sin(Math.PI*Math.min(1,t*0.85+0.1))*0.75) - taper*0.25*t;
    const ww = hw*e;
    i? shaft.lineTo(x-ww, y) : shaft.moveTo(x-ww, y);
  }
  for (let i=N;i>=0;i--){
    const t=i/N, y = shTop + t*(shBot-shTop);
    const e = 1 - taper*(1-Math.sin(Math.PI*Math.min(1,t*0.85+0.1))*0.75) - taper*0.25*t;
    shaft.lineTo(x+hw*e, y);
  }
  shaft.closePath();
  fs(shaft, face, line, lw);

  ctx.save(); ctx.clip(shaft);
  // 平涂三段: 亮 / 中 / 暗 —— 这是"原神感"的关键(色块分明, 不做渐变)
  fs(rectP(x-hw, shTop, w*0.26, shBot-shTop), lit(face, 0.13), null);
  fs(rectP(x+hw-w*0.26, shTop, w*0.26, shBot-shTop), shade(face, 0.24), null);
  fs(rectP(x+hw-w*0.07, shTop, w*0.07, shBot-shTop), shade(face, 0.36), null);
  // 凹槽
  if (o.flutes){
    const n=o.flutes;
    for (let i=1;i<n;i++){
      const t=i/n, fx = x-hw + w*t;
      const fx2 = x + (t-0.5)*w*(1-taper*0.9);
      ctx.strokeStyle = rgba(line,0.42); ctx.lineWidth = Math.max(1.3, w*0.030);
      ctx.beginPath(); ctx.moveTo(fx2, shTop+3); ctx.lineTo(fx2, shBot-3); ctx.stroke();
      ctx.strokeStyle = rgba(lit(face,0.2), 0.30); ctx.lineWidth = Math.max(1.1, w*0.024);
      ctx.beginPath(); ctx.moveTo(fx2+Math.max(2,w*0.036), shTop+3); ctx.lineTo(fx2+Math.max(2,w*0.036), shBot-3); ctx.stroke();
    }
  }
  // 螺旋柱: 真正画成"螺旋带"(填充色块) 而非交叉线
  if (o.twist){
    const turns = 2.6, bands = 3;
    for (let b=0;b<bands;b++){
      const ph = b*2*Math.PI/bands;
      const up = new Path2D(), dn = new Path2D();
      const seg = 44;
      for (let i=0;i<=seg;i++){
        const t=i/seg, y = shTop + t*(shBot-shTop);
        const a = ph + t*Math.PI*2*turns;
        const cxp = x + Math.sin(a)*w*0.30;
        const bw  = Math.max(2.2, w*0.085*(0.55+0.45*Math.cos(a)));
        i? up.lineTo(cxp-bw, y) : up.moveTo(cxp-bw, y);
      }
      for (let i=seg;i>=0;i--){
        const t=i/seg, y = shTop + t*(shBot-shTop);
        const a = ph + t*Math.PI*2*turns;
        const cxp = x + Math.sin(a)*w*0.30;
        const bw  = Math.max(2.2, w*0.085*(0.55+0.45*Math.cos(a)));
        up.lineTo(cxp+bw, y);
      }
      up.closePath();
      fs(up, shade(face, 0.30), rgba(line,0.55), Math.max(1.2,w*0.026));
      // 带子上的高光
      ctx.save(); ctx.clip(up);
      fs(rectP(x-hw, shTop, w*0.5, shBot-shTop), rgba(lit(face,0.20), 0.45), null);
      ctx.restore();
    }
  }
  ctx.restore();

  // --- 柱头 ---
  const abH = capH*0.26;
  const bellT = top+abH, bellB = top+capH;
  // 钟形 (bell) —— 上宽下窄的梯形 + 圆角
  const bell = poly([[x-hw*0.58, bellB],[x+hw*0.58, bellB],[x+hw*0.98, bellT],[x-hw*0.98, bellT]]);
  fs(bell, lit(face, 0.05), line, lw);
  ctx.save(); ctx.clip(bell);
  fs(rectP(x-hw, bellT, w*0.34, capH), lit(face,0.18), null);
  fs(rectP(x+hw*0.32, bellT, w*0.7, capH), shade(face,0.20), null);
  ctx.restore();
  // 冠板 (abacus)
  fs(rectP(x-hw-w*0.17, top, w+w*0.34, abH), lit(face,0.20), line, lw);
  // 冠板下的小线脚 (宽度必须 <= 冠板, 否则会横向戳出去)
  fs(rectP(x - w*0.60, bellB - capH*0.05, w*1.20, capH*0.13), shade(face,0.16), line, lw*0.7);
  // 柱头金饰 (菱形/星形)
  const oy = top + capH*0.60, orr = Math.min(w*0.36, capH*0.50);
  const orn = o.ornament;
  if (orn){
    // 金饰底衬(暗色菱形, 让金色跳出来)
    fs(diamondP(x, oy, orr*1.16, orr*1.30), shade(face,0.42), null);
    if (orn==='diamond') fs(diamondP(x, oy, orr*0.72, orr*0.96), PAL.gold, PAL.goldDeep, 2);
    else if (orn==='star4') fs(star4P(x, oy, orr*1.02, orr*0.26), PAL.gold, PAL.goldDeep, 2);
    else if (orn==='star8') fs(starP(x, oy, orr*1.00, orr*0.40, 8, Math.PI/8), PAL.gold, PAL.goldDeep, 2);
    else if (orn==='star6') fs(starP(x, oy, orr*1.00, orr*0.44, 6, Math.PI/2), PAL.gold, PAL.goldDeep, 2);
    else if (orn==='rosette') { fs(quatrefoilP(x, oy, orr*1.05, 0.62), PAL.gold, PAL.goldDeep, 2); }
  }
  // 束带 (shaft ring)
  if (o.ring){
    fs(rectP(x-hw*1.02, shTop+ (shBot-shTop)*o.ring, w*1.02, w*0.10), lit(face,0.22), line, lw*0.7);
  }

  // --- 柱基 ---
  const tY = bot - baseH;
  fs(rectP(x-hw*1.02, tY, w*1.02, baseH*0.30), lit(face,0.10), line, lw);            // 上圆盘
  fs(rectP(x-hw*1.22, bot-baseH*0.62, w*1.22, baseH*0.36), face, line, lw);           // 柱础座
  fs(rectP(x-hw*1.42, bot-baseH*0.30, w*1.42, baseH*0.30), shade(face,0.16), line, lw); // 底板
  if (o.baseOrn!==false && o.ornament) fs(diamondP(x, bot-baseH*0.46, w*0.17, w*0.19), PAL.gold, PAL.goldDeep, 1.5);
  return { x, top, bot, w };
}

// 栏杆/宝瓶栏杆 (尖拱小连拱)
function drawBalustrade(o){
  const x=o.x, y=o.y, w=o.w, h=o.h;
  const face = o.face || PAL.blue1, line = o.line || PAL.ink, lw = o.lw==null?3:o.lw;
  const railH = h*0.16, baseH = h*0.14;
  fs(rectP(x, y, w, railH), lit(face,0.18), line, lw);
  fs(rectP(x, y+h-baseH, w, baseH), shade(face,0.10), line, lw);
  const n = o.n || 9;
  const cw = w/n;
  const innerTop = y+railH, innerBot = y+h-baseH, ih = innerBot-innerTop;
  for (let i=0;i<n;i++){
    const cx = x + cw*(i+0.5);
    const a = archFullPath(cx, innerBot, cw*0.66, ih*0.94, o.kind||'soft', 0.45);
    fs(a.path, i%2? shade(face,0.10) : face, line, lw*0.8);
    // 内部小金点
    fs(diamondP(cx, innerTop+ih*0.30, cw*0.09, cw*0.13), PAL.gold, null);
  }
}

// 尖塔 / 小尖顶 (带卷叶饰 crockets)
function drawPinnacle(o){
  const x=o.x, baseY=o.baseY, w=o.w, h=o.h;
  const face = o.face||PAL.blue2, line=o.line||PAL.ink, lw=o.lw==null?3:o.lw;
  const hw=w/2;
  const bodyH = h*0.34;
  fs(rectP(x-hw, baseY-bodyH, w, bodyH), face, line, lw);
  const spire = poly([[x-hw*1.15, baseY-bodyH],[x+hw*1.15, baseY-bodyH],[x, baseY-h]]);
  fs(spire, lit(face,0.08), line, lw);
  // crockets 卷叶 (沿塔尖斜边向外卷出的小叶片)
  const n=o.crockets||4;
  for (let i=1;i<=n;i++){
    const t=i/(n+1);
    const yy = baseY-bodyH - t*(h-bodyH);
    const xx = hw*1.15*(1-t);
    const r = w*0.15*(1-t*0.45);
    for (const s of [-1,1]){
      const leaf = new Path2D();
      leaf.ellipse(x + s*(xx + r*0.55), yy, r*1.35, r*0.80, s*0.55, 0, Math.PI*2);
      fs(leaf, lit(face,0.18), line, lw*0.7);
    }
  }
  // 顶端金饰
  fs(star4P(x, baseY-h-w*0.22, w*0.30), PAL.gold, PAL.goldDeep, 2);
}

// 层叠拱券线脚 (archivolt) —— 廉价纵深感
function drawArchivolt(o){
  const n=o.n||4, cx=o.cx, baseY=o.baseY, w=o.w, h=o.h, step=o.step||16;
  const base = o.base || PAL.blue2, line = o.line||PAL.ink, lw=o.lw==null?3:o.lw;
  for (let i=n-1;i>=0;i--){
    const t = i/(n-1);
    const col = mix(shade(base,0.34), lit(base,0.14), t);
    const a = archFullPath(cx, baseY, w - i*step*2, h - i*step*1.15, o.kind||'soft', 0.45);
    fs(a.path, col, line, i===0?lw:lw*0.85);
  }
  // 最内层洞口(黑/天空)
  const inner = archFullPath(cx, baseY, w - (n-1)*step*2, h - (n-1)*step*1.15, o.kind||'soft', 0.45);
  if (o.inner) fs(inner.path, o.inner, null);
  return inner;
}

// 窗 (含窗花格 tracery)
function drawWindow(o){
  const cx=o.cx, baseY=o.baseY, w=o.w, h=o.h;
  const frame = o.frame||PAL.blue1, glass=o.glass||PAL.sky, line=o.line||PAL.ink, lw=o.lw==null?3.5:o.lw;
  const a = archFullPath(cx, baseY, w, h, o.kind||'soft', 0.45);
  fs(a.path, frame, line, lw);
  const ins = o.inset==null? w*0.11 : o.inset;
  const g = archFullPath(cx, baseY-ins*0.5, w-ins*2, h-ins*2.1, o.kind||'soft', 0.45);
  // 玻璃: 平涂 + 顶部更亮 (透光)
  fs(g.path, glass, line, lw*0.8);
  ctx.save(); ctx.beginPath(); ctx.clip(g.path);
  fs(rectP(cx-w, baseY-h, w*2, h*0.42), lit(glass, 0.24), null);
  if (o.horizon){ fs(rectP(cx-w, baseY-h+ (h-ins*2.1)*0.55, w*2, h), mix(glass, PAL.skyDeep, 0.55), null); }
  ctx.restore();
  // 中梃 + 窗花格
  const tr = o.tracery || 'lancet';
  const gy0 = g.springY, gy1 = baseY - ins*0.5;
  ctx.save(); ctx.beginPath(); ctx.clip(g.path);
  ctx.strokeStyle = line; ctx.lineWidth = lw*0.8;
  if (tr==='lancet'){
    ctx.beginPath(); ctx.moveTo(cx, gy0 - g.rise); ctx.lineTo(cx, gy1); ctx.stroke();
    const sub = archFullPath(cx - w*0.19, gy0, w*0.30, g.rise*0.80, 'soft', 0.45);
    fs(sub.path, null, line, lw*0.8);
    const sub2 = archFullPath(cx + w*0.19, gy0, w*0.30, g.rise*0.80, 'soft', 0.45);
    fs(sub2.path, null, line, lw*0.8);
    fs(diamondP(cx, gy0 - g.rise*0.34, w*0.055, w*0.075), PAL.gold, null);
  } else if (tr==='tracery'){
    const cyy = gy0 - g.rise*0.28;
    const rr = Math.min(w*0.20, g.rise*0.34);
    fs(quatrefoilP(cx, cyy, rr, 0.62), null, line, lw*0.8);
    fs(starP(cx, cyy, rr*0.5, rr*0.22, 8, Math.PI/8), PAL.gold, PAL.goldDeep, 1.4);
    for (const s of [-1,1]){
      const sub = archFullPath(cx + s*w*0.24, gy0, w*0.30, g.rise*0.72, 'soft', 0.45);
      fs(sub.path, null, line, lw*0.8);
    }
  } else if (tr==='grid'){
    for (let i=1;i<4;i++){ const xx = cx - w*0.5 + (w*i/4); ctx.beginPath(); ctx.moveTo(xx, gy0-g.rise*0.6); ctx.lineTo(xx, gy1); ctx.stroke(); }
    for (let i=1;i<5;i++){ const yy = gy0 + (gy1-gy0)*i/5; ctx.beginPath(); ctx.moveTo(cx-w*0.5, yy); ctx.lineTo(cx+w*0.5, yy); ctx.stroke(); }
  } else if (tr==='rose'){
    fs(quatrefoilP(cx, gy0-g.rise*0.45, w*0.20, 0.62), null, line, lw*0.8);
  } else if (tr==='plain'){
    fs(diamondP(cx, gy0-g.rise*0.35, w*0.06, w*0.09), PAL.gold, null);
  }
  ctx.restore();
  // 窗台
  if (o.sill!==false) fs(rectP(cx-w*0.5-w*0.09, baseY, w+w*0.18, w*0.09), lit(frame,0.12), line, lw*0.85);
  return a;
}

/* ---------- 背景/氛围 ---------- */
function bgNight(y0,y1,c0,c1){
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, c0||PAL.night1); g.addColorStop(1, c1||PAL.night0);
  ctx.fillStyle = g; ctx.fillRect(0,0,W,H);
}
function vignette(strength){
  const g = ctx.createRadialGradient(W/2,H*0.52,H*0.20, W/2,H*0.52,H*0.85);
  g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(1,'rgba(0,0,0,'+(strength==null?0.55:strength)+')');
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
}
function cap(text, x, y, size, color, align, track){
  ctx.save();
  ctx.font = (size||22)+'px "Helvetica Neue", Helvetica, Arial, sans-serif';
  ctx.fillStyle = color || 'rgba(178,193,230,0.50)';
  ctx.textAlign = align || 'left'; ctx.textBaseline = 'alphabetic';
  try { ctx.letterSpacing = (track==null?4:track)+'px'; } catch(e){}
  ctx.fillText(text, x, y);
  ctx.restore();
}
function rule(x,y,w,color,a){ ctx.strokeStyle = rgba(color||PAL.blue3, a==null?0.45:a); ctx.lineWidth=1.5;
  ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+w,y); ctx.stroke(); }

/* ---------- 玫瑰花窗 (rose window) ---------- */
function roseWindow(cx, cy, R, o){
  o = o || {};
  const n = o.n || 8;
  const ring = o.ring || PAL.blue2, glass = o.glass || PAL.sky, line = o.line || PAL.ink, lw = o.lw==null?4:o.lw;
  // 外环
  const outer = new Path2D(); outer.arc(cx,cy,R,0,Math.PI*2);
  fs(outer, ring, line, lw);
  const inner = new Path2D(); inner.arc(cx,cy,R*0.87,0,Math.PI*2);
  fs(inner, glass, line, lw*0.85);
  ctx.save(); ctx.clip(inner);
  // 花瓣: n 个圆瓣 —— 用真·并集外轮廓
  const d = R*0.44;
  const petals = circlesUnion(cx, cy, n, d*0.62, d, -Math.PI/2);
  fs(petals, lit(glass,0.10), line, lw*0.85);
  // 中心小圆
  const c2 = new Path2D(); c2.arc(cx,cy,d*0.62,0,Math.PI*2);
  fs(c2, lit(glass,0.18), line, lw*0.8);
  ctx.restore();                       // <<< 必须还原, 否则 clip 泄漏吞掉后面所有绘制
  // 放射辐条
  ctx.save(); ctx.beginPath(); ctx.arc(cx,cy,R*0.87,0,Math.PI*2); ctx.clip();
  ctx.strokeStyle = line; ctx.lineWidth = lw*0.8;
  for (let i=0;i<n*2;i++){ const a = i*Math.PI/n;
    ctx.beginPath(); ctx.moveTo(cx+Math.cos(a)*R*0.16, cy+Math.sin(a)*R*0.16);
    ctx.lineTo(cx+Math.cos(a)*R*0.92, cy+Math.sin(a)*R*0.92); ctx.stroke(); }
  ctx.restore();
  // 金环
  const g1 = new Path2D(); g1.arc(cx,cy,R*0.955,0,Math.PI*2);
  strokeP(g1, PAL.gold, lw*0.55);
}

/* ---------- 藤蔓卷叶纹 (确定性) ---------- */
function vineScroll(x, y, len, amp, n, color, lw){
  const p = new Path2D();
  p.moveTo(x, y);
  const step = len/(n*2);
  for (let i=0;i<n*2;i++){
    const s = i%2? 1 : -1;
    p.quadraticCurveTo(x + step*(i+0.5), y + amp*s, x + step*(i+1), y);
  }
  strokeP(p, color||PAL.gold, lw==null?3:lw);
  // 卷叶
  for (let i=0;i<n;i++){
    const px = x + step*(2*i+1), s = i%2? 1:-1;
    ctx.beginPath();
    ctx.arc(px + step*0.5*s, y + amp*s*1.25, Math.abs(amp)*0.42, 0, Math.PI*1.7);
    ctx.strokeStyle = color||PAL.gold; ctx.lineWidth = (lw==null?3:lw)*0.8; ctx.stroke();
  }
  return p;
}

/* ---------- 尖拱窗花格: 更完整的 sub-arch 组合 ---------- */
function traceryLancets(cx, springY, w, rise, count, line, lw, fill){
  for (let i=0;i<count;i++){
    const t = (i+0.5)/count;
    const sx = cx - w/2 + w*t;
    const sw = w/count*0.78;
    const sh2 = rise*(0.92 - Math.abs(t-0.5)*0.42);
    const a = archFullPath(sx, springY, sw, sh2, 'soft', 0.5);
    if (fill) fs(a.path, fill, line, lw);
    else strokeP(a.path, line, lw);
  }
}

/* ---------- 米字/网格窗棂 ---------- */
function lattice(cx, cy, w, h, cols, rows, line, lw){
  ctx.save(); ctx.strokeStyle = line; ctx.lineWidth = lw;
  for (let i=1;i<cols;i++){ const x = cx-w/2 + w*i/cols; ctx.beginPath(); ctx.moveTo(x, cy-h/2); ctx.lineTo(x, cy+h/2); ctx.stroke(); }
  for (let j=1;j<rows;j++){ const y = cy-h/2 + h*j/rows; ctx.beginPath(); ctx.moveTo(cx-w/2, y); ctx.lineTo(cx+w/2, y); ctx.stroke(); }
  ctx.restore();
}

/* ---------- 火焰式 ogee 尖拱 (S 形曲线) ---------- */
function ogeeArchTop(cx, springY, w, rise, bulge){
  const hw = w/2, b = bulge==null?1.18:bulge;
  const p = new Path2D();
  p.moveTo(cx-hw, springY);
  p.bezierCurveTo(cx-hw*b, springY-rise*0.34, cx-hw*0.10, springY-rise*0.44, cx, springY-rise);
  p.bezierCurveTo(cx+hw*0.10, springY-rise*0.44, cx+hw*b, springY-rise*0.34, cx+hw, springY);
  return p;
}
function ogeeArchFull(cx, baseY, w, h, bulge){
  const hw=w/2, rise=Math.min(h*0.66, hw*1.5), springY = baseY-(h-rise);
  const p = new Path2D(ogeeArchTop(cx, springY, w, rise, bulge));
  p.lineTo(cx+hw, baseY); p.lineTo(cx-hw, baseY); p.closePath();
  return { path:p, springY, rise, hw };
}

/* ---------- 百合花饰 fleur-de-lis (分瓣绘制: 内部分割线是纹样的一部分) ---------- */
function fleurDeLis(cx, cy, h, fill, line, lw){
  const u = h, F = fill||PAL.gold, L = line||PAL.goldDeep, LW = lw==null?2.6:lw;
  const petal = (p)=>{ ctx.fillStyle=F; ctx.fill(p); ctx.strokeStyle=L; ctx.lineWidth=LW; ctx.stroke(p); };
  // 中央瓣
  const c = new Path2D();
  c.moveTo(cx, cy - u*0.50);
  c.bezierCurveTo(cx + u*0.17, cy - u*0.28, cx + u*0.21, cy - u*0.05, cx + u*0.08, cy + u*0.09);
  c.lineTo(cx - u*0.08, cy + u*0.09);
  c.bezierCurveTo(cx - u*0.21, cy - u*0.05, cx - u*0.17, cy - u*0.28, cx, cy - u*0.50);
  petal(c);
  // 左右侧瓣 (向外上卷)
  for (const s of [-1,1]){
    const p = new Path2D();
    p.moveTo(cx + s*u*0.05, cy + u*0.07);
    p.bezierCurveTo(cx + s*u*0.30, cy + u*0.04, cx + s*u*0.55, cy - u*0.14, cx + s*u*0.60, cy - u*0.44);
    p.bezierCurveTo(cx + s*u*0.50, cy - u*0.26, cx + s*u*0.28, cy - u*0.14, cx + s*u*0.05, cy + u*0.07);
    petal(p);
  }
  // 束带
  const b = poly([[cx-u*0.32, cy+u*0.09],[cx+u*0.32, cy+u*0.09],[cx+u*0.32, cy+u*0.23],[cx-u*0.32, cy+u*0.23]]);
  petal(b);
  // 下瓣
  const d = new Path2D();
  d.moveTo(cx - u*0.11, cy + u*0.23);
  d.bezierCurveTo(cx - u*0.22, cy + u*0.36, cx - u*0.09, cy + u*0.48, cx, cy + u*0.53);
  d.bezierCurveTo(cx + u*0.09, cy + u*0.48, cx + u*0.22, cy + u*0.36, cx + u*0.11, cy + u*0.23);
  petal(d);
}

/* ---------- 回纹 / 键纹 meander ---------- */
function meander(x, y, len, unit, h, color, lw){
  const p = new Path2D();
  const n = Math.floor(len/unit);
  p.moveTo(x, y+h);
  for (let i=0;i<n;i++){
    const ox = x + i*unit;
    p.lineTo(ox, y);
    p.lineTo(ox+unit*0.72, y);
    p.lineTo(ox+unit*0.72, y+h*0.62);
    p.lineTo(ox+unit*0.30, y+h*0.62);
    p.lineTo(ox+unit*0.30, y+h*0.32);
    p.lineTo(ox+unit*0.52, y+h*0.32);
    p.lineTo(ox+unit*0.52, y+h*0.86);
    p.lineTo(ox+unit, y+h*0.86);
    p.lineTo(ox+unit, y+h);
  }
  strokeP(p, color||PAL.gold, lw==null?3:lw);
  return p;
}

/* ---------- 锯齿带 chevron ---------- */
function chevronBand(x, y, len, n, h, color, lw){
  const p = new Path2D(); const step = len/n;
  for (let i=0;i<n;i++){ const ox=x+i*step;
    p.moveTo(ox, y); p.lineTo(ox+step*0.5, y+h); p.lineTo(ox+step, y); }
  strokeP(p, color||PAL.gold, lw==null?3:lw);
  return p;
}

/* ---------- 透视栏杆 (沿一条后退的基线画连拱栏杆) ---------- */
function balustradePersp(x0, x1, yt0, yt1, yb0, yb1, n, o){
  o = o||{};
  const face = o.face||PAL.blue1, line = o.line||PAL.ink, lw = o.lw==null?3:o.lw;
  const yt = t => yt0 + (yt1-yt0)*t, yb = t => yb0 + (yb1-yb0)*t;
  const X  = t => x0 + (x1-x0)*t;
  // 上下扶手带
  const rail = poly([[X(0),yt(0)],[X(1),yt(1)],[X(1),yt(1)+ (yb(1)-yt(1))*0.14],[X(0),yt(0)+(yb(0)-yt(0))*0.14]]);
  fs(rail, lit(face,0.18), line, lw);
  const base = poly([[X(0),yb(0)-(yb(0)-yt(0))*0.13],[X(1),yb(1)-(yb(1)-yt(1))*0.13],[X(1),yb(1)],[X(0),yb(0)]]);
  fs(base, shade(face,0.10), line, lw);
  for (let i=0;i<n;i++){
    const t0 = i/n, t1 = (i+1)/n, tm = (t0+t1)/2;
    const ax = X(tm), atop = yt(tm)+(yb(tm)-yt(tm))*0.14, abot = yb(tm)-(yb(tm)-yt(tm))*0.13;
    const aw = (X(t1)-X(t0))*0.80;
    const a = archFullPath(ax, abot, aw, (abot-atop)*0.90, o.kind||'soft', 0.52);
    fs(a.path, i%2? shade(face,0.12) : face, line, lw*0.8);
    fs(diamondP(ax, atop+(abot-atop)*0.30, aw*0.10, aw*0.15), PAL.gold, null);
  }
}

/* ============================================================
   针孔透视相机 (y 轴向上, 便于用"世界坐标"搭建建筑)
   proj(xw, yw, zw) -> {x, y, s}   s = f/zw 为该深度处的缩放系数
   ============================================================ */
function makeCam(o){
  const vpx = o.vpx==null? W/2 : o.vpx;
  const vpy = o.vpy==null? H*0.42 : o.vpy;   // 地平线/灭点 y
  const f   = o.f==null? 620 : o.f;
  const eyeH= o.eyeH==null? 1.62 : o.eyeH;   // 相机离地高度(世界单位)
  const cam = {
    vpx, vpy, f, eyeH,
    proj(xw, yw, zw){
      const s = f/Math.max(zw, 0.05);
      return { x: vpx + xw*s, y: vpy + (eyeH - yw)*s, s };
    },
    // 地面上某点的屏幕 y (yw=0)
    floorY(zw){ return vpy + eyeH*f/Math.max(zw,0.05); },
    // 给定屏幕 y, 反解它所在深度的地面 z
    zAtFloor(sy){ return eyeH*f/Math.max(sy - vpy, 0.5); },
    // 世界四边形 -> 屏幕 Path2D
    quad(pts){ const p = new Path2D();
      pts.forEach((q,i)=>{ const r = cam.proj(q[0], q[1], q[2]); i? p.lineTo(r.x, r.y) : p.moveTo(r.x, r.y); });
      p.closePath(); return p; },
    line(pts){ const p = new Path2D();
      pts.forEach((q,i)=>{ const r = cam.proj(q[0], q[1], q[2]); i? p.lineTo(r.x, r.y) : p.moveTo(r.x, r.y); });
      return p; }
  };
  return cam;
}

/* 沿世界直线排布构件 (自动按透视缩放) */
function placeAlong(cam, a, b, n, fn){
  for (let i=0;i<n;i++){
    const t = n===1? 0.5 : i/(n-1);
    const xw = a[0]+(b[0]-a[0])*t, yw = a[1]+(b[1]-a[1])*t, zw = a[2]+(b[2]-a[2])*t;
    fn(cam.proj(xw,yw,zw), t, {xw,yw,zw});
  }
}

/* 地板透视格 (石砖) —— 提供强烈的地面纵深 */
function floorGrid(cam, zNear, zFar, xHalf, cols, color, lw, alpha){
  ctx.save(); ctx.globalAlpha = alpha==null?1:alpha;
  // 横向砖缝 (等世界间距)
  const stepZ = 0.9;
  for (let z=zNear; z<=zFar; z+=stepZ){
    const p = cam.line([[-xHalf,0,z],[xHalf,0,z]]);
    strokeP(p, color, lw*(0.6+0.4*(zNear/z)));
  }
  // 纵向砖缝 (汇聚到灭点)
  for (let i=0;i<=cols;i++){
    const xw = -xHalf + 2*xHalf*i/cols;
    const p = cam.line([[xw,0,zNear],[xw,0,zFar]]);
    strokeP(p, color, lw);
  }
  ctx.restore();
}

/* 拱形上的参数化取点: t=0 左起拱点 -> 0.5 顶点 -> 1 右起拱点 */
function archPt(a, t){
  const cx=a.cx, hw=a.hw, rise=a.rise, sy=a.springY, kind=a.kind||'soft';
  const u = t<=0.5? t/0.5 : (t-0.5)/0.5;
  const s = t<=0.5? -1 : 1;
  if (kind==='round'){ const ang = Math.PI + s*u*Math.PI/2*0 + (t<=0.5? -u*Math.PI/2 : u*Math.PI/2);
    return { x: cx + Math.cos(Math.PI + (t<=0.5? -u*Math.PI/2 : u*Math.PI/2))*hw,
             y: sy + Math.sin(Math.PI + (t<=0.5? -u*Math.PI/2 : u*Math.PI/2))*hw }; }
  if (kind==='pointed'){
    const hwA=hw, d=(rise*rise-hwA*hwA)/(2*hwA), R=hwA+d, th=Math.atan2(rise,d);
    if (t<=0.5) return { x: cx+d + Math.cos(Math.PI+u*th)*R, y: sy + Math.sin(Math.PI+u*th)*R };
    return { x: cx-d + Math.cos(-th+u*th)*R, y: sy + Math.sin(-th+u*th)*R };
  }
  // quad / soft: 用二次贝塞尔精确取点
  let P0,P1,P2;
  if (kind==='quad'){ P0=[cx-hw,sy]; P1=[cx, sy-2*rise]; P2=[cx+hw,sy]; }
  else { const k=0.55, m=0.76;
    if (t<=0.5){ P0=[cx-hw,sy]; P1=[cx-hw*k, sy-rise*m]; P2=[cx, sy-rise]; }
    else { P0=[cx,sy-rise]; P1=[cx+hw*k, sy-rise*m]; P2=[cx+hw,sy]; } }
  const uu = t<=0.5? u : u;
  const mt = 1-uu;
  return { x: mt*mt*P0[0] + 2*mt*uu*P1[0] + uu*uu*P2[0],
           y: mt*mt*P0[1] + 2*mt*uu*P1[1] + uu*uu*P2[1] };
}

/* 通用拱顶/拱券单元: 用前后两个拱洞 + 连线产生纵深, 再叠加肋架 */
function vaultUnit(cx, by, w, h, o){
  o = o||{};
  const kind = o.kind||'soft', ribs = o.ribs||'none';
  const depth = h*(o.depth==null?0.62:o.depth), bs = o.bs==null?0.60:o.bs;
  const bw = w*bs, bh = h*bs, bcx = cx, bby = by - depth;
  const STONE=o.stone||'#3a4280', STONE_D=o.stoneD||'#262c58', GOLD=o.gold||PAL.gold;
  const ribCol = o.rib||'#5b66b4';
  const front = archFullPath(cx, by, w, h, kind, 0.46);
  const back  = archFullPath(bcx, bby, bw, bh, kind, 0.46);
  // 后洞
  fs(back.path, 'rgba(6,8,20,0.95)', STONE_D, 3);
  // 筒身连线
  ctx.save();
  ctx.beginPath(); ctx.rect(cx-w*0.9, by-h*1.6, w*1.8, h*2.0); ctx.clip();
  for (let i=0;i<=26;i++){
    const t=i/26, fa=archPt(front,t), ba=archPt(back,t);
    ctx.strokeStyle = rgba(STONE, 0.20); ctx.lineWidth=1.3;
    ctx.beginPath(); ctx.moveTo(fa.x,fa.y); ctx.lineTo(ba.x,ba.y); ctx.stroke();
  }
  ctx.restore();
  // 前洞 (压住多余线)
  fs(front.path, 'rgba(10,12,28,0.28)', null);
  // ---- 肋架 ----
  if (ribs==='transverse'){
    for (let k=0;k<=4;k++){
      const t=k/4, sc=1-t*(1-bs), yy=by-t*depth;
      const p = new Path2D();
      p.moveTo(cx-w*0.5*sc, yy);
      p.quadraticCurveTo(cx, yy - h*1.0*sc, cx + w*0.5*sc, yy);
      strokeP(p, k===0? ribCol : rgba(ribCol, 0.75-k*0.11), k===0? 4.6 : 3);
    }
  } else if (ribs==='cross'){
    for (const s of [-1,1]){
      const p = new Path2D();
      p.moveTo(cx - s*w*0.5, by);
      p.quadraticCurveTo(cx - s*w*0.06, by - h*0.88, bcx + s*bw*0.5, bby);
      strokeP(p, ribCol, 4.4);
    }
    const p2 = new Path2D(); p2.moveTo(cx-w*0.5, by); p2.quadraticCurveTo(cx, by-h*1.04, cx+w*0.5, by);
    strokeP(p2, ribCol, 4.4);
    const p3 = new Path2D(); p3.moveTo(bcx-bw*0.5, bby); p3.quadraticCurveTo(bcx, bby-bh*1.04, bcx+bw*0.5, bby);
    strokeP(p3, rgba(ribCol,0.55), 3);
  } else if (ribs==='rib'){
    for (let i=-2;i<=2;i++){
      const p = new Path2D();
      p.moveTo(cx + i*w*0.24, by);
      p.quadraticCurveTo(cx + i*w*0.11, by - h*0.90, bcx + i*bw*0.24, bby);
      strokeP(p, ribCol, 3.6);
    }
    for (let k=1;k<=3;k++){
      const t=k/4, sc=1-t*(1-bs), yy=by-t*depth;
      const p = new Path2D();
      for (let i=-2;i<=2;i++){
        const x = cx + i*w*0.24*sc, y = yy - h*0.92*sc;
        i===-2? p.moveTo(x,y) : p.lineTo(x,y);
      }
      strokeP(p, rgba(ribCol,0.55), 2.4);
    }
  }
  // 前缘
  fs(front.path, null, rgba(GOLD,0.42), 2.6);
  return front;
}
