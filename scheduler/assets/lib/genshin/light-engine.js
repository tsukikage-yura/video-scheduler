
/* ================= 原神式夜景 · 冷暖光效引擎 v3 ================= */
var PAL={
  skyTop:'#05081a', skyBot:'#0b1029',
  wallHi:'#1a1f45', wallLo:'#0c1030',
  winA:'#223c6b', winB:'#5477a4', winC:'#7f9cba',
  stone:'#232c5c', gold:'#d8a94e', goldLite:'#f7e0a4', white:'#eef3fc'
};
function hs(i){var x=Math.sin(i*127.1+311.7)*43758.5453; return x-Math.floor(x);}
function gothicArch(g,x,y,w,ah,tip){
  g.beginPath(); g.moveTo(x,y); g.lineTo(x,y-ah);
  g.bezierCurveTo(x,y-ah-tip*0.62,x+w*0.30,y-ah-tip,x+w*0.5,y-ah-tip);
  g.bezierCurveTo(x+w*0.70,y-ah-tip,x+w,y-ah-tip*0.62,x+w,y-ah);
  g.lineTo(x+w,y); g.closePath();
}
function addGlow(g,x,y,r,a,col){
  if(a<=0||r<=0)return;
  var gr=g.createRadialGradient(x,y,0,x,y,r);
  gr.addColorStop(0,'rgba('+col+','+a+')');
  gr.addColorStop(0.35,'rgba('+col+','+(a*0.34)+')');
  gr.addColorStop(0.68,'rgba('+col+','+(a*0.10)+')');
  gr.addColorStop(1,'rgba('+col+',0)');
  g.fillStyle=gr; g.fillRect(x-r,y-r,r*2,r*2);
}
function goldStar(g,x,y,r,a){
  g.save(); g.fillStyle=PAL.goldLite; g.globalAlpha=(a==null?0.9:a);
  g.beginPath();
  g.moveTo(x,y-r); g.quadraticCurveTo(x+r*0.16,y-r*0.16,x+r,y);
  g.quadraticCurveTo(x+r*0.16,y+r*0.16,x,y+r);
  g.quadraticCurveTo(x-r*0.16,y+r*0.16,x-r,y);
  g.quadraticCurveTo(x-r*0.16,y-r*0.16,x,y-r);
  g.fill(); g.restore();
}
/* 体积光柱：从窗底向下张开；先画柱、后画人物 => 人物遮挡光柱 */
function shaftQuad(g,G,a,blur){
  var lg=g.createLinearGradient(0,G.yT,0,G.yB);
  lg.addColorStop(0,'rgba(206,232,255,1)');
  lg.addColorStop(0.35,'rgba(170,208,252,0.72)');
  lg.addColorStop(0.72,'rgba(142,184,238,0.36)');
  lg.addColorStop(1,'rgba(126,166,226,0.10)');
  g.save(); if(blur>0)g.filter='blur('+blur+'px)';
  g.globalAlpha=a; g.fillStyle=lg;
  g.beginPath(); g.moveTo(G.x0,G.yT); g.lineTo(G.x1,G.yT); g.lineTo(G.x2,G.yB); g.lineTo(G.x3,G.yB); g.closePath(); g.fill();
  g.restore();
}
function drawShaft(g,w,h,mode,a,ox,topY,halfW){
  if(a<=0)return;
  var sx=(ox==null?0.30:ox)*w;
  var yT=(topY==null?0.628:topY)*h, yB=1.03*h;
  var hw=(halfW==null?0.050:halfW)*w;
  var G={x0:sx-hw,x1:sx+hw,x2:sx+hw*2.0,x3:sx-hw*0.42,yT:yT,yB:yB};
  var i;
  g.save(); g.globalCompositeOperation='lighter';
  if(mode==='none'){ }
  else if(mode==='hard'){ shaftQuad(g,G,0.22*a,0); }
  else if(mode==='blur'){ shaftQuad(g,G,0.30*a,34); }
  else if(mode==='soft'){
    shaftQuad(g,{x0:G.x0-w*0.022,x1:G.x1+w*0.022,x2:G.x2+w*0.030,x3:G.x3-w*0.030,yT:G.yT,yB:G.yB},0.10*a,44);
    shaftQuad(g,G,0.20*a,16);
  }else if(mode==='rich'){
    shaftQuad(g,{x0:G.x0-w*0.026,x1:G.x1+w*0.026,x2:G.x2+w*0.036,x3:G.x3-w*0.036,yT:G.yT,yB:G.yB},0.17*a,50);
    shaftQuad(g,G,0.30*a,18);
    shaftQuad(g,{x0:G.x0+hw*0.35,x1:G.x1-hw*0.35,x2:G.x2-hw*0.70,x3:G.x3+hw*0.70,yT:G.yT,yB:G.yB},0.22*a,11);
    shaftQuad(g,{x0:sx-hw*0.42,x1:sx+hw*0.42,x2:sx+hw*1.05,x3:sx-hw*0.10,yT:G.yT,yB:G.yB},0.20*a,7);
    for(i=0;i<30;i++){
      var t=hs(i*4.7), u=hs(i*9.1);
      var yy=G.yT+(G.yB-G.yT)*t;
      var xl=G.x0+(G.x3-G.x0)*t, xr=G.x1+(G.x2-G.x1)*t;
      addGlow(g,xl+(xr-xl)*u,yy,(5+hs(i*2.3)*10)*(0.55+(h/540)*0.45),0.42*a*(1-t*0.5),'232,244,255');
    }
  }
  g.restore();
}
function vignette(g,w,h,a,topBot){
  if(a<=0)return;
  var gr=g.createRadialGradient(w*0.5,h*0.46,h*0.15,w*0.5,h*0.5,h*1.05);
  gr.addColorStop(0,'rgba(0,0,0,0)');
  gr.addColorStop(0.50,'rgba(3,5,18,'+(0.24*a)+')');
  gr.addColorStop(1,'rgba(1,2,10,'+(0.94*a)+')');
  g.fillStyle=gr; g.fillRect(0,0,w,h);
  if(topBot){
    var t=g.createLinearGradient(0,0,0,h*0.24); t.addColorStop(0,'rgba(2,4,14,'+(0.50*a)+')'); t.addColorStop(1,'rgba(2,4,14,0)');
    g.fillStyle=t; g.fillRect(0,0,w,h*0.24);
    var b=g.createLinearGradient(0,h,0,h*0.70); b.addColorStop(0,'rgba(2,4,14,'+(0.58*a)+')'); b.addColorStop(1,'rgba(2,4,14,0)');
    g.fillStyle=b; g.fillRect(0,h*0.70,w,h*0.30);
  }
}
function drawFigure(g,cx,feet,H,alpha,warmSide){
  var headR=H*0.088, headY=feet-H*0.892+headR;
  var warmR=(warmSide==null?1:warmSide);
  g.save(); g.globalAlpha=(alpha==null?0.95:alpha);
  /* 冷侧 -> 中间 -> 暖侧（提灯方向的边缘光） */
  var grd=g.createLinearGradient(cx-H*0.21,0,cx+H*0.21,0);
  grd.addColorStop(0.00,'#7d90b8');
  grd.addColorStop(0.26,'#c3d1ea');
  grd.addColorStop(0.52,'#eaf1fc');
  grd.addColorStop(0.80,'#f2e9d8');
  grd.addColorStop(1.00, warmR>0?'#ffd9a0':'#9aabc9');
  g.fillStyle=grd;
  /* 斗篷主体：肩 -> 收腰 -> 外张下摆 */
  g.beginPath();
  g.moveTo(cx-H*0.148,feet);
  g.bezierCurveTo(cx-H*0.146,feet-H*0.34,cx-H*0.128,feet-H*0.58,cx-H*0.124,feet-H*0.700);
  /* 肩 */
  g.bezierCurveTo(cx-H*0.122,feet-H*0.760,cx-H*0.086,feet-H*0.792,cx-H*0.062,headY+headR*1.12);
  g.bezierCurveTo(cx-H*0.036,headY+headR*0.62,cx+H*0.036,headY+headR*0.62,cx+H*0.062,headY+headR*1.12);
  g.bezierCurveTo(cx+H*0.086,feet-H*0.792,cx+H*0.122,feet-H*0.760,cx+H*0.132,feet-H*0.700);
  g.bezierCurveTo(cx+H*0.128,feet-H*0.58,cx+H*0.146,feet-H*0.34,cx+H*0.148,feet);
  g.closePath(); g.fill();
  /* 正面竖向亮条（袍子的受光面） */
  g.save(); g.globalAlpha=0.5;
  var fgr2=g.createLinearGradient(cx-H*0.06,0,cx+H*0.06,0);
  fgr2.addColorStop(0,'rgba(255,255,255,0)'); fgr2.addColorStop(0.5,'rgba(255,252,242,0.85)');
  fgr2.addColorStop(1,'rgba(255,255,255,0)');
  g.fillStyle=fgr2;
  g.beginPath();
  g.moveTo(cx-H*0.062,feet-H*0.02); g.lineTo(cx-H*0.052,feet-H*0.70);
  g.lineTo(cx+H*0.052,feet-H*0.70); g.lineTo(cx+H*0.062,feet-H*0.02); g.closePath(); g.fill();
  g.restore();
  /* 兜帽 */
  var hg=g.createLinearGradient(cx-headR,0,cx+headR,0);
  hg.addColorStop(0,'#8ea1c6'); hg.addColorStop(0.55,'#eef4fd');
  hg.addColorStop(1, warmR>0?'#ffe6bc':'#a4b5d2');
  g.fillStyle=hg;
  g.beginPath(); g.ellipse(cx,headY,headR*0.96,headR*1.10,0,0,Math.PI*2); g.fill();
  /* 兜帽阴影（脸） */
  g.save(); g.globalAlpha=0.30; g.fillStyle='#39466e';
  g.beginPath(); g.ellipse(cx+headR*0.10,headY+headR*0.16,headR*0.50,headR*0.60,0,0,Math.PI*2); g.fill(); g.restore();
  /* 接触阴影 */
  g.save(); g.globalCompositeOperation='multiply'; g.globalAlpha=0.45;
  g.fillStyle='#0a1030';
  g.beginPath(); g.ellipse(cx,feet,H*0.22,H*0.048,0,0,Math.PI*2); g.fill(); g.restore();
  /* 袍摆褶皱：3 条竖向暗线 */
  g.save(); g.globalAlpha=0.16; g.strokeStyle='#5a6a96'; g.lineWidth=H*0.006;
  for(var f=-1;f<=1;f++){
    g.beginPath(); g.moveTo(cx+f*H*0.052,feet-H*0.70); g.lineTo(cx+f*H*0.078,feet); g.stroke();
  }
  g.restore();
  /* 暖侧边缘光：细亮线 */
  if(warmR>0){
    g.save(); g.globalAlpha=0.62; g.strokeStyle='#ffd79c'; g.lineWidth=H*0.009;
    g.beginPath();
    g.moveTo(cx+H*0.148,feet);
    g.bezierCurveTo(cx+H*0.146,feet-H*0.34,cx+H*0.128,feet-H*0.58,cx+H*0.124,feet-H*0.700);
    g.bezierCurveTo(cx+H*0.122,feet-H*0.760,cx+H*0.086,feet-H*0.792,cx+H*0.062,headY+headR*1.12);
    g.stroke();
    g.beginPath(); g.ellipse(cx,headY,headR*0.96,headR*1.10,0.15,1.35,Math.PI*1.25); g.stroke();
    g.restore();
  }
  g.restore();
}
/* 前景框柱（左右深色装饰柱） */
function drawFrame(g,w,h,S){
  var P=function(v){return v*S;};
  function pillar(x0,dir){
    var pw=P(96);
    var lg=g.createLinearGradient(x0,0,x0+dir*pw,0);
    lg.addColorStop(0,'#05081a'); lg.addColorStop(0.45,'#0d1330'); lg.addColorStop(1,'#05081a');
    g.fillStyle=lg; g.fillRect(x0,0,dir*pw,h);
    var gx=x0+dir*pw*0.5;
    g.save(); g.strokeStyle='rgba(60,80,150,0.34)'; g.lineWidth=P(3);
    g.beginPath(); g.moveTo(gx-dir*P(24),0); g.lineTo(gx-dir*P(24),h); g.stroke();
    g.beginPath(); g.moveTo(gx+dir*P(24),0); g.lineTo(gx+dir*P(24),h); g.stroke();
    g.restore();
    g.save(); g.globalAlpha=0.5;
    for(var i=0;i<7;i++){
      var yy=h*(0.10+i*0.135);
      goldStar(g,gx,yy,P(7.5),0.5);
      g.strokeStyle='rgba(58,76,142,0.5)'; g.lineWidth=P(1.5);
      g.beginPath(); g.moveTo(gx-dir*P(30),yy+h*0.0675); g.lineTo(gx+dir*P(30),yy+h*0.0675); g.stroke();
    }
    g.restore();
  }
  pillar(0,1); pillar(w,-1);
}
/* ============================ 主场景 ============================ */
function drawScene(g,w,h,cfg){
  cfg=cfg||{};
  var warm     = cfg.warm==null?1:cfg.warm;
  var shaft    = cfg.shaft==null?0:cfg.shaft;
  var shaftMode= cfg.shaftMode||'rich';
  var shaftX   = cfg.shaftX==null?0.30:cfg.shaftX;
  var winMode  = cfg.winMode||'glow';
  var pool     = cfg.pool==null?0:cfg.pool;
  var vig      = cfg.vig==null?0.7:cfg.vig;
  var vigTB    = cfg.vigTB||false;
  var lantern  = cfg.lantern==null?1:cfg.lantern;
  var bloom    = cfg.bloom==null?0:cfg.bloom;
  var grade    = cfg.grade||'none';
  var fog      = cfg.fog==null?0:cfg.fog;
  var S=h/540, P=function(v){return v*S;};
  var FLOOR=P(392);
  var i;
  /* 底 */
  var bg=g.createLinearGradient(0,0,0,h);
  bg.addColorStop(0,PAL.skyTop); bg.addColorStop(1,PAL.skyBot);
  g.fillStyle=bg; g.fillRect(0,0,w,h);
  /* 后墙 */
  var wg=g.createLinearGradient(0,0,0,FLOOR);
  wg.addColorStop(0,PAL.wallLo); wg.addColorStop(1,PAL.wallHi);
  g.fillStyle=wg; g.fillRect(0,0,w,FLOOR);
  /* 墙面竖向分格 */
  g.save(); g.strokeStyle='rgba(70,92,164,0.13)'; g.lineWidth=P(2);
  for(i=0;i<12;i++){var px=w*(0.055+i*0.081); g.beginPath(); g.moveTo(px,P(40)); g.lineTo(px,FLOOR); g.stroke();}
  g.restore();
  /* 墙裙分界 */
  g.save();
  var wl=g.createLinearGradient(0,P(352),0,P(392));
  wl.addColorStop(0,'rgba(10,14,36,0)'); wl.addColorStop(1,'rgba(8,11,30,0.85)');
  g.fillStyle=wl; g.fillRect(0,P(352),w,P(40));
  g.strokeStyle='rgba(92,116,190,0.22)'; g.lineWidth=P(2.4);
  g.beginPath(); g.moveTo(0,P(392)); g.lineTo(w,P(392)); g.stroke();
  g.restore();
  /* 地面 */
  var fg=g.createLinearGradient(0,FLOOR,0,h);
  fg.addColorStop(0,'#141b40'); fg.addColorStop(0.45,'#0b1130'); fg.addColorStop(1,'#05081c');
  g.fillStyle=fg; g.fillRect(0,FLOOR,w,h-FLOOR);
  g.save();
  /* 近墙的亮石带 */
  var sb=g.createLinearGradient(0,FLOOR,0,FLOOR+P(70));
  sb.addColorStop(0,'rgba(64,84,152,0.30)'); sb.addColorStop(1,'rgba(40,56,116,0)');
  g.fillStyle=sb; g.fillRect(0,FLOOR,w,P(70));
  /* 透视地砖缝 */
  g.strokeStyle='rgba(86,110,186,0.085)'; g.lineWidth=P(1.6);
  var vpx=w*0.5;
  for(i=-7;i<=7;i++){
    g.beginPath(); g.moveTo(vpx+i*w*0.075,FLOOR); g.lineTo(vpx+i*w*0.30,h); g.stroke();
  }
  for(i=1;i<=4;i++){
    var t=i/4.6, yy=FLOOR+(h-FLOOR)*t*t;
    g.globalAlpha=0.9-t*0.55;
    g.beginPath(); g.moveTo(0,yy); g.lineTo(w,yy); g.stroke();
  }
  g.restore();
  /* 窗 */
  var wcx=[w*0.30,w*0.50,w*0.70];
  var winW=P(126), winBot=P(336), ah=P(168), tip=P(76);
  for(i=0;i<3;i++){
    var x=wcx[i]-winW/2;
    g.save(); gothicArch(g,x,winBot,winW,ah,tip); g.clip();
    var sg=g.createLinearGradient(0,winBot-ah-tip,0,winBot);
    sg.addColorStop(0,PAL.winA); sg.addColorStop(0.62,PAL.winB); sg.addColorStop(1,PAL.winC);
    g.fillStyle=sg; g.fillRect(x,winBot-ah-tip,winW,ah+tip);
    /* 地平线亮带（远处天光），取代云朵避免糊成斑 */
    g.save(); g.globalCompositeOperation='lighter';
    var hb=g.createLinearGradient(0,winBot-winW*0.62,0,winBot);
    hb.addColorStop(0,'rgba(220,238,255,0)');
    hb.addColorStop(0.62,'rgba(214,234,255,0.11)');
    hb.addColorStop(1,'rgba(232,244,255,0.22)');
    g.fillStyle=hb; g.fillRect(x,winBot-winW*0.62,winW,winW*0.62);
    g.restore();
    /* 窗棂 */
    g.strokeStyle='rgba(8,12,32,0.82)'; g.lineWidth=P(4.5);
    g.beginPath(); g.moveTo(x+winW/2,winBot-ah-tip); g.lineTo(x+winW/2,winBot); g.stroke();
    for(k=0;k<3;k++){var ly=winBot-ah*(0.38+k*0.30); g.beginPath(); g.moveTo(x,ly); g.lineTo(x+winW,ly); g.stroke();}
    /* 内阴影（左右） */
    var iv=g.createLinearGradient(x,0,x+winW,0);
    iv.addColorStop(0,'rgba(6,9,26,0.62)'); iv.addColorStop(0.26,'rgba(6,9,26,0)');
    iv.addColorStop(0.74,'rgba(6,9,26,0)'); iv.addColorStop(1,'rgba(6,9,26,0.62)');
    g.fillStyle=iv; g.fillRect(x,winBot-ah-tip,winW,ah+tip);
    g.restore();
    g.save(); gothicArch(g,x,winBot,winW,ah,tip);
    g.strokeStyle='#2c3a72'; g.lineWidth=P(6); g.stroke();
    g.strokeStyle='rgba(120,160,230,0.35)'; g.lineWidth=P(1.6); g.stroke();
    g.restore();
    /* 窗台 */
    g.save();
    g.fillStyle='#1d2752'; g.fillRect(x-P(12),winBot,P(winW+P(24)),P(11));
    g.fillStyle='#28356c'; g.fillRect(x-P(15),winBot+P(11),P(winW+P(30)),P(5));
    g.fillStyle='rgba(8,12,32,0.5)'; g.fillRect(x-P(15),winBot+P(16),P(winW+P(30)),P(5));
    g.restore();
  }
  /* 立柱 */
  function column(cx,topY,cw,star){
    var lg=g.createLinearGradient(cx-cw/2,0,cx+cw/2,0);
    lg.addColorStop(0,'#070a1e'); lg.addColorStop(0.30,'#182050');
    lg.addColorStop(0.58,'#101740'); lg.addColorStop(1,'#05081c');
    g.fillStyle=lg; g.fillRect(cx-cw/2,topY,cw,FLOOR-topY);
    g.fillStyle='#1c2658'; g.fillRect(cx-cw/2-P(10),topY,P(cw+P(20)),P(22));
    g.fillStyle='#243066'; g.fillRect(cx-cw/2-P(7),topY-P(10),P(cw+P(14)),P(11));
    if(star){goldStar(g,cx,topY+P(54),P(10),0.92); goldStar(g,cx,topY+P(54)+P(112),P(6.5),0.75);}
  }
  column(w*0.20,P(66),P(42),true);
  column(w*0.40,P(66),P(40),true);
  column(w*0.60,P(66),P(40),true);
  column(w*0.80,P(66),P(42),true);
  /* 窗光外溢 */
  g.save(); g.globalCompositeOperation='lighter';
  if(winMode!=='flat'){
    var wa=(winMode==='glow'?0.22:winMode==='rays'?0.19:0.11)*warm;
    for(i=0;i<3;i++) addGlow(g,wcx[i],winBot-ah*0.6,P(205),wa,'140,180,238');
  }
  g.restore();
  /* 光柱（在人物之前 → 人物遮挡它） */
  drawShaft(g,w,h,shaftMode,shaft,shaftX,cfg.shaftTop,cfg.shaftHalfW);
  /* 窗下地面光带 */
  if(winMode==='rays'){
    g.save(); g.globalCompositeOperation='lighter';
    for(i=0;i<3;i++){
      if(cfg.raysOff) break;
      g.save(); g.filter='blur(16px)'; g.globalAlpha=0.13*warm;
      var rg=g.createLinearGradient(wcx[i],winBot,wcx[i]-P(30),FLOOR+P(30));
      rg.addColorStop(0,'rgba(176,216,255,0.95)'); rg.addColorStop(1,'rgba(176,216,255,0)');
      g.fillStyle=rg;
      g.beginPath(); g.moveTo(wcx[i]-winW*0.5,winBot); g.lineTo(wcx[i]+winW*0.5,winBot);
      g.lineTo(wcx[i]-P(14),FLOOR+P(30)); g.lineTo(wcx[i]-P(120),FLOOR+P(30)); g.closePath(); g.fill();
      g.restore();
    }
    g.restore();
  }
  /* 地面光池 */
  var lx=w*0.755, ly=P(198);
  if(pool>0){
    g.save(); g.globalCompositeOperation='lighter';
    var prx=P(240)*(cfg.poolBig?1.6:1), pry=P(78)*(cfg.poolBig?1.5:1);
    g.translate(lx,P(452)); g.scale(1,pry/prx);
    var pgr=g.createRadialGradient(0,0,0,0,0,prx);
    pgr.addColorStop(0,'rgba(255,224,168,'+(0.62*pool*warm)+')');
    pgr.addColorStop(0.18,'rgba(255,196,116,'+(0.44*pool*warm)+')');
    pgr.addColorStop(0.50,'rgba(255,164,80,'+(0.19*pool*warm)+')');
    pgr.addColorStop(1,'rgba(255,140,58,0)');
    g.fillStyle=pgr; g.beginPath(); g.arc(0,0,prx,0,Math.PI*2); g.fill();
    g.restore();
  }
  /* 人物 */
  drawFigure(g,cfg.figX==null?w*0.452:cfg.figX,cfg.figFeet==null?P(474):cfg.figFeet,cfg.figH==null?P(196):cfg.figH,0.95,cfg.figWarm==null?1:cfg.figWarm);
  /* 提灯 */
  var lgr=g.createLinearGradient(0,P(84),0,ly);
  lgr.addColorStop(0,'rgba(20,26,58,0)'); lgr.addColorStop(1,'rgba(30,38,78,0.95)');
  g.strokeStyle=lgr; g.lineWidth=P(3);
  g.beginPath(); g.moveTo(lx,P(84)); g.lineTo(lx,ly-P(16)); g.stroke();
  g.save(); g.globalCompositeOperation='lighter';
  /* 灯把右侧立柱照暖（暖色“污染”邻近冷物体，是原神的关键手感） */
  if(lantern>0&&warm>0){
    var cb=g.createLinearGradient(0,0,0,FLOOR);
    cb.addColorStop(0,'rgba(255,176,96,0)');
    cb.addColorStop(0.62,'rgba(255,168,86,'+(0.10*warm)+')');
    cb.addColorStop(1,'rgba(255,150,70,'+(0.05*warm)+')');
    g.fillStyle=cb; g.fillRect(lx-P(120),0,P(240),FLOOR);
    addGlow(g,lx+P(90),ly+P(60),P(150),0.16*lantern*warm,'255,168,84');
  }
  g.restore();
  g.save(); g.globalCompositeOperation='lighter';
  if(lantern>0){
    addGlow(g,lx,ly+P(6),P(230),0.36*lantern*warm,'255,166,70');
    addGlow(g,lx,ly+P(6),P(104),0.42*lantern*warm,'255,188,102');
    addGlow(g,lx,ly+P(6),P(58),0.82*lantern*warm,'255,210,138');
  }
  g.restore();
  g.save();
  g.fillStyle='#151d44'; g.fillRect(lx-P(14),ly-P(19),P(28),P(36));
  g.fillStyle=PAL.gold; g.fillRect(lx-P(16),ly-P(22),P(32),P(5));
  g.fillStyle=PAL.gold; g.fillRect(lx-P(16),ly+P(14),P(32),P(5));
  g.save(); g.globalCompositeOperation='lighter'; addGlow(g,lx,ly+P(4),P(30),0.95*warm,'255,214,150'); g.restore();
  g.fillStyle='#fff3d0'; g.beginPath(); g.ellipse(lx,ly+P(3),P(6.5),P(10),0,0,Math.PI*2); g.fill();
  g.restore();
  /* 灯的竖向地面倒影 */
  if(lantern>0&&pool>0){
    g.save(); g.globalCompositeOperation='lighter';
    var rfx=g.createLinearGradient(0,P(452),0,h);
    rfx.addColorStop(0,'rgba(255,196,120,'+(0.11*pool*warm)+')');
    rfx.addColorStop(0.55,'rgba(255,168,88,'+(0.06*pool*warm)+')');
    rfx.addColorStop(1,'rgba(255,150,70,0)');
    g.filter='blur('+P(16)+'px)';
    g.fillStyle=rfx;
    g.beginPath(); g.moveTo(lx-P(34),P(452)); g.lineTo(lx+P(34),P(452));
    g.lineTo(lx+P(96),h); g.lineTo(lx-P(96),h); g.closePath(); g.fill();
    g.restore();
  }
  /* 泛光 */
  if(bloom>0){
    g.save(); g.globalCompositeOperation='lighter';
    addGlow(g,lx,ly,P(370),0.13*bloom*warm,'255,178,92');
    for(i=0;i<3;i++) addGlow(g,wcx[i],winBot-ah*0.6,P(320),0.075*bloom,'152,196,250');
    g.restore();
  }
  /* 浮尘 */
  g.save(); g.globalCompositeOperation='lighter';
  for(i=0;i<110;i++){
    var dx=hs(i*3.1)*w, dy=hs(i*7.7)*h*0.9, rr=(0.8+hs(i*11.3)*2.0)*(0.55+(h/540)*0.45);
    addGlow(g,dx,dy,rr*4.5,(0.07+0.24*hs(i*5.5))*(0.5+0.5*warm),'255,228,192');
  }
  g.restore();
  if(fog>0){
    g.save(); g.globalCompositeOperation='lighter';
    var fgr=g.createLinearGradient(0,0,0,FLOOR+P(40));
    fgr.addColorStop(0,'rgba(96,132,206,'+(0.16*fog)+')');
    fgr.addColorStop(0.55,'rgba(70,100,170,'+(0.10*fog)+')');
    fgr.addColorStop(1,'rgba(50,72,140,0)');
    g.fillStyle=fgr; g.fillRect(0,0,w,FLOOR+P(40)); g.restore();
  }
  drawFrame(g,w,h,S);
  /* 色彩分级 */
  if(grade==='split'){
    g.save(); g.globalCompositeOperation='multiply';
    var sg2=g.createLinearGradient(0,0,0,h);
    sg2.addColorStop(0,'#b8c8ff'); sg2.addColorStop(1,'#8f9fd8');
    g.fillStyle=sg2; g.fillRect(0,0,w,h); g.restore();
    g.save(); g.globalCompositeOperation='lighter'; g.globalAlpha=0.06;
    g.fillStyle='#3a2a5a'; g.fillRect(0,0,w,h); g.restore();
  }
  vignette(g,w,h,vig,vigTB);
}