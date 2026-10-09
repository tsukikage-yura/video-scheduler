// ============================================================================
//  face.js — 卡通面部表情「参数化」系统
//  一张脸 = 一个参数向量 P；一个表情 = P 的一组取值。
//  所有几何都由参数推导，没有任何硬编码的「这个表情画这样」。
// ============================================================================
var INK   = '#3a2f4d';        // 统一描边色：偏紫的暖黑，比纯黑「高级」
var INK2  = '#241c33';        // 用于最重的线（上眼睑）
var SKIN  = '#ffd9b8';
var BLUSH = '#ff8fa8';

function baseParams(){ return {
  // —— 头 ——
  cx:0, cy:0, rx:168, ry:176, jaw:0.26, headFill:SKIN, headStroke:INK, headLW:8,
  hair:'fringe', hairColor:'#7a4b34', hairBack:'#5d3728',
  // —— 眼 ——
  eyeDX:78, eyeDY:28, eyeRX:55, eyeRY:53, eyeOpen:1.0, eyeTilt:0.0,
  eyeGapX:0, eyeScale:0, wink:0,
  irisStyle:'iris', irisR:0.88, irisColor:'#3f74ad', pupilR:0.44,
  gazeX:0, gazeY:0, lidTop:0, lash:0, closedShape:1, eyeShine:1,
  // —— 眉 ——
  brow:'arc', browGap:32, browW:0.94, browThick:11, browArch:11,
  browTilt:0, browRot:0, browLift:0, browColor:'#57301c',
  // —— 嘴 ——
  mouth:'line', mouthDY:118, mouthW:88, mouthH:24, curve:0.60, mouthOpen:0, mouthSkew:0,
  mouthLine:INK, mouthLW:7.5, tongue:false, teeth:false,
  // —— 腮红 ——
  blush:0, blushColor:BLUSH, blushDX:104, blushDY:56, blushRX:44, blushRY:24, blushStyle:'soft',
  // —— 特效 ——
  sweat:0, tear:0, anger:0, question:0, spiral:0, shock:0, gloom:0, sparkle:0, fxColor:null
}; }
function P(over){ var b=baseParams(); if(over) for(var k in over) b[k]=over[k]; return b; }

// ============================================================================
//  头
// ============================================================================
var HEAD_PTS = null;
function headAnchors(p){
  var a=[], n=20;
  for(var i=0;i<n;i++){
    var t=i/n*TAU - Math.PI/2;
    var x=Math.cos(t), y=Math.sin(t);
    var taper = 1 - p.jaw*clamp((y+0.10)/1.10,0,1);      // 下颌收窄 -> 蛋形脸
    a.push([p.cx + x*p.rx*taper, p.cy + y*p.ry]);
  }
  return a;
}
function clipHead(){ if(!HEAD_PTS) return; g.beginPath();
  g.moveTo(HEAD_PTS[0][0],HEAD_PTS[0][1]);
  for(var i=1;i<HEAD_PTS.length;i++) g.lineTo(HEAD_PTS[i][0],HEAD_PTS[i][1]);
  g.closePath(); g.clip(); }
function fillHeadPath(){ g.beginPath(); g.moveTo(HEAD_PTS[0][0],HEAD_PTS[0][1]);
  for(var i=1;i<HEAD_PTS.length;i++) g.lineTo(HEAD_PTS[i][0],HEAD_PTS[i][1]); g.closePath(); }

function drawHead(p){
  HEAD_PTS = catmullPts(headAnchors(p), true, 1, 16);
  var pts = HEAD_PTS;
  fillPts(g, pts, p.headFill);
  g.save(); fillHeadPath(); g.clip();
  // 左上暖光
  var rg=g.createRadialGradient(p.cx-p.rx*0.42,p.cy-p.ry*0.52,6, p.cx-p.rx*0.42,p.cy-p.ry*0.52,p.rx*1.35);
  rg.addColorStop(0, lightOf(p.headFill,0.42)); rg.addColorStop(0.5,'rgba(255,255,255,0)');
  g.fillStyle=rg; g.fillRect(p.cx-p.rx*2,p.cy-p.ry*2,p.rx*4,p.ry*4);
  // 右下冷影（关键：影子里带一点冷紫，色块立刻有体积）
  var rg2=g.createRadialGradient(p.cx+p.rx*0.72,p.cy+p.ry*0.80,p.rx*0.15, p.cx+p.rx*0.72,p.cy+p.ry*0.80,p.rx*1.35);
  rg2.addColorStop(0,'rgba(126,86,150,0.26)'); rg2.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=rg2; g.fillRect(p.cx-p.rx*2,p.cy-p.ry*2,p.rx*4,p.ry*4);
  // 下缘「边缘阴影」：沿轮廓内侧一圈暗带 —— 廉价但极有效的体积感
  g.save(); g.globalAlpha=0.30;
  var lg=g.createLinearGradient(0,p.cy+p.ry*0.10,0,p.cy+p.ry*1.02);
  lg.addColorStop(0,'rgba(0,0,0,0)'); lg.addColorStop(1,'rgba(110,70,130,0.95)');
  g.fillStyle=lg; g.fillRect(p.cx-p.rx*1.2, p.cy+p.ry*0.10, p.rx*2.4, p.ry*1.0);
  g.restore(); g.restore();
  // 变宽度描边：头顶两侧粗、下巴细
  taperStroke(g, pts, function(t){
    return p.headLW*(0.66+0.34*Math.pow(Math.abs(Math.cos(Math.PI*t)),0.7));
  }, p.headStroke);
}

// ============================================================================
//  头发
// ============================================================================
function drawHair(p, mode){
  if(p.hair==='none') return;
  if(mode==='back'){
    var c=p.hairBack||shadowOf(p.hairColor,0.18), A=[], n=26;
    for(var i=0;i<n;i++){
      var t=i/n*TAU - Math.PI/2, sy=Math.sin(t);
      var x=p.cx+Math.cos(t)*p.rx*1.15;
      var y=p.cy+sy*p.ry*1.08;
      if(sy>0) y += p.ry*(0.30+0.16*Math.cos(t))*sy*sy;     // 发梢下垂，避免「头盔」
      A.push([x,y]);
    }
    fillPts(g, catmullPts(A,true,1,10), c);
    return;
  }
  var c=p.hairColor, lt=lightOf(c,0.34);
  // 前发：从左鬓角绕头顶到右鬓角，再沿刘海下缘回来
  var fr=[], n2=16, a0=Math.PI*0.985, a1=Math.PI*2.015;
  for(var i=0;i<=n2;i++){ var t=a0+(a1-a0)*i/n2;
    fr.push([p.cx+Math.cos(t)*p.rx*1.055, p.cy+Math.sin(t)*p.ry*1.055]); }
  // 刘海下缘：以 ry 比例定义，保证换头型时比例稳定
  var W_;
  if(p.hair==='bowl')       W_=[[0.78,-0.60],[0.30,-0.34],[0,-0.54],[-0.30,-0.34],[-0.78,-0.60]];
  else if(p.hair==='spiky') W_=[[0.88,-0.62],[0.50,-0.26],[0.16,-0.56],[-0.26,-0.22],[-0.62,-0.54],[-0.92,-0.64]];
  else if(p.hair==='sweep') W_=[[0.96,-0.50],[0.58,-0.76],[0.20,-0.40],[-0.28,-0.66],[-0.68,-0.54],[-0.96,-0.60]];
  else if(p.hair==='long')  W_=[[0.98,-0.46],[0.42,-0.50],[0,-0.64],[-0.42,-0.50],[-0.98,-0.46]];
  else                      W_=[[0.84,-0.60],[0.40,-0.42],[0,-0.58],[-0.40,-0.42],[-0.84,-0.60]];
  for(var i=0;i<W_.length;i++) fr.push([p.cx+W_[i][0]*p.rx, p.cy+W_[i][1]*p.ry]);
  fillPts(g, catmullPts(fr,true,0.9,10), c);
  // 发丝高光带（沿头顶弧线一条浅色粗线，再叠一条更细更亮的）
  g.save(); g.globalAlpha=0.34; g.lineCap='round';
  var hl=[]; for(var i=0;i<=14;i++){ var t=a0+(a1-a0)*i/14;
    hl.push([p.cx+Math.cos(t)*p.rx*0.80, p.cy+Math.sin(t)*p.ry*0.80]); }
  strokePath(g, lt, 20, function(gg){ catmull(gg, hl, false, 1); });
  g.globalAlpha=0.30;
  strokePath(g, '#ffffff', 7, function(gg){ catmull(gg, hl, false, 1); });
  g.restore();
  // 只描刘海下缘（不描整圈），线宽两端细中间粗
  var edge=[]; for(var i=0;i<W_.length;i++) edge.push([p.cx+W_[i][0]*p.rx, p.cy+W_[i][1]*p.ry]);
  edge.unshift([p.cx+p.rx*0.90, p.cy-p.ry*0.60]); edge.push([p.cx-p.rx*0.90, p.cy-p.ry*0.60]);
  taperStroke(g, catmullPts(edge,false,0.9,10),
    function(t){ return p.headLW*1.0*(0.40+0.60*Math.sin(Math.PI*t)); }, INK);
}

// ============================================================================
//  眼睛  —— 全脸信息量最大的 3 个参数：eyeOpen / irisR / lidTop
// ============================================================================
function irisPath(style,r){
  if(style==='heart'){ g.beginPath(); g.moveTo(0,r*0.95);
    g.bezierCurveTo(-r*1.5,-r*0.10,-r*0.60,-r*1.20,0,-r*0.36);
    g.bezierCurveTo(r*0.60,-r*1.20,r*1.5,-r*0.10,0,r*0.95); g.closePath(); return; }
  if(style==='star'){ g.beginPath();
    for(var i=0;i<10;i++){ var a=-Math.PI/2+i*Math.PI/5, rr=(i%2?r*0.46:r*1.06);
      var x=Math.cos(a)*rr, y=Math.sin(a)*rr; i?g.lineTo(x,y):g.moveTo(x,y); } g.closePath(); return; }
  if(style==='cross'){ g.beginPath(); var t=r*0.36;
    g.moveTo(-t,-r); g.lineTo(t,-r); g.lineTo(t,-t); g.lineTo(r,-t); g.lineTo(r,t); g.lineTo(t,t);
    g.lineTo(t,r); g.lineTo(-t,r); g.lineTo(-t,t); g.lineTo(-r,t); g.lineTo(-r,-t); g.lineTo(-t,-t); g.closePath(); return; }
  if(style==='spiral'){ g.beginPath();
    for(var i=0;i<=160;i++){ var u=i/160, a=u*TAU*2.7, rr=r*u;
      var x=Math.cos(a)*rr,y=Math.sin(a)*rr; i?g.lineTo(x,y):g.moveTo(x,y); } return; }
  if(style==='x'){ g.beginPath(); g.moveTo(-r*0.85,-r*0.85); g.lineTo(r*0.85,r*0.85);
    g.moveTo(r*0.85,-r*0.85); g.lineTo(-r*0.85,r*0.85); return; }
  g.beginPath(); g.arc(0,0,r,0,TAU); g.closePath();
}
function drawEye(p, side){
  var ex = p.cx + side*p.eyeDX + side*p.eyeGapX, ey = p.cy + p.eyeDY;
  var rx = p.eyeRX*(1+p.eyeScale), ryB = p.eyeRY;
  var closed = (p.wink===1&&side<0)||(p.wink===2&&side>0)||p.eyeOpen<0.06;
  g.save(); g.translate(ex,ey); g.rotate(p.eyeTilt*side);

  if(closed){
    // ★ 闭眼 = 一条零面积曲线。方向（∧/∨）就是情绪的符号。
    var h = ryB*0.62*p.closedShape;
    var cp=[[-rx,-h*0.10],[-rx*0.52,-h*0.80],[0,-h],[rx*0.52,-h*0.80],[rx,-h*0.10]];
    var d=catmullPts(cp,false,1,14);
    taperStroke(g,d,function(t){ return p.headLW*(0.34+0.86*Math.pow(Math.sin(Math.PI*t),0.6)); }, INK2);
    g.restore(); return;
  }
  var ry = ryB*p.eyeOpen;
  // ---- 眼白 + 虹膜（全部裁在眼型里）----
  g.save();
  g.beginPath(); g.ellipse(0,0,rx,ry,0,0,TAU); g.clip();
  g.fillStyle='#fffdfa'; g.fillRect(-rx,-ry,rx*2,ry*2);
  // 眼白上缘的浅影（眼睑投下的）
  var sg=g.createLinearGradient(0,-ry,0,ry*0.3);
  sg.addColorStop(0,'rgba(150,120,170,0.42)'); sg.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=sg; g.fillRect(-rx,-ry,rx*2,ry*1.3);
  // 虹膜被眼睑裁切时按可见开口收缩，否则半闭眼会糊成一团黑
  var ir = Math.min(ryB*p.irisR, ry*1.06)*(p.irisStyle==='none'?0:1);
  var gx = p.gazeX*rx*0.26, gy = p.gazeY*ry*0.26;
  if(p.irisStyle!=='none' && ir>1){
    g.save(); g.translate(gx,gy);
    // 虹膜本体：上暗下亮（上眼睑投影 + 下半反光）
    irisPath(p.irisStyle, ir);
    var lineStyle = (p.irisStyle==='x'||p.irisStyle==='spiral');
    if(lineStyle){ g.strokeStyle=p.irisColor; g.lineWidth=ir*0.34; g.lineCap='round';
      g.lineJoin='round'; g.stroke(); }
    else { g.fillStyle=shade(p.irisColor,-0.30); g.fill(); }
    if(p.irisStyle==='iris'){
      g.save(); irisPath('iris',ir); g.clip();
      var ig=g.createLinearGradient(0,-ir,0,ir);
      ig.addColorStop(0, shade(p.irisColor,-0.42));
      ig.addColorStop(0.42, p.irisColor);
      ig.addColorStop(1, shade(p.irisColor,0.46));
      g.fillStyle=ig; g.fillRect(-ir,-ir,ir*2,ir*2);
      // 放射状纹理：16 条极淡的短线，是「眼睛有神」的隐藏细节
      g.globalAlpha=0.20; g.strokeStyle='#ffffff'; g.lineWidth=ir*0.055;
      for(var k=0;k<16;k++){ var a=k*TAU/16, r0=ir*0.34, r1=ir*0.98;
        g.beginPath(); g.moveTo(Math.cos(a)*r0,Math.sin(a)*r0);
        g.lineTo(Math.cos(a)*r1,Math.sin(a)*r1); g.stroke(); }
      g.globalAlpha=1;
      // 虹膜外环
      g.strokeStyle=shade(p.irisColor,-0.55); g.lineWidth=ir*0.13;
      g.beginPath(); g.arc(0,0,ir*0.95,0,TAU); g.stroke();
      g.restore();
    }
    // 瞳孔
    if(!lineStyle){ g.fillStyle='#171024'; g.beginPath(); g.arc(0,0,ir*p.pupilR,0,TAU); g.fill(); }
    // 高光：大高光偏左上，小高光偏右下（两点高光 = 通透感）
    if(p.eyeShine>0 && !lineStyle){
      g.fillStyle='#ffffff';
      g.beginPath(); g.ellipse(-ir*0.34,-ir*0.44, ir*0.30, ir*0.34, -0.35, 0, TAU); g.fill();
      g.globalAlpha=0.85;
      g.beginPath(); g.arc(ir*0.36, ir*0.40, ir*0.16, 0, TAU); g.fill();
      g.globalAlpha=1;
    }
    g.restore();
  }
  // 上眼睑压下（愤怒/冷漠）
  if(p.lidTop>0){ g.fillStyle=p.headFill; g.fillRect(-rx-3,-ry-3,rx*2+6, (ry*2+6)*p.lidTop); }
  g.restore();
  // ---- 描边：整圈细线 + 上眼睑粗线（卡通眼睛的灵魂）----
  g.strokeStyle=INK; g.lineWidth=p.headLW*0.34;
  g.beginPath(); g.ellipse(0,0,rx,ry,0,0,TAU); g.stroke();
  g.strokeStyle=INK2; g.lineWidth=p.headLW*(1.12+p.lash*0.8); g.lineCap='round';
  g.beginPath(); g.ellipse(0,0,rx,ry,0,Math.PI*1.03,Math.PI*1.97); g.stroke();
  // 外眼角的一小撇睫毛
  var lx=side*rx*0.94, ly=-ry*0.42;
  taperStroke(g, [[lx,ly],[lx+side*rx*0.40,-ry*0.86-p.lash*14]],
    function(t){ return p.headLW*1.0*(1-t*0.85); }, INK2);
  g.restore();
}

// ============================================================================
//  眉毛 —— 角度比形状更重要：内端高度决定情绪的正负
// ============================================================================
function drawBrow(p, side){
  if(p.brow==='none') return;
  var topY = p.cy + p.eyeDY - p.eyeRY*Math.max(p.eyeOpen,0.55);
  var bx = p.cx + side*p.eyeDX, by = topY - p.browGap - p.browLift;
  var w = p.eyeRX*p.browW, arch=p.browArch, tilt=p.browTilt;
  var thick = p.browThick;
  if(p.brow==='flat'){ arch = 0; }
  if(p.brow==='thick'){ thick = p.browThick*1.55; arch = Math.min(arch,6); }
  if(p.brow==='thin'){ thick = p.browThick*0.62; arch = arch*1.5; }
  // 局部坐标：+x 指向脸的外侧
  var A=[[-w, -tilt*1.00],[-w*0.42,-tilt*0.92-arch],[w*0.46,-tilt*0.42-arch*0.80],[w, 0]];
  var rot=p.browRot*side;
  var pts=A.map(function(q){
    var qx=q[0], qy=q[1];
    var rx_=qx*Math.cos(rot)-qy*Math.sin(rot), ry_=qx*Math.sin(rot)+qy*Math.cos(rot);
    return [bx+side*rx_, by+ry_];
  });
  taperStroke(g, catmullPts(pts,false,1,14),
    function(t){ return thick*(0.34+0.82*Math.pow(Math.sin(Math.PI*(0.10+0.80*t)),0.75)); }, p.browColor);
}

// ============================================================================
//  嘴 —— 'line'（闭口线）与 'open'（张口）共用一个 curve 参数
// ============================================================================
function drawMouth(p){
  if(p.mouth==='none') return;
  var mx=p.cx, my=p.cy+p.mouthDY, mw=p.mouthW/2, mh=p.mouthH;
  if(p.mouth==='line'){
    var sk=p.mouthSkew;
    var cp=[[-mw, sk*0.35],[-mw*0.46, p.curve*mh+sk*0.55],[0, p.curve*mh*1.20+sk],[mw*0.46, p.curve*mh+sk*0.55],[mw, sk*0.35]];
    var d=catmullPts(cp,false,1,16);
    taperStroke(g,d,function(t){ return p.mouthLW*(0.36+0.90*Math.pow(Math.sin(Math.PI*t),0.65)); }, p.mouthLine);
    return;
  }
  if(p.mouth==='smirk'){
    var cp3=[[-mw, mh*0.30],[-mw*0.42, p.curve*mh*0.5],[mw*0.20, -mh*0.62],[mw, -mh*0.98]];
    var d3=catmullPts(cp3,false,1,16);
    taperStroke(g,d3,function(t){ return p.mouthLW*(0.38+0.92*Math.pow(Math.sin(Math.PI*(0.06+0.88*t)),0.65)); }, p.mouthLine);
    return;
  }
  if(p.mouth==='wavy'){
    var d2=catmullPts([[-mw,0],[-mw*0.5,-mh*0.9],[0,0],[mw*0.5,mh*0.9],[mw,0]],false,1,16);
    taperStroke(g,d2,function(t){ return p.mouthLW*(0.36+0.90*Math.sin(Math.PI*t)); }, p.mouthLine);
    return;
  }
  // ---- 张口：D 形，上缘是上唇线，下缘是张开的口腔 ----
  var o=clamp(p.mouthOpen,0,1), deep=mh*3.1*o;
  var out=[[-mw,0],[-mw*0.52,-mh*0.16],[0,-mh*0.26],[mw*0.52,-mh*0.16],[mw,0],
           [mw*0.66, deep*0.70],[0, deep],[-mw*0.66, deep*0.70]];
  var dense=catmullPts(out,true,1,14);
  fillPts(g, dense, '#6a2437');
  g.save(); g.beginPath(); g.moveTo(dense[0][0],dense[0][1]);
  for(var i=1;i<dense.length;i++) g.lineTo(dense[i][0],dense[i][1]); g.closePath(); g.clip();
  var rg=g.createLinearGradient(0,-mh*0.3,0,deep);
  rg.addColorStop(0,'rgba(0,0,0,0.55)'); rg.addColorStop(0.55,'rgba(0,0,0,0.06)'); rg.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=rg; g.fillRect(-mw,-mh*0.4,mw*2,deep+mh);
  if(p.tongue){ g.fillStyle='#e8687f';
    g.beginPath(); g.ellipse(0, deep*0.92, mw*0.62, deep*0.42, 0,0,TAU); g.fill();
    g.fillStyle='rgba(255,255,255,0.20)';
    g.beginPath(); g.ellipse(-mw*0.16, deep*0.80, mw*0.22, deep*0.13, -0.3,0,TAU); g.fill(); }
  if(p.teeth){ g.fillStyle='#fffaf2'; g.fillRect(-mw*0.94,-mh*0.4, mw*1.88, mh*0.60);
    g.fillStyle='rgba(180,150,190,0.30)'; g.fillRect(-mw*0.94, mh*0.05, mw*1.88, mh*0.16); }
  g.restore();
  taperStroke(g, dense, function(t){ return p.mouthLW*(0.55+0.62*Math.sin(Math.PI*t)); }, p.mouthLine);
}

// ============================================================================
//  腮红
// ============================================================================
function drawBlush(p){
  if(p.blush<=0) return;
  [-1,1].forEach(function(s){
    var x=p.cx+s*p.blushDX, y=p.cy+p.blushDY;
    var rg=g.createRadialGradient(x,y,0,x,y,p.blushRX);
    rg.addColorStop(0,p.blushColor); rg.addColorStop(0.58,p.blushColor); rg.addColorStop(1,'rgba(255,255,255,0)');
    g.save(); g.globalAlpha=clamp(p.blush,0,1)*0.88; g.fillStyle=rg;
    g.save(); g.translate(x,y); g.scale(1,p.blushRY/p.blushRX);
    g.beginPath(); g.arc(0,0,p.blushRX,0,TAU); g.fill(); g.restore(); g.restore();
    if(p.blushStyle==='hatch'){
      g.save(); g.globalAlpha=clamp(p.blush,0,1)*0.72; g.strokeStyle=p.blushColor; g.lineWidth=5; g.lineCap='round';
      for(var i=-2;i<=2;i++){ g.beginPath();
        g.moveTo(x+i*13-7, y+16); g.lineTo(x+i*13+7, y-16); g.stroke(); }
      g.restore();
    }
  });
}

// ============================================================================
//  特效符号 —— 每个都是「最小可识别符号」
// ============================================================================
function dropPath(x,y,s,rot){ g.save(); g.translate(x,y); g.rotate(rot||0); g.beginPath();
  g.moveTo(0,-s*1.35);
  g.bezierCurveTo(s*0.72,-s*0.42, s*1.02,s*0.16, s*0.62,s*0.70);
  g.bezierCurveTo(s*0.30,s*1.12,-s*0.30,s*1.12,-s*0.62,s*0.70);
  g.bezierCurveTo(-s*1.02,s*0.16,-s*0.72,-s*0.42,0,-s*1.35); g.closePath(); g.restore(); }
function drawSweat(p){
  if(p.sweat<=0) return;
  var x=p.cx+p.rx*0.98, y=p.cy-p.ry*0.40, s=26;
  g.save(); g.globalAlpha=clamp(p.sweat,0,1);
  g.fillStyle='#8fd8f2'; dropPath(x,y,s,-0.28); g.fill();
  g.strokeStyle=INK; g.lineWidth=5; g.stroke();
  g.fillStyle='rgba(255,255,255,0.95)';
  g.beginPath(); g.ellipse(x-s*0.28,y+s*0.14,s*0.20,s*0.32,-0.2,0,TAU); g.fill();
  g.restore();
}
function drawTear(p){
  if(p.tear<=0) return;
  [-1,1].forEach(function(sd){
    var x=p.cx+sd*p.eyeDX*1.02, y=p.cy+p.eyeDY+p.eyeRY*p.eyeOpen+26;
    g.save(); g.globalAlpha=clamp(p.tear,0,1);
    strokePath(g,'rgba(127,208,245,0.80)',10,function(gg){ gg.moveTo(x-sd*3,y+10);
      gg.bezierCurveTo(x+sd*10,y+56, x-sd*12,y+82, x+sd*3,y+124); });
    g.fillStyle='#7fd0f5'; dropPath(x,y,22,0); g.fill();
    g.strokeStyle=INK; g.lineWidth=4.5; g.stroke();
    g.fillStyle='rgba(255,255,255,0.92)'; g.beginPath(); g.ellipse(x-5,y+4,4.5,6.5,0,0,TAU); g.fill();
    g.restore();
  });
}
function drawAnger(p){
  if(p.anger<=0) return;
  var x=p.cx-p.rx*1.02, y=p.cy-p.ry*0.80, s=34;
  g.save(); g.globalAlpha=clamp(p.anger,0,1); g.translate(x,y); g.rotate(-0.18);
  g.fillStyle='#ff4d5e'; g.beginPath();
  for(var i=0;i<4;i++){ var a=-Math.PI/2+i*Math.PI/2;
    var x1=Math.cos(a)*s,y1=Math.sin(a)*s, x2=Math.cos(a+Math.PI/4)*s*0.30,y2=Math.sin(a+Math.PI/4)*s*0.30,
        x3=Math.cos(a+Math.PI/2)*s,y3=Math.sin(a+Math.PI/2)*s;
    if(i===0) g.moveTo(x1,y1); else g.lineTo(x1,y1);
    g.quadraticCurveTo(x2*2.0,y2*2.0,x3,y3); }
  g.closePath(); g.fill(); g.strokeStyle=INK; g.lineWidth=4; g.stroke(); g.restore();
}
function drawShock(p){
  if(p.shock<=0) return;
  g.save(); g.globalAlpha=clamp(p.shock,0,1); g.strokeStyle='#ffd93d'; g.lineCap='round';
  var N=11;
  for(var i=0;i<N;i++){ var a=-Math.PI/2+(i-(N-1)/2)*0.29;
    var r0=p.rx*1.16, r1=p.rx*(1.44+0.11*Math.cos(i*1.9));
    g.lineWidth=8; g.beginPath();
    g.moveTo(p.cx+Math.cos(a)*r0, p.cy+Math.sin(a)*r0*0.92);
    g.lineTo(p.cx+Math.cos(a)*r1, p.cy+Math.sin(a)*r1*0.92); g.stroke(); }
  g.restore();
}
function drawGloom(p){
  if(p.gloom<=0) return;
  g.save(); g.globalAlpha=clamp(p.gloom,0,1)*0.85; g.strokeStyle='#6d6a9c'; g.lineWidth=7; g.lineCap='round';
  for(var i=0;i<5;i++){ var x=p.cx-p.rx*0.78+i*p.rx*0.39;
    g.beginPath(); g.moveTo(x, p.cy-p.ry*0.98);
    g.bezierCurveTo(x-13,p.cy-p.ry*1.36, x+13,p.cy-p.ry*1.72, x, p.cy-p.ry*2.06); g.stroke(); }
  g.restore();
}
function drawSpiral(p){
  if(p.spiral<=0) return;
  g.save(); g.globalAlpha=clamp(p.spiral,0,1); g.strokeStyle='#8a7fd0'; g.lineWidth=11; g.lineCap='round';
  g.beginPath();
  for(var i=0;i<=190;i++){ var u=i/190, a=u*TAU*3.2, r=8+u*46;
    var x=p.cx-p.rx*0.88+Math.cos(a)*r, y=p.cy-p.ry*0.86+Math.sin(a)*r; i?g.lineTo(x,y):g.moveTo(x,y); }
  g.stroke(); g.restore();
}
function drawQuestion(p){
  if(p.question<=0) return;
  var x=p.cx+p.rx*0.84, y=p.cy-p.ry*1.08;
  g.save(); g.globalAlpha=clamp(p.question,0,1); g.translate(x,y); g.rotate(0.16);
  g.strokeStyle='#ffd93d'; g.lineWidth=16; g.lineCap='round';
  g.beginPath(); g.arc(0,-16,26,Math.PI*1.06,Math.PI*0.44); g.stroke();
  g.beginPath(); g.moveTo(11,6); g.lineTo(4,34); g.stroke();
  g.fillStyle='#ffd93d'; g.beginPath(); g.arc(2,56,9.5,0,TAU); g.fill(); g.restore();
}
function drawSparkle(p){
  if(p.sparkle<=0) return;
  g.save(); g.globalAlpha=clamp(p.sparkle,0,1); g.fillStyle='#fff4b8';
  var spots=[[-1.36,-0.82,21],[1.28,-1.00,28],[1.60,0.28,17],[-1.62,0.34,19],[-0.42,-1.34,15],[0.66,-1.22,13]];
  for(var i=0;i<spots.length;i++){ var s=spots[i];
    var x=p.cx+s[0]*p.rx, y=p.cy+s[1]*p.ry, r=s[2];
    g.beginPath();
    for(var k=0;k<8;k++){ var a=k*Math.PI/4, rr=(k%2?r*0.26:r);
      var px=x+Math.cos(a)*rr, py=y+Math.sin(a)*rr; k?g.lineTo(px,py):g.moveTo(px,py); }
    g.closePath(); g.fill(); }
  g.restore();
}

// ============================================================================
//  合成
// ============================================================================
function drawFace(p){
  if(p.gloom>0)  drawGloom(p);
  if(p.shock>0)  drawShock(p);
  if(p.spiral>0) drawSpiral(p);
  drawHair(p,'back');
  drawHead(p);
  drawHair(p,'front');
  drawBrow(p,-1); drawBrow(p,1);
  drawEye(p,-1);  drawEye(p,1);
  drawBlush(p);
  drawMouth(p);
  if(p.tear>0)  drawTear(p);
  if(p.sweat>0) drawSweat(p);
  if(p.anger>0) drawAnger(p);
  if(p.question>0) drawQuestion(p);
  if(p.sparkle>0)  drawSparkle(p);
}

// ============================================================================
//  ★★★ 表情预设表 —— 这就是「参数化表情」的答案 ★★★
//  每个表情 = 一组参数覆盖。标量可插值 → 表情可连续切换（见 e021/e030）
// ============================================================================
var EXPR = {
  neutral:{ name:'平静 NEUTRAL' },
  happy:{ name:'高兴 HAPPY',
    eyeOpen:0.0, closedShape:1, browGap:34, browArch:17, browThick:10,
    mouth:'open', mouthW:98, mouthH:22, mouthOpen:0.90, tongue:true, mouthDY:108,
    blush:0.62 },
  surprised:{ name:'惊讶 SURPRISED',
    eyeOpen:1.30, eyeRY:58, eyeScale:0.07, irisR:0.50, pupilR:0.46, browGap:58, browLift:10,
    browArch:26, browThick:9.5, mouth:'open', mouthW:50, mouthH:16, mouthOpen:0.70,
    mouthDY:118, shock:0.85 },
  angry:{ name:'愤怒 ANGRY',
    eyeOpen:0.78, lidTop:0.28, eyeTilt:0.16, browGap:10, browTilt:-22, browArch:-7,
    browThick:15, irisR:0.80, pupilR:0.52, mouth:'line', mouthW:106, mouthH:20,
    curve:-0.90, mouthDY:124, anger:1, blush:0.30, blushColor:'#ff5f6d' },
  sad:{ name:'悲伤 SAD',
    eyeOpen:0.74, lidTop:0.18, eyeTilt:-0.20, browGap:22, browTilt:26, browArch:5,
    browRot:0.10, mouth:'line', mouthW:68, mouthH:18, curve:-0.62, mouthDY:128,
    tear:0.95, gloom:0.85, blush:0.22, irisR:1.00 },
  confused:{ name:'困惑 CONFUSED',
    eyeOpen:0.94, eyeScale:0.10, eyeTilt:-0.12, browGap:24, browTilt:9, browArch:15,
    browRot:-0.26, browThick:11, mouth:'wavy', mouthW:62, mouthH:11, mouthDY:122,
    question:1, sweat:0.55, gazeX:0.55 },
  shy:{ name:'害羞 SHY',
    eyeOpen:0.0, closedShape:1, browGap:32, browArch:15, mouth:'line', mouthW:46,
    mouthH:12, curve:0.42, mouthDY:122, blush:1.0, blushRX:60, blushRY:32,
    blushStyle:'hatch', sweat:0.30, gazeY:0.4 },
  dead:{ name:'呆滞 DEAD',
    eyeOpen:1.0, irisStyle:'x', irisColor:'#4b4568', brow:'none', mouth:'line',
    mouthW:42, mouthH:7, curve:0, mouthDY:126, gloom:0.55, blush:0 },
  love:{ name:'心动 LOVE',
    eyeOpen:1.10, irisStyle:'heart', irisColor:'#ff5f8f', irisR:0.86, browGap:30,
    browArch:19, mouth:'line', mouthW:74, mouthH:18, curve:0.95, mouthDY:120,
    blush:0.9, blushColor:'#ff7ba8', sparkle:0.9 },
  wink:{ name:'眨眼 WINK', wink:1, browGap:32, browArch:17, mouth:'open', mouthW:84,
    mouthH:20, mouthOpen:0.72, tongue:true, mouthDY:110, blush:0.55 },
  shock2:{ name:'惊恐 TERROR',
    eyeOpen:1.42, eyeRY:62, irisR:0.40, pupilR:0.60, browGap:60, browLift:14,
    browArch:28, mouth:'open', mouthW:74, mouthH:22, mouthOpen:1.0, mouthDY:120,
    sweat:1.0, shock:1.0, gloom:0.4 },
  cry:{ name:'大哭 CRY',
    eyeOpen:0.0, closedShape:-1, browGap:18, browTilt:24, browArch:4, browRot:0.12,
    mouth:'open', mouthW:86, mouthH:20, mouthOpen:0.95, mouthDY:126,
    tear:1.0, blush:0.35, blushStyle:'hatch' }
};
function expr(name, over){
  var e = EXPR[name]||{}, p = P();
  for(var k in e) if(k!=='name') p[k]=e[k];
  if(over) for(var k in over) p[k]=over[k];
  return p;
}
function exprName(n){ return (EXPR[n]&&EXPR[n].name)||n; }

// ★★ 表情插值：标量线性插值；枚举在 t=0.5 处切换；特效数值自然淡入淡出。
//    这就是「表情切换动画」的全部秘密 —— 不逐帧画，只插参数。
var ENUM_KEYS=['hair','irisStyle','brow','mouth','headFill','headStroke','mouthLine',
               'browColor','irisColor','blushColor','hairColor','hairBack','blushStyle','closedShape'];
function lerpExpr(a,b,t){
  var out=P();
  for(var k in a){
    if(ENUM_KEYS.indexOf(k)>=0){ out[k]=(t<0.5?a[k]:b[k]); }
    else if(typeof a[k]==='number' && typeof b[k]==='number'){ out[k]=lerp(a[k],b[k],t); }
    else { out[k]=(t<0.5?a[k]:b[k]); }
  }
  return out;
}
// 三停关键帧之间的分段插值
function lerpExprSeq(list, u){   // u∈[0,1]
  var n=list.length-1, x=clamp(u,0,1)*n, i=Math.min(Math.floor(x), n-1);
  return lerpExpr(list[i], list[i+1], x-i);
}
