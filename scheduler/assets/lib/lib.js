// ============================================================================
//  eface.js — 卡通面部表情「参数化」绘制库   (Canvas 2D / 确定性 / 零依赖)
//  核心思想：把一张脸拆成 ~20 个标量参数 + 若干枚举，表情 = 参数向量
// ============================================================================
var W = 1920, H = 1080;
var TAU = Math.PI * 2, DEG = Math.PI / 180;
var FONT = '"WenQuanYi Zen Hei","Droid Sans Fallback",sans-serif';
var cvs = document.getElementById('c');
var g = cvs.getContext('2d');

// ---------- 数学 ----------
function lerp(a,b,t){ return a+(b-a)*t; }
function clamp(v,a,b){ return v<a?a:(v>b?b:v); }
function hash(i){ var x=Math.sin(i*127.1+311.7)*43758.5453123; return x-Math.floor(x); }
function easeInOut(t){ return t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2; }
function easeOut(t){ return 1-Math.pow(1-t,3); }
function easeIn(t){ return t*t*t; }
function easeOutBack(t){ var c1=1.70158,c3=c1+1; return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2); }
function easeOutElastic(t){ var c4=TAU/3; return t===0?0:(t===1?1:Math.pow(2,-10*t)*Math.sin((t*10-.75)*c4)+1); }

// ---------- 颜色 ----------
function hex2rgb(h){ h=h.replace('#',''); if(h.length===3) h=h[0]+h[0]+h[1]+h[1]+h[2]+h[2];
  var n=parseInt(h,16); return [(n>>16)&255,(n>>8)&255,n&255]; }
function rgb2hex(c){ return '#'+c.map(function(v){ var s=Math.round(clamp(v,0,255)).toString(16); return s.length<2?'0'+s:s; }).join(''); }
function shade(hex,t){ var c=hex2rgb(hex);
  if(t<0) return rgb2hex(c.map(function(v){return v*(1+t);}));
  return rgb2hex(c.map(function(v){return v+(255-v)*t;})); }
function mixHex(a,b,t){ var A=hex2rgb(a),B=hex2rgb(b); return rgb2hex(A.map(function(v,i){return v+(B[i]-v)*t;})); }
// 关键：卡通阴影不是「变黑」，而是「变暗 + 偏冷色」——这条让色块立刻有体积
function shadowOf(hex,amt){ return mixHex(shade(hex,-(amt||0.16)), '#4a3d78', 0.30); }
function lightOf(hex,amt){ return mixHex(shade(hex,amt||0.25), '#ffe9c0', 0.28); }

// ---------- 路径基元 ----------
// Catmull-Rom -> 三次贝塞尔：让 8~14 个锚点变成有机曲线（比 arc 更像手绘）
function catmull(g,pts,closed,tension){
  var n=pts.length, t=(tension===undefined?1:tension);
  g.moveTo(pts[0][0],pts[0][1]);
  var last = closed?n:n-1;
  for(var i=0;i<last;i++){
    var p0=pts[(i-1+n)%n], p1=pts[i%n], p2=pts[(i+1)%n], p3=pts[(i+2)%n];
    g.bezierCurveTo(p1[0]+(p2[0]-p0[0])/6*t, p1[1]+(p2[1]-p0[1])/6*t,
                    p2[0]-(p3[0]-p1[0])/6*t, p2[1]-(p3[1]-p1[1])/6*t, p2[0],p2[1]);
  }
  if(closed) g.closePath();
}
// 采样成密集折线，用于「变宽度描边」
function catmullPts(pts,closed,tension,sp){
  var n=pts.length, t=(tension===undefined?1:tension), s=sp||14, out=[];
  var last=closed?n:n-1;
  for(var i=0;i<last;i++){
    var p0=pts[(i-1+n)%n], p1=pts[i%n], p2=pts[(i+1)%n], p3=pts[(i+2)%n];
    var c1x=p1[0]+(p2[0]-p0[0])/6*t, c1y=p1[1]+(p2[1]-p0[1])/6*t;
    var c2x=p2[0]-(p3[0]-p1[0])/6*t, c2y=p2[1]-(p3[1]-p1[1])/6*t;
    for(var j=0;j<s;j++){ var u=j/s,v=1-u;
      out.push([ v*v*v*p1[0]+3*v*v*u*c1x+3*v*u*u*c2x+u*u*u*p2[0],
                 v*v*v*p1[1]+3*v*v*u*c1y+3*v*u*u*c2y+u*u*u*p2[1] ]); }
  }
  if(closed) out.push([out[0][0],out[0][1]]); else out.push([pts[n-1][0],pts[n-1][1]]);
  return out;
}
function ellPts(cx,cy,rx,ry,rot,a0,a1,n){
  var out=[],N=n||64, r=(rot||0), A0=(a0===undefined?0:a0), A1=(a1===undefined?TAU:a1);
  for(var i=0;i<=N;i++){ var a=A0+(A1-A0)*i/N, x=Math.cos(a)*rx, y=Math.sin(a)*ry;
    out.push([cx+x*Math.cos(r)-y*Math.sin(r), cy+x*Math.sin(r)+y*Math.cos(r)]); }
  return out;
}
function fillPts(g,pts,color){ g.fillStyle=color; g.beginPath(); g.moveTo(pts[0][0],pts[0][1]);
  for(var i=1;i<pts.length;i++) g.lineTo(pts[i][0],pts[i][1]); g.closePath(); g.fill(); }
function fillPath(g,color,fn){ g.fillStyle=color; g.beginPath(); fn(g); g.fill(); }
function strokePath(g,color,lw,fn){ g.strokeStyle=color; g.lineWidth=lw; g.lineCap='round'; g.lineJoin='round';
  g.beginPath(); fn(g); g.stroke(); }
// ★ 变宽度描边：把折线按宽度渐变逐段描——模拟蘸水笔的粗细变化（精致度第一杀手锏）
function taperStroke(g,pts,wFn,color,closed){
  g.strokeStyle=color; g.lineCap='round'; g.lineJoin='round';
  var n=pts.length-1;
  for(var i=0;i<n;i++){
    var t=(i+0.5)/n, w=wFn(t);
    if(w<=0.05) continue;
    g.lineWidth=w; g.beginPath(); g.moveTo(pts[i][0],pts[i][1]); g.lineTo(pts[i+1][0],pts[i+1][1]); g.stroke();
  }
}
function roundRect(g,x,y,w,h,r){ r=Math.min(r,Math.abs(w)/2,Math.abs(h)/2);
  g.beginPath(); g.moveTo(x+r,y); g.lineTo(x+w-r,y); g.quadraticCurveTo(x+w,y,x+w,y+r);
  g.lineTo(x+w,y+h-r); g.quadraticCurveTo(x+w,y+h,x+w-r,y+h); g.lineTo(x+r,y+h);
  g.quadraticCurveTo(x,y+h,x,y+h-r); g.lineTo(x,y+r); g.quadraticCurveTo(x,y,x+r,y); g.closePath(); }

// ---------- 版式（实验图纸） ----------
function bg(color){ g.fillStyle=color||'#14131f'; g.fillRect(0,0,W,H); }
function vignette(cx,cy,r,color,a){ var rg=g.createRadialGradient(cx,cy,0,cx,cy,r);
  rg.addColorStop(0,color); rg.addColorStop(1,'rgba(0,0,0,0)');
  g.globalAlpha=(a===undefined?1:a); g.fillStyle=rg; g.fillRect(0,0,W,H); g.globalAlpha=1; }
function card(x,y,w,h,r,fill,stroke){ if(fill){ g.fillStyle=fill; roundRect(g,x,y,w,h,r||14); g.fill(); }
  if(stroke){ g.strokeStyle=stroke; g.lineWidth=2; roundRect(g,x,y,w,h,r||14); g.stroke(); } }
function text(str,x,y,size,color,align,weight){ g.fillStyle=color||'#e8e2f0';
  g.font=(weight||600)+' '+size+'px '+FONT; g.textAlign=align||'left'; g.textBaseline='alphabetic';
  g.fillText(str,x,y); }
function cap(str,x,y,size,color,align){ text(str,x,y,size||22,color||'#9b93b5',align||'center',500); }
// 细颗粒：一层低透明度确定性噪点，消除「纯色块的塑料感」
function grain(alpha,step){ g.save(); g.globalAlpha=alpha; g.fillStyle='#ffffff';
  for(var y=0;y<H;y+=step){ for(var x=0;x<W;x+=step){ var r=hash(x*7919+y*104729);
    if(r>0.62){ g.globalAlpha=alpha*(r-0.62)/0.38; g.fillRect(x,y,1.4,1.4); } } } g.restore(); }

// ---------- 版式辅助 ----------
// 在指定位置画一张脸（覆盖 cx/cy，可选裁剪矩形）
function faceAt(x,y,s,p,cx2,cy2,cw2,ch2){
  g.save();
  if(cx2!==undefined){ roundRect(g,cx2,cy2,cw2,ch2,16); g.clip(); }
  g.translate(x,y); g.scale(s,s); p.cx=0; p.cy=0; drawFace(p);
  g.restore();
}
function chip(str,x,y,color,align,size){ text(str,x,y,size||16,color||'#8d86ab',align||'center',500); }
function panelTitle(str,x,y,color){ text(str,x,y,17,color||'#6f6790','left',700); }
function rule(x1,y1,x2,y2,color,a){ g.save(); g.globalAlpha=(a===undefined?1:a); g.strokeStyle=color; g.lineWidth=1.5;
  g.beginPath(); g.moveTo(x1,y1); g.lineTo(x2,y2); g.stroke(); g.restore(); }


// ---------- 单部件绘制辅助（用于「组件解剖」版式）----------
function cloneP(p){ var q=P(); for(var k in p) q[k]=p[k]; return q; }
function eyeAt(x,y,s,p,side){
  g.save(); g.translate(x,y); g.scale(s,s);
  var q=cloneP(p); q.cx=0; q.cy=0; q.eyeDX=0; q.eyeDY=0;
  drawEye(q, side||1); g.restore();
}
function browAt(x,y,s,p,side){
  g.save(); g.translate(x,y); g.scale(s,s);
  var q=cloneP(p); q.cx=0; q.cy=0; q.eyeDX=0; q.eyeDY=0;
  drawBrow(q, side||1); g.restore();
}
function mouthAt(x,y,s,p){
  g.save(); g.translate(x,y); g.scale(s,s);
  var q=cloneP(p); q.cx=0; q.cy=0; q.mouthDY=0;
  drawMouth(q); g.restore();
}
// 参数刻度条（显示某个参数在 [lo,hi] 的当前值位置）
function meter(x,y,w,val,lo,hi,color,label){
  g.save();
  g.fillStyle='#2a2740'; roundRect(g,x,y,w,8,4); g.fill();
  var t=clamp((val-lo)/(hi-lo),0,1);
  g.fillStyle=color||'#8f7fe8'; roundRect(g,x,y,Math.max(6,w*t),8,4); g.fill();
  g.restore();
  if(label) text(label,x,y-8,14,'#7a7396','left',500);
}

